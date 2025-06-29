# Overlay Remover Browser Extension

A powerful browser extension that automatically detects and removes intrusive overlay elements from web pages, including anti-adblock messages, newsletter popups, paywall overlays, and cookie consent notices.


## Demo

https://github.com/user-attachments/assets/4562e7bb-997d-4cc9-9aac-e72ece08f7c3

## Features

### Automatic Detection & Removal
- **Anti-adblock overlays** - Removes irritating overlays
- **Newsletter signup popups** - Eliminates subscription prompts
- **Paywall overlays** - Bypasses content blocking screens
- **Cookie consent notices** - Removes GDPR/cookie banners
- **Modal dialogs** - Clears blocking popup windows
- **Subscription walls** - Removes premium content barriers

### Manual Control
- **Toggle functionality** - Enable/disable the extension instantly
- **Right-click removal** - Manually remove specific overlay elements
- **Shortcut Key** - Press `Alt+S` and select any element to remove it
- **Restore capability** - Bring back removed elements if needed
- **Whitelist support** - Exclude trusted websites from processing

### Advanced Features
- **Dynamic detection** - Handles both static and dynamically loaded overlays
- **Aggressive mode** - Enhanced detection for stubborn overlays
- **Custom selectors** - Add your own CSS selectors for specific sites
- **Statistics tracking** - Monitor extension performance
- **Import/Export settings** - Backup and share your configuration

## Installation

### Chrome/Edge
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The Overlay Remover icon will appear in your toolbar

### Firefox
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the sidebar
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from the extension folder

## Usage

### Basic Usage
1. **Automatic Mode**: The extension works automatically on all websites by default
2. **Toggle**: Click the extension icon to enable/disable functionality
3. **`Alt+S`**: Press this key and select an element to remove it
4. **Manual Removal**: Right-click on any overlay and select "Remove Overlay Element"
5. **Restore**: Use the floating restore button or popup to bring back removed elements

### Whitelist Management
1. Click the extension icon to open the popup
2. Click "Whitelist Site" to exclude the current domain
3. Manage your whitelist in the Options page

### Advanced Configuration
1. Right-click the extension icon and select "Options"
2. Configure detection sensitivity and coverage thresholds
3. Add custom CSS selectors for specific overlay types
4. Export/import your settings for backup or sharing

## Technical Details

### Detection Methods
The extension uses multiple detection strategies:

1. **CSS Selector Matching**: Targets common overlay class names and IDs
2. **Z-Index Analysis**: Identifies high-priority layered elements
3. **Position Detection**: Finds fixed/absolute positioned elements
4. **Coverage Analysis**: Measures screen coverage percentage
5. **Content Analysis**: Scans for overlay-related text content
6. **Interaction Blocking**: Detects elements that prevent user interaction

### Overlay Types Detected
- Elements with overlay-related class names (`overlay`, `modal`, `popup`, etc.)
- High z-index elements (>900 by default)
- Fixed positioned elements covering significant screen area
- Elements containing overlay-specific text content
- Backdrop/background blocking elements

### Performance Optimizations
- **Mutation Observer**: Efficiently monitors DOM changes
- **Debounced Processing**: Prevents excessive resource usage
- **Smart Restoration**: Preserves page functionality when removing elements
- **Selective Targeting**: Avoids removing legitimate page content

## Browser Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Firefox 78+
- ✅ Safari 14+ (with minor limitations)

## Privacy & Security

- **No Data Collection**: The extension doesn't collect or transmit any user data
- **Local Storage Only**: All settings are stored locally in browser storage
- **No External Requests**: No communication with external servers
- **Minimal Permissions**: Only requests necessary browser permissions

## Troubleshooting

### Common Issues

**Extension not working on a specific site:**
- Check if the site is in your whitelist
- Try enabling "Aggressive Mode" in options
- Add custom CSS selectors for site-specific overlays

**Legitimate content being removed:**
- Disable the extension temporarily
- Add the site to your whitelist
- Adjust detection sensitivity in options

**Overlays reappearing:**
- Some sites continuously recreate overlays
- The extension should detect and remove them automatically
- Consider using aggressive mode for persistent overlays

### Reporting Issues
If you encounter problems:
1. Check the browser console for error messages
2. Try disabling other extensions temporarily
3. Test in incognito/private browsing mode
4. Provide specific website URLs where issues occur

## Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/nishant9083/overlay_remover.git

# No build process required - extension is ready to load
```

### File Structure
```
overlay_remover/
├── manifest.json          # Extension manifest
├── background.js          # Background script for context menu and storage
├── content.js            # Main content script for overlay detection
├── content.css           # Content script styles
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── popup.css             # Popup styles
├── options.html          # Options page
├── options.js            # Options functionality
├── options.css           # Options styles
└── icons/               # Extension icons
```

### Key Components

**Content Script (`content.js`)**
- Main overlay detection and removal logic
- DOM mutation monitoring
- Element analysis and classification
- Restore functionality

**Background Script (`background.js`)**
- Context menu management
- Settings storage and retrieval
- Inter-script communication
- Whitelist management

**Popup Interface (`popup.html/js/css`)**
- Quick toggle functionality
- Current site management
- Basic statistics display
- Access to options page

**Options Page (`options.html/js/css`)**
- Comprehensive settings management
- Whitelist and custom selector configuration
- Import/export functionality
- Advanced detection settings

## Contributing

We welcome contributions! Please feel free to:
- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

### v1.0.0
- Initial release
- Automatic overlay detection and removal
- Manual removal via context menu
- Whitelist functionality
- Restore capability
- Options page with advanced settings
- Import/export configuration
- Statistics tracking
- Cross-browser compatibility

## Support

For support, feature requests, or bug reports, please visit our GitHub repository or contact us through the extension's options page.

---

**Note**: This extension is designed to improve web browsing experience by removing intrusive overlays. While it's effective against most overlay types, some websites may use advanced techniques that require manual intervention or custom configuration.
