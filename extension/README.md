# Lumina Browser Extension

Brings all of Lumina's AI writing tools to every webpage — grammar checking, paraphrasing, summarization, tone analysis, AI detection, translation, dictionary lookup, and prompt engineering.

## How it works

- **Popup** — click the ✦ toolbar icon for full access to all tools.
- **Floating toolbar** — select any text on a page, click the pill button that appears near your cursor for instant Grammar, Paraphrase, Summarize, or Translate.
- **Context menu** — right-click selected text → ✦ Lumina for quick access.
- **Auto-fill** — opening the popup while text is selected pre-fills the active tool.

## Requirements

- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier works).
- Chrome 109+ or Firefox 140+.

---

## Build

```bash
cd extension
npm install
```

| Command | Output | Target |
|---|---|---|
| `npm run build` | `dist/` | Chrome / Chromium |
| `npm run build:firefox` | `dist-firefox/` | Firefox 140+ |
| `npm run dev` | `dist/` (watch) | Chrome dev |
| `npm run dev:firefox` | `dist-firefox/` (watch) | Firefox dev |
| `npm run zip` | `lumina-chrome.zip` + `lumina-firefox.zip` | Store upload |

---

## Loading in Chrome / Chromium

1. Open `chrome://extensions`.
2. Enable **Developer mode** (toggle, top-right).
3. Click **Load unpacked**.
4. Select the `extension/dist` folder.
5. The ✦ Lumina icon appears in your toolbar — click it and enter your Gemini API key.

> After rebuilding: click the **↺** reload icon next to the extension on the extensions page.

---

## Loading in Firefox

> Use the **Firefox build** — the Chrome build won't load in Firefox due to a different background script format.

1. Run `npm run build:firefox` inside `extension/`.
2. Open `about:debugging` in Firefox.
3. Click **This Firefox** in the left sidebar.
4. Click **Load Temporary Add-on…**
5. Navigate to `extension/dist-firefox/` and select `manifest.json`.
6. The ✦ Lumina icon appears in your toolbar — click it and enter your Gemini API key.

> Temporary add-ons are removed when Firefox closes. For a persistent install, the extension must be signed by Mozilla via [Firefox Extension Workshop](https://extensionworkshop.com/documentation/publish/).

### Firefox — persistent install (Developer Edition / Nightly only)

1. Open `about:config` and set `xpinstall.signatures.required` to `false`.
2. Build and zip: `npm run zip`
3. Go to `about:addons` → gear icon → **Install Add-on From File** → select `lumina-firefox.zip`.

---

## Publishing

Generate store-ready zips (forward-slash paths, no Windows backslash issues):

```bash
npm run zip
# → lumina-chrome.zip   upload to Chrome Web Store
# → lumina-firefox.zip  upload to Firefox Add-ons (AMO)
```

Both zip files are git-ignored and safe to regenerate anytime.

---

## Project Structure

```
extension/
├── src/
│   ├── background/
│   │   └── index.ts         # Context menu registration; stores pending tool
│   ├── content/
│   │   └── index.ts         # Floating toolbar — vanilla TS + Shadow DOM
│   ├── popup/
│   │   ├── index.html
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── components/      # One component per tool
│   └── services/
│       ├── gemini.ts         # Direct Gemini REST API calls
│       └── storage.ts        # chrome.storage.sync wrapper
├── public/
│   └── icons/               # 32 / 64 / 128 px PNGs
├── scripts/
│   └── zip.mjs              # Cross-platform zip builder (no backslash paths)
├── manifest.json            # MV3 manifest (Chrome + Firefox)
├── vite.config.ts           # Dual-mode build (chrome / firefox)
└── package.json
```

---

## Notes

- Completely independent from the desktop app — separate `package.json`, build system, and source files.
- API key is stored in `chrome.storage.sync` — encrypted by the browser, syncs across signed-in devices.
- All AI calls go directly from the browser to `generativelanguage.googleapis.com` — no data passes through any server.
