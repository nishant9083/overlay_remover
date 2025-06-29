// Options page script for Overlay Remover extension
class OverlayRemoverOptions {
  constructor() {
    this.settings = {
      enabled: true,
      showRestoreButton: true,
      aggressiveMode: false,
      minZIndex: 900,
      coverageThreshold: 80,
      whitelist: [],
      customSelectors: [],
      stats: {
        totalRemoved: 0,
        activeToday: 0
      }
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadSettings() {
    const stored = await chrome.storage.sync.get(null);
    this.settings = { ...this.settings, ...stored };
  }

  async saveSettings() {
    await chrome.storage.sync.set(this.settings);
    this.showMessage('Settings saved successfully!', 'success');
  }

  setupEventListeners() {
    // General settings
    document.getElementById('enableExtension').addEventListener('change', (e) => {
      this.settings.enabled = e.target.checked;
      this.saveSettings();
    });

    document.getElementById('showRestoreButton').addEventListener('change', (e) => {
      this.settings.showRestoreButton = e.target.checked;
      this.saveSettings();
    });

    document.getElementById('aggressiveMode').addEventListener('change', (e) => {
      this.settings.aggressiveMode = e.target.checked;
      this.saveSettings();
    });

    // Detection settings
    document.getElementById('minZIndex').addEventListener('change', (e) => {
      this.settings.minZIndex = parseInt(e.target.value);
      this.saveSettings();
    });

    document.getElementById('coverageThreshold').addEventListener('change', (e) => {
      this.settings.coverageThreshold = parseInt(e.target.value);
      this.saveSettings();
    });

    // Whitelist management
    document.getElementById('addWhitelistBtn').addEventListener('click', () => {
      this.addWhitelistItem();
    });

    document.getElementById('whitelistInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addWhitelistItem();
      }
    });

    // Custom selectors
    document.getElementById('addSelectorBtn').addEventListener('click', () => {
      this.addCustomSelector();
    });

    document.getElementById('selectorInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addCustomSelector();
      }
    });

    // Footer actions
    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetToDefaults();
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportSettings();
    });

    document.getElementById('importBtn').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', (e) => {
      this.importSettings(e.target.files[0]);
    });
  }

  updateUI() {
    // General settings
    document.getElementById('enableExtension').checked = this.settings.enabled;
    document.getElementById('showRestoreButton').checked = this.settings.showRestoreButton;
    document.getElementById('aggressiveMode').checked = this.settings.aggressiveMode;

    // Detection settings
    document.getElementById('minZIndex').value = this.settings.minZIndex;
    document.getElementById('coverageThreshold').value = this.settings.coverageThreshold;

    // Whitelist
    this.updateWhitelistUI();

    // Custom selectors
    this.updateSelectorsUI();

    // Statistics
    document.getElementById('totalRemoved').textContent = this.settings.stats?.totalRemoved || 0;
    document.getElementById('sitesWhitelisted').textContent = this.settings.whitelist.length;
    document.getElementById('activeToday').textContent = this.settings.stats?.activeToday || 0;
  }

  updateWhitelistUI() {
    const container = document.getElementById('whitelistList');
    container.innerHTML = '';

    this.settings.whitelist.forEach((domain, index) => {
      const item = document.createElement('div');
      item.className = 'whitelist-item';
      item.innerHTML = `
        <span class="whitelist-item-text">${domain}</span>
        <button class="remove-btn" data-index="${index}">Remove</button>
      `;

      item.querySelector('.remove-btn').addEventListener('click', () => {
        this.removeWhitelistItem(index);
      });

      container.appendChild(item);
    });
  }

  updateSelectorsUI() {
    const container = document.getElementById('selectorList');
    container.innerHTML = '';

    this.settings.customSelectors.forEach((selector, index) => {
      const item = document.createElement('div');
      item.className = 'selector-item';
      item.innerHTML = `
        <span class="selector-item-text">${selector}</span>
        <button class="remove-btn" data-index="${index}">Remove</button>
      `;

      item.querySelector('.remove-btn').addEventListener('click', () => {
        this.removeCustomSelector(index);
      });

      container.appendChild(item);
    });
  }

  addWhitelistItem() {
    const input = document.getElementById('whitelistInput');
    const domain = input.value.trim().toLowerCase();

    if (!domain) {
      this.showMessage('Please enter a domain', 'error');
      return;
    }

    // Validate domain format
    if (!this.isValidDomain(domain)) {
      this.showMessage('Please enter a valid domain', 'error');
      return;
    }

    if (this.settings.whitelist.includes(domain)) {
      this.showMessage('Domain already in whitelist', 'error');
      return;
    }

    this.settings.whitelist.push(domain);
    input.value = '';
    this.saveSettings();
    this.updateWhitelistUI();
  }

  removeWhitelistItem(index) {
    this.settings.whitelist.splice(index, 1);
    this.saveSettings();
    this.updateWhitelistUI();
  }

  addCustomSelector() {
    const input = document.getElementById('selectorInput');
    const selector = input.value.trim();

    if (!selector) {
      this.showMessage('Please enter a CSS selector', 'error');
      return;
    }

    // Validate CSS selector
    try {
      document.querySelector(selector);
    } catch (e) {
      this.showMessage('Invalid CSS selector', 'error');
      return;
    }

    if (this.settings.customSelectors.includes(selector)) {
      this.showMessage('Selector already exists', 'error');
      return;
    }

    this.settings.customSelectors.push(selector);
    input.value = '';
    this.saveSettings();
    this.updateSelectorsUI();
  }

  removeCustomSelector(index) {
    this.settings.customSelectors.splice(index, 1);
    this.saveSettings();
    this.updateSelectorsUI();
  }

  isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return domainRegex.test(domain);
  }

  async resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      await chrome.storage.sync.clear();
      this.settings = {
        enabled: true,
        showRestoreButton: true,
        aggressiveMode: false,
        minZIndex: 900,
        coverageThreshold: 80,
        whitelist: [],
        customSelectors: [],
        stats: {
          totalRemoved: 0,
          activeToday: 0
        }
      };
      this.updateUI();
      this.showMessage('Settings reset to defaults', 'success');
    }
  }

  exportSettings() {
    const settingsBlob = new Blob([JSON.stringify(this.settings, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(settingsBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'overlay-remover-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    
    this.showMessage('Settings exported successfully', 'success');
  }

  async importSettings(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      
      // Validate imported settings
      if (this.validateSettings(importedSettings)) {
        this.settings = { ...this.settings, ...importedSettings };
        await this.saveSettings();
        this.updateUI();
        this.showMessage('Settings imported successfully', 'success');
      } else {
        this.showMessage('Invalid settings file', 'error');
      }
    } catch (e) {
      this.showMessage('Error reading settings file', 'error');
    }
  }

  validateSettings(settings) {
    const requiredFields = ['enabled', 'whitelist'];
    return requiredFields.every(field => settings.hasOwnProperty(field));
  }

  showMessage(text, type = 'success') {
    const existing = document.querySelector('.success-message, .error-message');
    if (existing) {
      existing.remove();
    }

    const message = document.createElement('div');
    message.className = `${type}-message`;
    message.textContent = text;
    
    const main = document.querySelector('.main');
    main.insertBefore(message, main.firstChild);
    
    setTimeout(() => {
      message.remove();
    }, 3000);
  }
}

// Initialize options page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OverlayRemoverOptions();
});