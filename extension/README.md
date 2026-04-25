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
