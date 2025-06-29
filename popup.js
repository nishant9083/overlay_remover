// Popup script for Overlay Remover extension
class OverlayRemoverPopup {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
    this.loadCurrentSite();
  }

  async loadSettings() {
    this.settings = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, resolve);
    });
  }

  setupEventListeners() {
    // Toggle switch
    const enableToggle = document.getElementById('enableToggle');
    enableToggle.addEventListener('change', () => {
      this.toggleExtension(enableToggle.checked);
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.refreshCurrentTab();
    });

    // Restore button
    document.getElementById('restoreBtn').addEventListener('click', () => {
      this.restoreOverlays();
    });

    // Whitelist button
    document.getElementById('whitelistBtn').addEventListener('click', () => {
      this.whitelistCurrentSite();
    });

    // Options button
    document.getElementById('optionsBtn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // About button
    document.getElementById('aboutBtn').addEventListener('click', () => {
      this.showAbout();
    });
  }

  updateUI() {
    const enableToggle = document.getElementById('enableToggle');
    const statusText = document.getElementById('statusText');
    const whitelistCount = document.getElementById('whitelistCount');

    enableToggle.checked = this.settings.enabled;
    statusText.textContent = this.settings.enabled ? 'Active' : 'Disabled';
    statusText.style.color = this.settings.enabled ? '#28a745' : '#dc3545';
    whitelistCount.textContent = this.settings.whitelist.length;

    // Update removed count (this would need to be tracked)
    document.getElementById('removedCount').textContent = '0';
  }

  async loadCurrentSite() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      const url = new URL(tab.url);
      const domain = url.hostname;
      document.getElementById('currentSite').textContent = domain;

      // Check if current site is whitelisted
      const whitelistBtn = document.getElementById('whitelistBtn');
      if (this.settings.whitelist.includes(domain)) {
        whitelistBtn.textContent = 'Remove from Whitelist';
        whitelistBtn.classList.add('whitelisted');
      }
    }
  }

  async toggleExtension(enabled) {
    this.settings.enabled = enabled;
    
    await chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: { enabled }
    });

    // Notify content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
    }

    this.updateUI();
  }

  async refreshCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.reload(tab.id);
      window.close();
    }
  }

  async restoreOverlays() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'restoreAll' });
    }
  }

  async whitelistCurrentSite() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    const url = new URL(tab.url);
    const domain = url.hostname;
    const whitelistBtn = document.getElementById('whitelistBtn');

    if (this.settings.whitelist.includes(domain)) {
      // Remove from whitelist
      this.settings.whitelist = this.settings.whitelist.filter(site => site !== domain);
      whitelistBtn.textContent = 'Whitelist Site';
      whitelistBtn.classList.remove('whitelisted');
    } else {
      // Add to whitelist
      this.settings.whitelist.push(domain);
      whitelistBtn.textContent = 'Remove from Whitelist';
      whitelistBtn.classList.add('whitelisted');
    }

    await chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: { whitelist: this.settings.whitelist }
    });

    // Notify content script
    chrome.tabs.sendMessage(tab.id, { 
      action: 'siteWhitelisted',
      domain: domain
    });

    this.updateUI();
  }

  showAbout() {
    const aboutHtml = `
      <div style="padding: 20px; text-align: center;">
        <h3>Overlay Remover v1.0.0</h3>
        <p style="margin: 10px 0; color: #666;">
          Automatically detects and removes intrusive overlay elements from web pages.
        </p>
        <p style="margin: 10px 0; font-size: 12px; color: #999;">
          Features: Auto-removal, Manual selection, Whitelist support, Restore functionality
        </p>
      </div>
    `;

    // Create a simple modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 8px;
      max-width: 300px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    
    content.innerHTML = aboutHtml;
    modal.appendChild(content);
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    setTimeout(() => {
      document.body.removeChild(modal);
    }, 3000);
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OverlayRemoverPopup();
});