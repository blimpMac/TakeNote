# TakeNote

A cozy, pixel-inspired notebook with a **pink 8-bit T logo**, built with **React 19**, **Vite**, **Tailwind CSS v4** and custom CSS. The site is login-free, and notes save locally in your browser.

## Features
- **New note** opens the dedicated writing desk. Your text autosaves as you type.
- **My notes** is a saved-note library with month, color, search, and sorting filters. Click a saved-note card to open a **pixel-styled editing window inside the website** (a modal, not a new browser tab). The note stays editable and saved.
- Writing desk grid controls: **1×1** (one note), **2×2** (four different note slots), **4×4** (sixteen slots). Empty slots create new notes.
- Bullet, numbered and checkbox lists automatically continue with Enter; Enter on a blank list item exits list mode.
- Browser spellcheck plus AI suggestions: spelling/grammar, wording improvements, restructuring and highlights. Review the original and proposed text before applying changes.
- Daily rotating inspirational quotes, a **Day / Week / Month / Year Notes Insights dashboard**, pinned notes, JSON backup/restore, and Markdown export.
- The writing desk excludes the previous quick-highlights/productivity cards and footer for a cleaner focus.
- Subtle hover/float/window animations, with reduced-motion accessibility support.

## Compatibility and local storage
The app uses the same browser storage key as the original site: `takenote.pixel.v1`. It normalizes existing notes without changing their content. Notes are local to each browser/device; there is **no cloud sync or login**. Backup periodically from **My notes → Backup** or **Monthly recap → Backup JSON**. Browser storage can be deleted when clearing site data.

## Automatic Notes Insights — daily, weekly, monthly, yearly

Open **Notes insights** from the notebook menu. The app automatically processes the notes matching the selected calendar period.

- **Period filter:** Day, Week (Monday–Sunday), Month, or Year. Pick a date/month/year, use previous/next, or jump to the current period.
- **Date basis:** Choose **Created** or **Last edited** to determine which notes are counted. Dates follow the browser's local timezone.
- **Search filter:** Search only within that selected period. Tap any extracted topic to narrow the search.
- **Automatically compiled:** Note count, word count, active writing days, checklisted to-dos, explicit decisions and dates mentioned, a short factual overview, key snippets, repeated terms and writing-activity chart.
- **Open source note:** Click an extracted highlight, task, decision or saved-note card to open it in the existing pixel-themed in-app editing window.
- **Export insights:** Download the selected period's interpretation and underlying notes as Markdown. You can still export a full JSON backup.
- **Optional deeper AI recap:** Click **Deeper AI recap** for a hosted model summary of the filtered notes. It requires a configured API provider. The AI result is never applied automatically.

The automatic interpretation is **rule-based and local**, so it needs no API key, runs immediately on saved notes, and does not upload their contents. It extracts only phrases present in the notes, so it cannot infer unstated tasks or context as an LLM might. Date references in note text are not used to assign notes to a period: the period filters operate on note creation or last-edit timestamps.

## Hosted AI setup — no local model required

The TakeNote source is stored in **GitHub** and deployed automatically to **Vercel**. GitHub repositories and GitHub Pages do not run a live LLM inference API. Vercel provides the serverless `/api/ai` endpoint, which forwards requests to a cloud AI provider.

The following choices are integrated in **AI settings**:

1. **OpenRouter free-model router** (default): create a key at https://openrouter.ai/keys and use the model `openrouter/free`. This routes to a currently available free model; availability and free-tier rate limits apply. Paid model IDs are blocked.
2. **Groq Cloud free tier**: create a key at https://console.groq.com/keys. The app uses `openai/gpt-oss-20b` for hosted inference, subject to Groq account limits.
3. **Offline helper**: rule-based spelling/wording corrections without an AI model. It is a fallback, not generative AI.

No Ollama installation or local inference is required.

### Two ways to connect a hosted AI API key

**Personal key (easy):** Choose a provider in TakeNote → AI settings, paste your API key, and save. The key stays in page memory for this tab and is forwarded only on an explicit AI request. It is not included in repository files or localStorage. Each user supplies their own key.

**Shared deployment key (one-time setup):** In Vercel → TakeNote project → Settings → Environment Variables, add either `OPENROUTER_API_KEY` or `GROQ_API_KEY` with a valid provider key, then redeploy. The website detects the configured provider via `GET /api/ai`, and visitors do not need to enter keys. **Important:** this makes a shared API quota available to the public. The serverless endpoint has a basic best-effort in-memory per-IP limiter (5/minute, 30/day), which is not reliable across instances; for an open public app use a durable rate limiter, provider-side key spending limits, and usage monitoring before relying on shared credentials.

Vercel has **no configured API keys at the time of this update**, so hosted AI needs one of the options above before it can successfully generate. Never put secrets in GitHub source, `.env.example`, or client-side `VITE_*` variables.

AI changes are always suggestions: compare the original and proposed text, then click **Apply revision**. Basic spellcheck and browser right-click spelling suggestions work independently.

GitHub Models is not an option; GitHub retired its inference API on July 30, 2026. See https://docs.github.com/en/github-models.

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
- `src/lib/insights.js` — date-range filtering, automatic interpretation and insights exports
- `src/lib/ai.js` — hosted OpenRouter/Groq inference and offline fallback
- `api/ai.js` — Vercel serverless AI proxy with provider validation
- `src/styles.css` — Tailwind import, custom palette and animations

The original kitty pixel mascot is independent artwork and not an official licensed character.
