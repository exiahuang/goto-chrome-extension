import React, { useState, useEffect, useRef, useMemo } from 'react';

const translations = {
    en: {
        placeholder: "Search tabs, bookmarks, history...",
        help: "↑↓ Select　Enter Open　Esc Close",
        tabs: "📑 Tabs",
        bookmarks: "⭐ Bookmarks",
        history: "🕒 History",
        noResults: "No results found",
        limit: "Limit:"
    },
    jp: {
        placeholder: "タブ、ブックマーク、履歴を検索...",
        help: "↑↓ 選択　Enter 開く　Esc 閉じる",
        tabs: "📑 タブ",
        bookmarks: "⭐ ブックマーク",
        history: "🕒 履歴",
        noResults: "結果が見つかりません",
        limit: "表示件数:"
    }
};

function App() {
    const [query, setQuery] = useState('');
    const [lang, setLang] = useState('en');
    const [limit, setLimit] = useState(50);
    const [items, setItems] = useState({ tabs: [], bookmarks: [], history: [] });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const resultListRef = useRef(null);

    const t = translations[lang];

    // Flat results for keyboard navigation
    const flatResults = useMemo(() => {
        const res = [];
        if (items.tabs.length > 0) {
            items.tabs.forEach(item => res.push({ ...item, type: 'tab' }));
        }
        if (items.bookmarks.length > 0) {
            items.bookmarks.forEach(item => res.push({ ...item, type: 'bookmark' }));
        }
        if (items.history.length > 0) {
            items.history.forEach(item => res.push({ ...item, type: 'history' }));
        }
        return res;
    }, [items]);

    useEffect(() => {
        // Load initial settings
        chrome.storage.local.get(['lang', 'limit'], (settings) => {
            if (settings.lang) setLang(settings.lang);
            if (settings.limit) setLimit(settings.limit);
        });
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        loadItems(query, limit);
        setSelectedIndex(0);
    }, [query, limit]);

    const loadItems = async (searchQuery, currentLimit) => {
        if (!searchQuery) {
            const [tabs, bookmarks, history] = await Promise.all([
                new Promise(resolve => chrome.tabs.query({}, resolve)),
                new Promise(resolve => chrome.bookmarks.getRecent(currentLimit, resolve)),
                new Promise(resolve => chrome.history.search({ text: '', maxResults: currentLimit }, resolve))
            ]);
            setItems({
                tabs: tabs.slice(0, currentLimit),
                bookmarks,
                history
            });
        } else {
            const [tabs, bookmarks, history] = await Promise.all([
                new Promise(resolve => {
                    chrome.tabs.query({}, allTabs => {
                        const filtered = allTabs.filter(t =>
                            (t.title && t.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (t.url && t.url.toLowerCase().includes(searchQuery.toLowerCase()))
                        );
                        resolve(filtered.slice(0, currentLimit));
                    });
                }),
                new Promise(resolve => chrome.bookmarks.search(searchQuery, results => resolve(results.slice(0, currentLimit)))),
                new Promise(resolve => chrome.history.search({ text: searchQuery, maxResults: currentLimit }, resolve))
            ]);
            setItems({ tabs, bookmarks, history });
        }
    };

    const getFaviconUrl = (url) => {
        if (!url) return '';
        try {
            const origin = new URL(url).origin;
            return `https://www.google.com/s2/favicons?domain=${origin}&size=32`;
        } catch (e) {
            return '';
        }
    };

    const openItem = (item) => {
        if (item.type === 'tab') {
            chrome.tabs.update(item.id, { active: true });
            chrome.windows.update(item.windowId, { focused: true });
        } else {
            chrome.tabs.create({ url: item.url });
        }
        window.close();
    };

    const handleKeyDown = (e) => {
        if (flatResults.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % flatResults.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
        } else if (e.key === "Enter") {
            if (flatResults[selectedIndex]) {
                openItem(flatResults[selectedIndex]);
            }
        } else if (e.key === "Escape") {
            window.close();
        }
    };

    useEffect(() => {
        // Scroll active item into view
        const activeEl = resultListRef.current?.querySelector('.result-item.active');
        activeEl?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    const toggleLang = () => {
        const newLang = lang === 'en' ? 'jp' : 'en';
        setLang(newLang);
        chrome.storage.local.set({ lang: newLang });
    };

    const handleLimitChange = (e) => {
        const val = parseInt(e.target.value, 10);
        if (val > 0) {
            setLimit(val);
            chrome.storage.local.set({ limit: val });
        }
    };

    return (
        <>
            <div className="search-container">
                <input
                    ref={inputRef}
                    className="search-input"
                    placeholder={t.placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
            </div>
            <ul className="results-list" ref={resultListRef}>
                {items.tabs.length > 0 && (
                    <>
                        <li className="section-header">{t.tabs}</li>
                        {items.tabs.map((item, idx) => (
                            <ResultItem
                                key={`tab-${item.id}`}
                                item={item}
                                active={flatResults[selectedIndex]?.id === item.id && flatResults[selectedIndex]?.type === 'tab'}
                                onClick={() => openItem({ ...item, type: 'tab' })}
                                getFaviconUrl={getFaviconUrl}
                            />
                        ))}
                    </>
                )}
                {items.bookmarks.length > 0 && (
                    <>
                        <li className="section-header">{t.bookmarks}</li>
                        {items.bookmarks.map((item, idx) => (
                            <ResultItem
                                key={`bookmark-${item.id}`}
                                item={item}
                                active={flatResults[selectedIndex]?.id === item.id && flatResults[selectedIndex]?.type === 'bookmark'}
                                onClick={() => openItem({ ...item, type: 'bookmark' })}
                                getFaviconUrl={getFaviconUrl}
                            />
                        ))}
                    </>
                )}
                {items.history.length > 0 && (
                    <>
                        <li className="section-header">{t.history}</li>
                        {items.history.map((item, idx) => (
                            <ResultItem
                                key={`history-${item.id || item.url}`}
                                item={item}
                                active={flatResults[selectedIndex]?.url === item.url && flatResults[selectedIndex]?.id === item.id && flatResults[selectedIndex]?.type === 'history'}
                                onClick={() => openItem({ ...item, type: 'history' })}
                                getFaviconUrl={getFaviconUrl}
                            />
                        ))}
                    </>
                )}
                {flatResults.length === 0 && (
                    <li className="empty-state">{t.noResults}</li>
                )}
            </ul>
            <div className="footer">
                <div className="footer-left">
                    <div className="lang-toggle" onClick={toggleLang}>JP/EN</div>
                    <div className="limit-box">
                        <span>{t.limit}</span>
                        <input
                            type="number"
                            className="limit-input"
                            value={limit}
                            onChange={handleLimitChange}
                            min="10"
                            max="200"
                            step="10"
                        />
                    </div>
                </div>
                <div className="help">{t.help}</div>
            </div>
        </>
    );
}

function ResultItem({ item, active, onClick, getFaviconUrl }) {
    const iconUrl = item.favIconUrl || getFaviconUrl(item.url);
    const title = item.title || item.url || "Untitled";

    return (
        <li className={`result-item ${active ? 'active' : ''}`} onClick={onClick}>
            <div className="icon">
                {iconUrl ? (
                    <img src={iconUrl} width="16" height="16" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '📄'; }} />
                ) : '📄'}
            </div>
            <div className="content">
                <div className="title">{title}</div>
                <div className="url">{item.url || ""}</div>
            </div>
        </li>
    );
}

export default App;
