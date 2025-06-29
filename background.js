// Background script for Overlay Remover extension
class OverlayRemoverBackground {
  constructor() {
    this.init();
  }

  init() {
    // Create context menu on extension startup
    chrome.runtime.onStartup.addListener(() => {
      this.createContextMenu();
    });

    // Create context menu on extension install
    chrome.runtime.onInstalled.addListener(() => {
      this.createContextMenu();
    });

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });

    // Handle messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  createContextMenu() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'remove-overlay',
        title: 'Remove Overlay Element',
        contexts: ['all']
      });

      chrome.contextMenus.create({
        id: 'whitelist-site',
        title: 'Whitelist This Site',
        contexts: ['page']
      });
    });
  }

  async handleContextMenuClick(info, tab) {
    if (info.menuItemId === 'remove-overlay') {
      // Inject script to remove overlay at clicked position
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: this.removeOverlayAtPosition,
        args: [info.pageX, info.pageY]
      });
    } else if (info.menuItemId === 'whitelist-site') {
      // Add current site to whitelist
      const url = new URL(tab.url);
      const domain = url.hostname;
      
      const result = await chrome.storage.sync.get(['whitelist']);
      const whitelist = result.whitelist || [];
      
      if (!whitelist.includes(domain)) {
        whitelist.push(domain);
        await chrome.storage.sync.set({ whitelist });
        
        // Notify content script to stop processing
        chrome.tabs.sendMessage(tab.id, {
          action: 'siteWhitelisted',
          domain: domain
        });
      }
    }
  }

  // Function to be injected for context menu overlay removal
  removeOverlayAtPosition(x, y) {
    const element = document.elementFromPoint(x, y);
    if (element && window.overlayRemover) {
      window.overlayRemover.removeSpecificOverlay(element);
    }
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'getSettings':
        const settings = await chrome.storage.sync.get(['enabled', 'whitelist']);
        sendResponse({
          enabled: settings.enabled !== false, // Default to true
          whitelist: settings.whitelist || []
        });
        break;

      case 'updateSettings':
        await chrome.storage.sync.set(request.settings);
        sendResponse({ success: true });
        break;

      case 'isWhitelisted':
        const whitelistData = await chrome.storage.sync.get(['whitelist']);
        const whitelist = whitelistData.whitelist || [];
        const url = new URL(sender.tab.url);
        const isWhitelisted = whitelist.includes(url.hostname);
        sendResponse({ isWhitelisted });
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
  }
}

// Initialize background script
new OverlayRemoverBackground();