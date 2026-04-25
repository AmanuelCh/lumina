# Lumina ✦

A non-bloated alternative to QuillBot. AI-powered writing tools — grammar, paraphrasing, summarization, tone analysis, translation, dictionary, and prompt engineering — available as both a desktop app and a browser extension.

## What's inside

| | Path | Description |
|---|---|---|
| **Desktop app** | `/` | Tauri + React + Vite + Tailwind v4 |
| **Browser extension** | `extension/` | Chrome & Firefox (MV3) |

Both use the [Google Gemini API](https://aistudio.google.com/app/apikey) directly — no intermediate server.

---

## Desktop App

### Requirements

- [Bun](https://bun.sh) (or Node.js 18+)
- [Rust + Tauri CLI](https://tauri.app/start/prerequisites/)
- A [Gemini API key](https://aistudio.google.com/app/apikey)

### Setup

```bash
# 1. Install dependencies
bun install

# 2. Add your API key
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here

# 3. Start dev server
bun run dev

# 4. Build desktop app
bun run tauri build
```

### Features

- **Grammar & Style** — error detection with optional informal mode
- **Paraphrasing** — Fluent, Formal, Playful, Academic, Slang and more
- **Summarization** — high-fidelity summaries and key insights
- **Tone Analyzer** — sentiment, formality, and emotional resonance
- **Tone Changer** — shift text to any target tone
- **Humanize** — rewrite AI-generated text to pass detection
- **Translate** — detect language and translate to any target
- **Dictionary** — definitions, synonyms, usage examples
- **Prompt Suite** — Make, Optimize, and Rewrite LLM prompts

---

## Browser Extension

See [`extension/README.md`](extension/README.md) for full setup and loading instructions.

### Quick start

```bash
cd extension
npm install

npm run build          # Chrome → extension/dist/
npm run build:firefox  # Firefox → extension/dist-firefox/
```

Load **Chrome**: `chrome://extensions` → Developer mode → Load unpacked → select `extension/dist/`

Load **Firefox**: `about:debugging` → This Firefox → Load Temporary Add-on → select `extension/dist-firefox/manifest.json`

Both require a Gemini API key — enter it in the extension popup on first launch.

---

## Project Structure

```
lumina-desk-extension/
├── src/                    # Desktop app source (React + Tauri)
│   ├── components/
│   └── services/
├── src-tauri/              # Tauri (Rust) backend
├── extension/              # Browser extension (independent build)
│   ├── src/
│   │   ├── background/     # Service worker / background script
│   │   ├── content/        # In-page floating toolbar (Shadow DOM)
│   │   ├── popup/          # Extension popup (React)
│   │   └── services/       # Gemini API + storage wrappers
│   ├── public/icons/
│   ├── manifest.json       # MV3 manifest
│   └── vite.config.ts
├── .env.example
└── README.md
```

---

## License

MIT — see [LICENSE](LICENSE).

---

Built with ❤️ by [Amanuel Chaka](https://amanuelch.com)
