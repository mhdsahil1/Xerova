# 🛡 XEROVA Browser Guard

**Detect suspicious and malicious websites while you browse.**

XEROVA Browser Guard is a lightweight Chrome/Chromium extension that analyzes the current webpage's URL using XEROVA's multi-source threat intelligence engine. It provides instant risk scores, severity ratings, and actionable threat information — all without leaving your browser.

---

## ✨ Features

| Feature | Description |
|---|---|
| **One-click URL Analysis** | Analyze the current page by clicking the extension icon |
| **Risk Score** | 0–100 score with severity levels (Low, Medium, High, Critical) |
| **Risk Factors** | Detailed breakdown of detected threats |
| **Multi-source Intelligence** | VirusTotal, Criminal IP, AbuseIPDB, Abusix, Shodan, and more |
| **Brand Impersonation Detection** | Identifies lookalike domains and phishing attempts |
| **Full Investigation Redirect** | One click to open a deep investigation in XEROVA |
| **Privacy First** | URLs are only sent when you explicitly click Analyze |
| **Lightweight** | No background polling, no browsing history collection |

---

## 📦 Installation (Development)

### Prerequisites

- Node.js 18+
- npm

### Steps

```bash
# 1. Navigate to the extension directory
cd extension

# 2. Install dependencies
npm install

# 3. Build the extension
npm run build

# 4. Open Chrome/Chromium
#    Navigate to: chrome://extensions

# 5. Enable "Developer Mode" (toggle in top right)

# 6. Click "Load unpacked"

# 7. Select the extension/dist folder

# 8. Pin XEROVA Browser Guard to your toolbar

# 9. Navigate to any website and click the extension icon
```

### Development Mode

```bash
# Watch mode — recompiles on file changes
npm run watch

# After each change, click the refresh icon in chrome://extensions
```

---

## 🔧 Configuration

Edit `src/shared/config.ts` to switch between development and production:

```typescript
// Development (default)
XEROVA_BASE_URL: "http://localhost:3000"

// Production
XEROVA_BASE_URL: "https://xerova-lab.vercel.app"
```

Make sure the XEROVA web application is running when using `localhost`.

---

## 🏗 Architecture

```
Browser Tab
    ↓ (user clicks extension)
XEROVA Browser Guard popup
    ↓ (user clicks "Analyze")
    ↓ HTTPS POST
XEROVA Backend (/api/extension/url-analysis)
    ↓
Existing URL Analysis Engine
    ↓
┌─────────────┬──────────────┬──────────────┐
│ Local       │ VirusTotal   │ Criminal IP  │
│ Heuristics  │              │              │
├─────────────┼──────────────┼──────────────┤
│ AbuseIPDB   │ Abusix       │ Shodan       │
└─────────────┴──────────────┴──────────────┘
    ↓
Unified Risk Score + Risk Factors
    ↓
Extension Popup (results displayed)
```

**Key architectural decisions:**

1. **No API keys in extension** — All threat intelligence calls are made server-side
2. **No content scripts** — Current tab URL is obtained via `chrome.tabs` API
3. **No background polling** — Analysis only happens on explicit user request
4. **Shared analysis engine** — Extension uses the same `analyzeURL()` as the web app

---

## 📁 Project Structure

```
extension/
├── src/
│   ├── popup/
│   │   ├── popup.html      # Popup UI shell
│   │   ├── popup.css       # Premium dark theme styles
│   │   └── popup.ts        # Popup controller & state machine
│   │
│   ├── background/
│   │   └── service-worker.ts  # Extension lifecycle management
│   │
│   └── shared/
│       ├── types.ts         # TypeScript type definitions
│       ├── config.ts        # Centralized configuration
│       └── api.ts           # API client with error handling
│
├── icons/                   # Extension icons (SVG)
├── scripts/
│   ├── copy-static.js       # Build asset copier
│   └── generate-icons.js    # Icon generator
│
├── manifest.json            # Chrome Manifest V3
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔐 Permissions

| Permission | Why It's Needed |
|---|---|
| `activeTab` | Read the URL of the current tab when the user clicks the extension icon. Only activates on click — cannot read tabs in the background. |
| `storage` | Cache recent analysis results locally for faster repeat lookups. No sensitive data is stored. |

**Not requested:**

- ❌ `<all_urls>` — No broad host access
- ❌ `tabs` — No ability to read all open tabs
- ❌ `webRequest` — No network traffic interception
- ❌ `history` — No browsing history access

---

## 🔒 Privacy

- **Explicit consent**: URLs are only analyzed when you click "Analyze with XEROVA"
- **No tracking**: The extension does not monitor or record browsing activity
- **No data collection**: No analytics, telemetry, or usage tracking
- **Local caching only**: Results are cached in `chrome.storage.local` and auto-expire after 5 minutes
- **Secure communication**: All API calls use HTTPS in production

---

## 🧪 Testing

### Manual Test Cases

1. **Normal website**: Visit `https://google.com` → Analyze → Should show LOW risk
2. **Suspicious URL**: Try a lookalike domain → Should show risk factors
3. **Internal page**: Open `chrome://extensions` → Should show "Cannot Analyze"
4. **API failure**: Stop the XEROVA backend → Should show error (NOT "Safe")
5. **Full Investigation**: Click "Full Investigation" → Should open XEROVA threats page
6. **Tool links**: Click any tool → Should open the correct XEROVA page

### Build Verification

```bash
# Extension builds without errors
cd extension
npm run build

# XEROVA web app still builds
cd ..
npx tsc --noEmit
```

---

## 📋 Production Packaging

For Chrome Web Store submission:

1. Convert SVG icons to PNG at 16, 32, 48, and 128px
2. Update `manifest.json` icon paths to reference `.png` files
3. Update `XEROVA_BASE_URL` in `config.ts` to production URL
4. Run `npm run build`
5. Zip the `dist/` folder
6. Upload to Chrome Web Store Developer Dashboard

---

## 🤝 Relationship to XEROVA Web Platform

| Capability | Extension | Web Platform |
|---|:---:|:---:|
| Quick URL analysis | ✅ | ✅ |
| Risk score display | ✅ | ✅ |
| Risk factors | ✅ | ✅ |
| Full IP investigation | ❌ | ✅ |
| Domain deep analysis | ❌ | ✅ |
| Hash intelligence | ❌ | ✅ |
| CVE intelligence | ❌ | ✅ |
| IOC extraction | ❌ | ✅ |
| Reports | ❌ | ✅ |
| AI Assistant | ❌ | ✅ |
| Investigation history | ❌ | ✅ |
| User accounts | ❌ | ✅ |

The extension is a **lightweight first-line tool**. For deep investigation, use the full XEROVA platform.
