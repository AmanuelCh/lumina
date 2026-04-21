# Lumina Browser Extension

A browser extension that brings all of Lumina's AI writing tools to every page — grammar checking, paraphrasing, summarization, tone analysis, AI detection, translation, dictionary lookup, and prompt engineering.

## Features

- **Popup panel** — Full access to all Lumina tools via the toolbar icon.
- **Floating toolbar** — Select any text on a page and a small Lumina button appears. Click it for quick Grammar, Paraphrase, Summarize, or Translate actions inline.
- **Context menu** — Right-click selected text for Grammar, Paraphrase, Summarize, Translate, and Humanize.
- **Auto-fill** — Opening the popup while text is selected pre-fills the active tool's input.

## Requirements

- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier is sufficient).
- Chrome 109+ or Firefox 109+.

---

## Build

```bash
cd extension
npm install
```

**Chrome / Chromium:**
```bash
npm run build          # output → dist/
```

**Firefox:**
```bash
npm run build:firefox  # output → dist-firefox/
```

For live rebuilding during development:
```bash
npm run dev            # Chrome (watches dist/)
npm run dev:firefox    # Firefox (watches dist-firefox/)
```

---

## Loading in Chrome / Chromium

1. Open `chrome://extensions` in your browser.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `extension/dist` folder.
5. The ✦ Lumina icon will appear in your toolbar.
6. Click it, enter your Gemini API key when prompted, and you're ready.

> To update after rebuilding: click the **reload** icon (↺) next to the extension on the extensions page.

---

## Loading in Firefox

> Use the **Firefox build** (`npm run build:firefox` → `dist-firefox/`), not the Chrome build. The two differ in how the background script is declared.

1. Run `npm run build:firefox` inside the `extension/` folder.
2. Open `about:debugging` in Firefox.
3. Click **This Firefox** in the left sidebar.
4. Click **Load Temporary Add-on…**
5. Navigate to `extension/dist-firefox/` and select the `manifest.json` file.
6. The ✦ Lumina icon will appear in your toolbar.
7. Click it, enter your Gemini API key when prompted, and you're ready.

> Temporary add-ons are removed when Firefox closes. For a persistent install, the extension needs to be signed by Mozilla — see [Firefox Extension Workshop](https://extensionworkshop.com/documentation/publish/) for details.

### Firefox persistent install (unsigned, for personal use)

1. Open `about:config` in Firefox.
2. Set `xpinstall.signatures.required` to `false` (only works in Firefox Developer Edition or Nightly).
3. Build and zip the Firefox output:
   ```bash
   npm run build:firefox
   cd dist-firefox
   zip -r ../lumina-firefox.zip .
   ```
4. In Firefox: `about:addons` → gear icon → **Install Add-on From File** → select `lumina-firefox.zip`.

---

## Project Structure

```
extension/
├── src/
│   ├── services/
│   │   ├── gemini.ts        # Direct Gemini REST API calls for all tools
│   │   └── storage.ts       # chrome.storage.sync wrapper for settings
│   ├── background/
│   │   └── index.ts         # Service worker: context menu registration
│   ├── content/
│   │   └── index.ts         # In-page floating toolbar (vanilla TS + Shadow DOM)
│   └── popup/
│       ├── index.html
│       ├── index.css
│       ├── main.tsx
│       ├── App.tsx
│       └── components/      # One component per tool + shared ToolShell
├── public/
│   └── icons/               # PNG icons copied from the desktop app
├── manifest.json            # MV3 manifest (Chrome + Firefox compatible)
├── vite.config.ts
├── package.json
└── README.md
```

---

## Notes

- This extension is completely independent from the desktop app — it has its own build system and no shared source files.
- The extension stores your API key in `chrome.storage.sync`, which is encrypted by the browser and syncs across your signed-in devices.
- All AI calls are made directly from the browser to `generativelanguage.googleapis.com` — no data passes through any intermediate server.
