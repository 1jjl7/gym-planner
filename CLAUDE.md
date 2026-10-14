# Gym Planner — technical notes

Plain HTML/CSS/JS PWA, no build step. Live: https://khutati.vercel.app (Vercel auto-deploys every push to `main`).
Local preview: `.claude/launch.json` config "gym-planner" → http://localhost:5501.

## Rules
- Every push to `main` is a live update → show changes locally and get approval first.
- localStorage only through the `store` wrapper (`js/storage.js`, keys prefixed `gp_`).
- Derived values (PRs, weekly sets, heatmap) are computed from the log, never stored.
- Custom plans are copy-on-write: built-in splits in `data/splits.js` are never edited.
- Numbers inside Arabic text get `dir="ltr"` so they don't reorder.

## Service worker (`sw.js`)
- Own files: network-first with `cache: "no-cache"`; images/CDN: cache-first (`STATIC_CACHE` fixed).
- Bump `VERSION` whenever the file list changes.
- `/_vercel/*` (Web Analytics) is skipped — never cached.

## Gotchas
- The app's Browser pane hides alert/confirm and validation bubbles → inline errors, `novalidate`, two-tap delete.
- Analytics script `/_vercel/insights/script.js` 404s locally (exists only on Vercel) — expected.
- Ideas backlog: `docs/feature-ideas.md`.
