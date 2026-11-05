# TakeNote ✿ Pixel Edition

A cozy, pixel-inspired notebook rebuilt with **React 19**, **Vite**, **Tailwind CSS v4** and custom CSS. The site is login-free, and notes save locally in your browser.

## Features
- **New note** opens the dedicated writing desk. Your text autosaves as you type.
- **My notes** is a saved-note library with month, color, search, and sorting filters. Click a saved-note card to open a **pixel-styled editing window inside the website** (a modal, not a new browser tab). The note stays editable and saved.
- Writing desk grid controls: **1×1** (one note), **2×2** (four different note slots), **4×4** (sixteen slots). Empty slots create new notes.
- Bullet, numbered and checkbox lists automatically continue with Enter; Enter on a blank list item exits list mode.
- Browser spellcheck plus AI suggestions: spelling/grammar, wording improvements, restructuring and highlights. Review the original and proposed text before applying changes.
- Daily rotating inspirational quotes, monthly recap dashboard, task highlights, pinned notes, JSON backup/restore, and Markdown export.
- Subtle hover/float/window animations, with reduced-motion accessibility support.

## Compatibility and local storage
The app uses the same browser storage key as the original site: `takenote.pixel.v1`. It normalizes existing notes without changing their content. Notes are local to each browser/device; there is **no cloud sync or login**. Backup periodically from **My notes → Backup** or **Monthly recap → Backup JSON**. Browser storage can be deleted when clearing site data.

## AI setup — working options, without a site account
By default, **Auto** tries Chrome's built-in Prompt API on compatible hardware/browsers, then a configured OpenRouter key, then offers offline corrections. There is no guaranteed free public model without either local capability or a user-provided free-model key.

1. **Browser AI**: On compatible Chrome desktop devices, open **AI settings** and choose **Auto** or **Browser AI**. Availability can vary with version, hardware and model download. Note text is processed on-device.
2. **OpenRouter free models**: Create your own API key at https://openrouter.ai/keys. In **AI settings**, select **OpenRouter free models**, paste the key, and choose `openrouter/free` (or a specific model ending in `:free`). Free usage is subject to rate limits and provider availability. TakeNote sends each requested edit to its same-origin **Vercel serverless endpoint** (`/api/ai`), which forwards to OpenRouter. The key is sent only for that request and is not saved on the server. The key is held **only in the page's memory** (not committed, stored in the browser, or written to the server) and must be entered after a refresh. The chosen provider receives note text only after you click **Generate suggestions**.
3. **Ollama local**: Install https://ollama.com and run `ollama pull gemma3:1b`. Select **Ollama** and use model `gemma3:1b`, endpoint `http://localhost:11434`. Browser CORS may require setting `OLLAMA_ORIGINS` to the exact TakeNote website origin before restarting Ollama. HTTPS-to-localhost access can depend on browser policies.
4. **Offline helper**: Works automatically with no key, using common spelling/spacing corrections and extractive highlights. It is not an LLM. Browser spelling underlines offer additional right-click suggestions.

All AI changes are **preview-only** until you select **Apply revision**. The option to summarize monthly notes can create a new recap note after approval.

## Development

```sh
npm install
npm run dev
npm run build
```

Open the local URL shown by Vite. The site deploys to Vercel as a Vite project with build command `npm run build` and output directory `dist`. Tailwind CSS v4 uses the official `@tailwindcss/vite` plugin and `@import "tailwindcss";` in `src/styles.css`.

## Source structure
- `src/App.jsx` — navigation, archive, grid desk, dashboard and in-app note window
- `src/components/NotePad.jsx` — shared pixel editor, lists and autosave
- `src/components/AiPanel.jsx` — AI compare/approve and settings
- `src/lib/notes.js` — storage, lists, exports, quotes and summaries
- `src/lib/ai.js` — browser Prompt API, OpenRouter, Ollama and offline fallback
- `src/styles.css` — Tailwind import, custom palette and animations

The original kitty pixel mascot is independent artwork and not an official licensed character.
