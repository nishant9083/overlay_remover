// Content script for Overlay Remover extension
class OverlayRemover {
  constructor() {
    this.enabled = true;
    this.removedElements = [];
    this.selectionModeActive = false;
    this.observerConfig = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'style']
    };
    this.observer = null;
    this.restoreButton = null;
    this.selectionMessage = null;
    
    this.init();
  }

  async init() {
    // Make instance globally available for context menu
    window.overlayRemover = this;
    
    // Check if extension is enabled and site is not whitelisted
    const settings = await this.getSettings();
    this.enabled = settings.enabled;
    
    if (!settings.isWhitelisted && this.enabled) {
      this.startObserving();
      this.removeExistingOverlays();
      this.createRestoreButton();
    }

    // Setup keyboard and mouse event listeners
    this.setupEventListeners();

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
    });
  }

  setupEventListeners() {
    // Keyboard event listener for selection mode
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    // Mouse click event listener for selection mode
    document.addEventListener('click', (e) => {
      this.handleClick(e);
    }, true); // Use capture phase to intercept clicks before other handlers
  }

  handleKeyDown(e) {
    // Check for Alt + S keyboard shortcut
    if (e.altKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      e.stopPropagation();
      this.toggleSelectionMode();
    }
    
    // Allow Escape key to exit selection mode
    if (e.key === 'Escape' && this.selectionModeActive) {
      e.preventDefault();
      e.stopPropagation();
      this.deactivateSelectionMode();
    }
  }

  handleClick(e) {
    if (this.selectionModeActive) {
      e.preventDefault();
      e.stopPropagation();
      
      const clickedElement = e.target;
      
      // Don't remove the selection message or restore button
      if (clickedElement === this.selectionMessage || 
          clickedElement === this.restoreButton ||
          clickedElement.closest('#overlay-remover-selection-message') ||
          clickedElement.closest('#overlay-remover-restore-btn')) {
        return;
      }
      
      // Remove the clicked element
      this.removeSpecificOverlay(clickedElement);
      
      // Show success message briefly
      this.showSuccessMessage(clickedElement);
      
      // Deactivate selection mode after removal
      this.deactivateSelectionMode();
    }
  }

  toggleSelectionMode() {
    if (this.selectionModeActive) {
      this.deactivateSelectionMode();
    } else {
      this.activateSelectionMode();
    }
  }

  activateSelectionMode() {
    this.selectionModeActive = true;
    
    // Change cursor to crosshair
    document.body.style.cursor = 'crosshair';
    
    // Add selection mode class to body for additional styling
    document.body.classList.add('overlay-remover-selection-mode');
    
    // Show selection mode message
    this.showSelectionMessage();
    
    console.log('Selection mode activated - click on any element to remove it');
  }

  deactivateSelectionMode() {
    this.selectionModeActive = false;
    
    // Reset cursor
    document.body.style.cursor = '';
    
    // Remove selection mode class
    document.body.classList.remove('overlay-remover-selection-mode');
    
    // Hide selection mode message
    this.hideSelectionMessage();
    
    console.log('Selection mode deactivated');
  }

  showSelectionMessage() {
    if (this.selectionMessage) {
      this.hideSelectionMessage();
    }

    this.selectionMessage = document.createElement('div');
    this.selectionMessage.id = 'overlay-remover-selection-message';
    this.selectionMessage.innerHTML = `
      <div class="selection-message-content">
        <div class="selection-message-title">🎯 Selection Mode Active</div>
        <div class="selection-message-text">Click on any element to remove it</div>
        <div class="selection-message-hint">Press <kbd>Esc</kbd> to cancel</div>
      </div>
    `;

    document.body.appendChild(this.selectionMessage);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (this.selectionMessage && this.selectionModeActive) {
        this.selectionMessage.style.opacity = '0.7';
      }
    }, 3000);
  }

  hideSelectionMessage() {
    if (this.selectionMessage) {
      this.selectionMessage.remove();
      this.selectionMessage = null;
    }
  }

  showSuccessMessage(element) {
    const successMessage = document.createElement('div');
    successMessage.className = 'overlay-remover-success-message';
    successMessage.innerHTML = `
      <div class="success-message-content">
        ✅ Element removed successfully!
      </div>
    `;

    document.body.appendChild(successMessage);

    // Position near the removed element if possible
    try {
      const rect = element.getBoundingClientRect();
      if (rect.top > 0 && rect.left > 0) {
        successMessage.style.top = `${rect.top + window.scrollY - 50}px`;
        successMessage.style.left = `${rect.left + window.scrollX}px`;
        successMessage.style.position = 'absolute';
      }
    } catch (e) {
      // Use default positioning if element positioning fails
    }

    // Remove success message after 2 seconds
    setTimeout(() => {
      if (successMessage.parentNode) {
        successMessage.remove();
      }
    }, 2000);
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        chrome.runtime.sendMessage({ action: 'isWhitelisted' }, (whitelistResponse) => {
          resolve({
            enabled: response.enabled,
            whitelist: response.whitelist,
            isWhitelisted: whitelistResponse.isWhitelisted
          });
        });
      });
    });
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'toggle':
        this.toggleExtension();
        break;
      case 'siteWhitelisted':
        this.enabled = false;
        this.stopObserving();
        this.restoreAllElements();
        // Deactivate selection mode if site is whitelisted
        if (this.selectionModeActive) {
          this.deactivateSelectionMode();
        }
        break;
      case 'removeOverlay':
        this.removeOverlayById(request.elementId);
        break;
    }
  }

  toggleExtension() {
    this.enabled = !this.enabled;
    
    if (this.enabled) {
      this.startObserving();
      this.removeExistingOverlays();
      this.showRestoreButton();
    } else {
      this.stopObserving();
      this.hideRestoreButton();
      // Deactivate selection mode if extension is disabled
      if (this.selectionModeActive) {
        this.deactivateSelectionMode();
      }
    }
  }

  startObserving() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.checkAndRemoveOverlay(node);
            }
          });
        } else if (mutation.type === 'attributes') {
          this.checkAndRemoveOverlay(mutation.target);
        }
      });
    });

    this.observer.observe(document.body, this.observerConfig);
  }

  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  removeExistingOverlays() {
    const overlaySelectors = this.getOverlaySelectors();
    
    overlaySelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (this.isOverlayElement(element)) {
          this.removeOverlay(element);
        }
      });
    });

    // Additional check for elements with overlay-like behavior
    this.checkForDynamicOverlays();
  }

  getOverlaySelectors() {
    return [
      // Common overlay class names
      '[class*="overlay"]',
      '[class*="modal"]',
      '[class*="popup"]',
      '[class*="dialog"]',
      '[class*="lightbox"]',
      '[class*="backdrop"]',
      '[class*="blocker"]',
      '[class*="paywall"]',
      '[class*="subscription"]',
      '[class*="newsletter"]',
      '[class*="signup"]',
      '[class*="adblock"]',
      '[class*="cookie"]',
      '[class*="consent"]',
      '[class*="gdpr"]',
      '[class*="banner"]',
      '[class*="notice"]',
      '[class*="alert"]',
      '[class*="drawer"]',
      '[class*="sidebar"]',
      '[class*="offcanvas"]',
      
      // Common overlay IDs
      '[id*="overlay"]',
      '[id*="modal"]',
      '[id*="popup"]',
      '[id*="dialog"]',
      '[id*="lightbox"]',
      '[id*="backdrop"]',
      '[id*="blocker"]',
      '[id*="paywall"]',
      '[id*="subscription"]',
      '[id*="newsletter"]',
      '[id*="signup"]',
      '[id*="adblock"]',
      '[id*="cookie"]',
      '[id*="consent"]',
      '[id*="gdpr"]',
      
      // Elements with high z-index
      '[style*="z-index: 9999"]',
      '[style*="z-index:9999"]',
      '[style*="z-index: 999"]',
      '[style*="z-index:999"]',
      
      // Fixed positioned elements
      '[style*="position: fixed"]',
      '[style*="position:fixed"]'
    ];
  }

  checkForDynamicOverlays() {
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
      if (this.isOverlayElement(element)) {
        this.removeOverlay(element);
      }
    });
  }

  isOverlayElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    const computedStyle = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    // Check if element covers significant portion of screen
    const coversScreen = (
      rect.width > window.innerWidth * 0.8 ||
      rect.height > window.innerHeight * 0.8
    );

    // Check positioning and z-index
    const isHighZIndex = parseInt(computedStyle.zIndex) > 900;
    const isFixed = computedStyle.position === 'fixed';
    const isAbsolute = computedStyle.position === 'absolute';
    
    // Check for overlay-like text content
    const hasOverlayText = this.hasOverlayText(element);
    
    // Check for overlay-like classes or IDs
    const hasOverlayIdentifiers = this.hasOverlayIdentifiers(element);
    
    // Check if element blocks interaction
    const blocksInteraction = this.blocksInteraction(element);

    return (
      (isFixed || isAbsolute) &&
      (isHighZIndex || coversScreen) &&
      (hasOverlayText || hasOverlayIdentifiers || blocksInteraction)
    );
  }

  hasOverlayText(element) {
    const text = element.textContent.toLowerCase();
    const overlayKeywords = [
      'disable adblock',
      'turn off adblock',
      'subscribe now',
      'sign up',
      'newsletter',
      'paywall',
      'premium content',
      'accept cookies',
      'cookie consent',
      'privacy policy',
      'continue reading',
      'unlock content',
      'free trial',
      'limited time',
      'exclusive access'
    ];

    return overlayKeywords.some(keyword => text.includes(keyword));
  }

  hasOverlayIdentifiers(element) {
    // Safe way to get className that works with all element types
    const getElementClassName = (el) => {
      if (!el) return '';
      
      // Handle SVG elements and other special cases
      if (typeof el.className === 'string') {
        return el.className;
      } else if (el.className && typeof el.className.baseVal === 'string') {
        // SVG elements have className as SVGAnimatedString
        return el.className.baseVal;
      } else if (el.getAttribute) {
        // Fallback to getAttribute
        return el.getAttribute('class') || '';
      }
      
      return '';
    };

    // Safe way to get element ID
    const getElementId = (el) => {
      if (!el) return '';
      
      if (typeof el.id === 'string') {
        return el.id;
      } else if (el.getAttribute) {
        return el.getAttribute('id') || '';
      }
      
      return '';
    };

    const className = getElementClassName(element).toLowerCase();
    const id = getElementId(element).toLowerCase();
    
    const overlayIdentifiers = [
      'overlay', 'modal', 'popup', 'dialog', 'lightbox', 'backdrop',
      'blocker', 'paywall', 'subscription', 'newsletter', 'signup',
      'adblock', 'cookie', 'consent', 'gdpr', 'banner', 'notice'
    ];

    return overlayIdentifiers.some(identifier => 
      className.includes(identifier) || id.includes(identifier)
    );
  }

  blocksInteraction(element) {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    // Check if element covers viewport and has background
    const coversViewport = (
      rect.left <= 0 && rect.top <= 0 &&
      rect.right >= window.innerWidth && rect.bottom >= window.innerHeight
    );
    
    const hasBackground = (
      computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
      computedStyle.background !== 'none'
    );

    return coversViewport && hasBackground;
  }

  checkAndRemoveOverlay(element) {
    if (this.enabled && this.isOverlayElement(element)) {
      this.removeOverlay(element);
    }
  }

  removeOverlay(element) {
    if (!element || element.dataset.overlayRemoved) {
      return;
    }

    // Store element info for restoration
    const elementInfo = {
      element: element,
      parent: element.parentNode,
      nextSibling: element.nextSibling,
      display: element.style.display,
      visibility: element.style.visibility,
      opacity: element.style.opacity,
      timestamp: Date.now()
    };

    this.removedElements.push(elementInfo);
    
    // Mark element as removed
    element.dataset.overlayRemoved = 'true';
    
    // Hide element instead of removing to preserve page functionality
    element.style.display = 'none';
    element.style.visibility = 'hidden';
    element.style.opacity = '0';
    element.style.pointerEvents = 'none';
    
    // Also try to remove backdrop/background elements
    this.removeBackdropElements(element);
    
    // Remove body scroll lock if present
    this.removeScrollLock();
    
    console.log('Overlay removed:', element);
  }

  removeSpecificOverlay(element) {
    if (element && this.isOverlayElement(element)) {
      this.removeOverlay(element);
    } else {
      // For selection mode, remove any element clicked (not just overlays)
      if (this.selectionModeActive) {
        this.removeAnyElement(element);
      } else {
        // Try to find parent overlay element for context menu usage
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
          if (this.isOverlayElement(parent)) {
            this.removeOverlay(parent);
            break;
          }
          parent = parent.parentElement;
        }
      }
    }
  }

  removeAnyElement(element) {
    if (!element || element.dataset.overlayRemoved) {
      return;
    }

    // Store element info for restoration
    const elementInfo = {
      element: element,
      parent: element.parentNode,
      nextSibling: element.nextSibling,
      display: element.style.display,
      visibility: element.style.visibility,
      opacity: element.style.opacity,
      timestamp: Date.now()
    };

    this.removedElements.push(elementInfo);
    
    // Mark element as removed
    element.dataset.overlayRemoved = 'true';
    
    // Hide element
    element.style.display = 'none';
    element.style.visibility = 'hidden';
    element.style.opacity = '0';
    element.style.pointerEvents = 'none';
    
    console.log('Element removed via selection mode:', element);
  }

  removeBackdropElements(overlayElement) {
    const siblings = Array.from(overlayElement.parentNode.children);
    siblings.forEach(sibling => {
      if (sibling !== overlayElement && this.isBackdropElement(sibling)) {
        sibling.style.display = 'none';
        sibling.style.visibility = 'hidden';
        sibling.style.opacity = '0';
      }
    });
  }

  isBackdropElement(element) {
    const computedStyle = window.getComputedStyle(element);
    
    // Safe way to get className for backdrop detection
    const getElementClassName = (el) => {
      if (!el) return '';
      
      if (typeof el.className === 'string') {
        return el.className;
      } else if (el.className && typeof el.className.baseVal === 'string') {
        return el.className.baseVal;
      } else if (el.getAttribute) {
        return el.getAttribute('class') || '';
      }
      
      return '';
    };

    const className = getElementClassName(element).toLowerCase();
    
    return (
      className.includes('backdrop') ||
      className.includes('overlay') ||
      (computedStyle.backgroundColor === 'rgba(0, 0, 0, 0.5)' ||
       computedStyle.backgroundColor === 'rgb(0, 0, 0)')
    );
  }

  removeScrollLock() {
    // Remove common scroll-locking classes
    document.body.classList.remove('no-scroll', 'overflow-hidden', 'modal-open');
    document.documentElement.classList.remove('no-scroll', 'overflow-hidden');
    
    // Reset body style
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
    }
  }

  restoreAllElements() {
    this.removedElements.forEach(elementInfo => {
      const element = elementInfo.element;
      if (element) {
        element.style.display = elementInfo.display;
        element.style.visibility = elementInfo.visibility;
        element.style.opacity = elementInfo.opacity;
        element.style.pointerEvents = '';
        delete element.dataset.overlayRemoved;
      }
    });
    
    this.removedElements = [];
    this.hideRestoreButton();
  }

  createRestoreButton() {
    if (this.restoreButton) {
      return;
    }

    this.restoreButton = document.createElement('div');
    this.restoreButton.id = 'overlay-remover-restore-btn';
    this.restoreButton.innerHTML = '↻ Restore Overlays';
    this.restoreButton.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-family: Arial, sans-serif;
      cursor: pointer;
      z-index: 999999;
      display: none;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    `;

    this.restoreButton.addEventListener('click', () => {
      this.restoreAllElements();
    });

    this.restoreButton.addEventListener('mouseenter', () => {
      this.restoreButton.style.background = '#45a049';
    });

    this.restoreButton.addEventListener('mouseleave', () => {
      this.restoreButton.style.background = '#4CAF50';
    });

    document.body.appendChild(this.restoreButton);
  }

  showRestoreButton() {
    if (this.restoreButton && this.removedElements.length > 0) {
      this.restoreButton.style.display = 'block';
    }
  }

  hideRestoreButton() {
    if (this.restoreButton) {
      this.restoreButton.style.display = 'none';
    }
  }

  removeOverlayById(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      this.removeOverlay(element);
    }
  }
}

// Initialize overlay remover when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new OverlayRemover();
  });
} else {
  new OverlayRemover();
}