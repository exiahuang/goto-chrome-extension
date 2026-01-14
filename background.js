let searchWindowId = null;

async function toggleSearchWindow() {
  if (searchWindowId !== null) {
    try {
      await chrome.windows.remove(searchWindowId);
      searchWindowId = null;
    } catch (e) {
      // Window might have been closed manually
      openSearchWindow();
    }
  } else {
    openSearchWindow();
  }
}

async function openSearchWindow() {
  const width = 600;
  const height = 450;

  // Try to center the window
  const currentWindow = await chrome.windows.getCurrent();
  const left = Math.round(currentWindow.left + (currentWindow.width - width) / 2);
  const top = Math.round(currentWindow.top + (currentWindow.height - height) / 2);

  const window = await chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: width,
    height: height,
    left: left,
    top: top,
    focused: true
  });
  searchWindowId = window.id;
}

// Track window closure
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === searchWindowId) {
    searchWindowId = null;
  }
});

// Shortcut command
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-search') {
    toggleSearchWindow();
  }
});

// Icon click
chrome.action.onClicked.addListener(() => {
  toggleSearchWindow();
});

// Context menu for settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'customize-shortcut',
    title: 'Customize Shortcut',
    contexts: ['action']
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'customize-shortcut') {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  }
});
