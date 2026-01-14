const input = document.getElementById("search");
const resultsList = document.getElementById("results");
const langToggle = document.getElementById("lang-toggle");
const helpText = document.getElementById("help-text");
const limitInput = document.getElementById("limit-input");
const limitLabel = document.getElementById("limit-label");

let currentLang = 'en';
let itemLimit = 50;
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

let allItems = {
  tabs: [],
  bookmarks: [],
  history: []
};
let flatResults = [];
let selectedIndex = 0;

// Initialize settings
async function initSettings() {
  const settings = await chrome.storage.local.get(['lang', 'limit']);
  currentLang = settings.lang || 'en';
  itemLimit = settings.limit || 50;
  limitInput.value = itemLimit;
  applyLang();
}

function applyLang() {
  input.placeholder = translations[currentLang].placeholder;
  helpText.textContent = translations[currentLang].help;
  limitLabel.textContent = translations[currentLang].limit;
  updateResults();
}

langToggle.addEventListener('click', async () => {
  currentLang = currentLang === 'en' ? 'jp' : 'en';
  await chrome.storage.local.set({ lang: currentLang });
  applyLang();
});

limitInput.addEventListener('change', async (e) => {
  const val = parseInt(e.target.value, 10);
  if (val > 0) {
    itemLimit = val;
    await chrome.storage.local.set({ limit: itemLimit });
    loadDefaultItems(); // Refresh defaults with new limit
  }
});

async function loadDefaultItems() {
  const [tabs, bookmarks, history] = await Promise.all([
    new Promise(resolve => chrome.tabs.query({}, resolve)),
    new Promise(resolve => chrome.bookmarks.getRecent(itemLimit, resolve)),
    new Promise(resolve => chrome.history.search({ text: '', maxResults: itemLimit }, resolve))
  ]);

  // Keep tabs limited to the user's preference for the 'recent' view context
  allItems.tabs = tabs.slice(0, itemLimit);
  allItems.bookmarks = bookmarks;
  allItems.history = history;

  updateResults();
}

async function performSearch(query) {
  if (!query) {
    loadDefaultItems();
    return;
  }

  const [tabs, bookmarks, history] = await Promise.all([
    new Promise(resolve => {
      chrome.tabs.query({}, allTabs => {
        const filtered = allTabs.filter(t =>
          (t.title && t.title.toLowerCase().includes(query.toLowerCase())) ||
          (t.url && t.url.toLowerCase().includes(query.toLowerCase()))
        );
        resolve(filtered.slice(0, itemLimit));
      });
    }),
    new Promise(resolve => chrome.bookmarks.search(query, results => resolve(results.slice(0, itemLimit)))),
    new Promise(resolve => chrome.history.search({ text: query, maxResults: itemLimit }, resolve))
  ]);

  allItems.tabs = tabs;
  allItems.bookmarks = bookmarks;
  allItems.history = history;

  updateResults();
}

function getFaviconUrl(url) {
  if (!url) return '';
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&size=32`;
  } catch (e) {
    return '';
  }
}

function updateResults() {
  resultsList.innerHTML = "";
  flatResults = [];

  const sections = [
    { title: translations[currentLang].tabs, data: allItems.tabs, type: 'tab' },
    { title: translations[currentLang].bookmarks, data: allItems.bookmarks, type: 'bookmark' },
    { title: translations[currentLang].history, data: allItems.history, type: 'history' }
  ];

  let hasTotalResults = false;

  sections.forEach(section => {
    if (section.data.length > 0) {
      hasTotalResults = true;
      const header = document.createElement("li");
      header.className = "section-header";
      header.textContent = section.title;
      resultsList.appendChild(header);

      section.data.forEach(item => {
        const li = document.createElement("li");
        li.className = "result-item";

        const title = item.title || item.url || "Untitled";
        const iconUrl = item.favIconUrl || getFaviconUrl(item.url);

        li.innerHTML = `
          <div class="icon">
            ${iconUrl ? `<img src="${iconUrl}" width="16" height="16" onerror="this.style.display='none'">` : '📄'}
          </div>
          <div class="content">
            <div class="title">${escapeHtml(title)}</div>
            <div class="url">${escapeHtml(item.url || "")}</div>
          </div>
        `;

        li.addEventListener('click', () => openItem(item, section.type));
        resultsList.appendChild(li);
        flatResults.push({ item, type: section.type, element: li });
      });
    }
  });

  if (!hasTotalResults) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = translations[currentLang].noResults;
    resultsList.appendChild(empty);
  }

  selectItem(Math.min(selectedIndex, Math.max(0, flatResults.length - 1)));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function selectItem(index) {
  if (flatResults[selectedIndex]) {
    flatResults[selectedIndex].element.classList.remove("active");
  }
  selectedIndex = index;
  if (flatResults[selectedIndex]) {
    const el = flatResults[selectedIndex].element;
    el.classList.add("active");
    el.scrollIntoView({ block: "nearest" });
  }
}

function openItem(item, type) {
  if (type === 'tab') {
    chrome.tabs.update(item.id, { active: true });
    chrome.windows.update(item.windowId, { focused: true });
  } else {
    chrome.tabs.create({ url: item.url });
  }
  window.close();
}

input.addEventListener("input", e => {
  selectedIndex = 0;
  performSearch(e.target.value);
});

document.addEventListener("keydown", e => {
  if (flatResults.length === 0) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectItem((selectedIndex + 1) % flatResults.length);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectItem((selectedIndex - 1 + flatResults.length) % flatResults.length);
  } else if (e.key === "Enter") {
    if (flatResults[selectedIndex]) {
      openItem(flatResults[selectedIndex].item, flatResults[selectedIndex].type);
    }
  } else if (e.key === "Escape") {
    window.close();
  }
});

// Initial load
initSettings();
loadDefaultItems();
input.focus();
