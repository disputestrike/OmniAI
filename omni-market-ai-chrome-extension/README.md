# OmniMarket AI - Chrome Extension

A companion Chrome extension for the OmniMarket AI marketing platform. Analyze any webpage, extract product data, spy on competitors, generate content, and manage leads — all from your browser.

## Features

- **Page Analysis**: Analyze any webpage for marketing intelligence
- **Product Extraction**: Extract product data (title, description, price, images) from e-commerce pages
- **Competitor Intelligence**: Right-click any page to run competitor analysis
- **Content Generation**: Select text and generate ads, social posts, or improved content
- **SEO Quick Audit**: Run instant SEO audits on any page
- **Lead Capture**: Save contact information from any webpage as a lead
- **Content Remix**: Select any text and remix it with AI
- **Translation**: Translate selected text to 30+ languages
- **Context Menus**: Right-click integration for quick actions
- **Side Panel**: Access AI Marketing Agent directly in the browser sidebar

## Installation

### Development (Unpacked)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select this `omni-market-ai-chrome-extension` directory
5. The extension icon will appear in your toolbar

### Production

1. Create icon files (16x16, 32x32, 48x48, 128x128 PNG) in the `icons/` directory
2. Run `zip -r omnimarket-ai-extension.zip . -x "*.md" ".git/*"` to create the package
3. Upload to Chrome Web Store at https://chrome.google.com/webstore/devconsole

## Configuration

Click the extension icon > Settings, or right-click the icon > Options to configure:

- **API Base URL**: Your OmniMarket AI instance URL (defaults to the hosted version)
- **Default Content Type**: Default content type for quick generation

## File Structure

```
manifest.json       - Extension manifest (Manifest V3)
background.js       - Service worker (context menus, message handling)
content.js          - Content script (page data extraction)
content.css         - Content script styles
popup.html/css/js   - Extension popup UI
sidepanel.html      - Browser side panel (AI Agent)
options.html        - Settings page
icons/              - Extension icons (create before publishing)
```

## Required Icons

Before publishing, create PNG icons in the `icons/` directory:
- `icon16.png` (16x16) - Toolbar icon
- `icon32.png` (32x32) - Toolbar icon (2x)
- `icon48.png` (48x48) - Extensions page
- `icon128.png` (128x128) - Chrome Web Store

## Permissions

- `activeTab` - Access current tab URL and content
- `storage` - Save settings and recent activity
- `contextMenus` - Right-click menu integration
- `sidePanel` - Browser side panel access
