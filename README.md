# TakeNote ✦ Pixel Edition

A playful, free, privacy-minded notes workspace with pastel pixel-art styling, an original kitty mascot, automatic highlights, multi-note boards, and monthly compilations.

## What it does
- Autosaved notes, editable side by side in **2×2** or **4×4** grids (plus focus mode), with pagination.
- Automatic **offline summaries** and **key-detail extraction** (dates, tasks, priorities) while you write.
- **Monthly dashboard** with note counts, words, active days, a notes timeline, combined summaries, and exportable Markdown recaps.
- Optional AI enhancement: **Ollama** (local/open-source; no paid API) or **OpenRouter free-model router** (free, rate-limited, user-provided key).
- Search, pin, colors, templates, JSON backup/restore, and Markdown export.
- Works as a static site; no account, backend, or build tools required.

## Run
Open `index.html` in a modern browser. For consistent local API behavior, serve it with:
```bash
python3 -m http.server 5173
```
Then open http://localhost:5173.

All notes are stored **only in this browser** with localStorage. Use **Backup JSON** periodically if your notes matter; browser-data deletion removes unbacked-up notes. There is no cloud sync.

## AI providers
Offline digest generation works without a service.

### Ollama (free & local)
1. Install [Ollama](https://ollama.com/) and pull a small open-weight model, for example `ollama pull gemma3:1b`.
2. Ensure Ollama is running; in the TakeNote AI settings choose **Ollama (local)** and enter the model name.
3. If browser cross-origin access is blocked, configure Ollama's `OLLAMA_ORIGINS` to include the exact app origin (for example `http://localhost:5173`, or your deployed GitHub Pages origin), then restart Ollama. Consult [Ollama's FAQ](https://docs.ollama.com/faq#how-do-i-configure-ollama-server) for OS-specific configuration.
4. Requests remain between your browser and the Ollama server configured at `http://localhost:11434`.

### OpenRouter (hosted free tier)
1. Create your own key at [OpenRouter](https://openrouter.ai/keys).
2. Choose **OpenRouter (free models)** in AI settings, paste the key, and use `openrouter/free` to route to an available free model.
3. Free-model requests are rate-limited and subject to service availability. A model picked by the free router is not guaranteed to be open-source; choose a specific open-weight `:free` model if required.
4. Your key is held in browser memory only for the current tab session (never committed or stored). Your note content is sent to the provider only when you click an AI action.

If an AI provider is unavailable, the app keeps working with offline summaries. Never publish private API keys in source code or commit them to Git.

## Publishing
The included GitHub Actions workflow deploys the repository to GitHub Pages when Pages is configured to use **GitHub Actions** as the publishing source. In GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## License
MIT. The kitty pixel mascot is original artwork, not official Sanrio/Hello Kitty art.
