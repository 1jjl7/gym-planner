# Feature ideas (competitor research, 2026-10-13)

One research pass over 10 apps: Strong, Hevy, JEFIT, Fitbod, Alpha Progression, Boostcamp,
StrongLifts 5x5, Caliber, Gymshark Training, MacroFactor. Free/paid details come mostly from vendor
pages and app-store listings — they change often; items marked *unverified* couldn't be confirmed.

Status (2026-10-14): **Built #1 rest timer, #2 plate calculator, #3 warm-up calculator, #4 PR alerts + list, #6 weekly sets per muscle, #7 plan editor.** #5 next-weight suggestion was dropped by Ahmed. The rest are backlog.

| # | Feature | Status | Offered by | Value | Effort |
|---|---|---|---|---|---|
| 1 | Rest timer — starts on ✓, per-exercise default, ±15 s, vibrate/beep | New | Almost all; free in Hevy, Boostcamp | High | Easy |
| 2 | Plate calculator — plates per side for a target weight (greedy algorithm) | New | Hevy, Boostcamp (free); StrongLifts, Alpha (paid) | High | Easy |
| 3 | Warm-up calculator — 40%×10, 60%×5, 80%×3 of working weight | New | Hevy, StrongLifts, Alpha (paid) | High | Easy |
| 4 | Live PR alert + PR list per exercise | Improve (e1RM exists) | Hevy, Strong, Boostcamp | High | Easy |
| 5 | Next-weight suggestion — double progression rule | Improve (prefill only repeats last time) | Alpha, MacroFactor (paid) | High | Medium |
| 6 | Weekly sets per muscle on the existing SVG body map | New | Boostcamp, Hevy (paid) | High | Easy–Medium |
| 7 | Routine builder — edit exercises / sets / reps per day | Improve (splits are fixed) | All | High | Medium |
| 8 | Notes per exercise / workout ("seat on 4") | New | Strong, Hevy | Medium | Easy |
| 9 | Set types — warm-up / normal / failure / drop set (warm-ups excluded from PRs) | New | Strong, Hevy, Boostcamp | Medium | Easy |
| 10 | Weekly / monthly report card | New | Boostcamp (free), Hevy (paid) | Medium | Easy |
| 11 | Body measurements (waist, arm…); photos later via IndexedDB | Improve (weight only) | Strong, Hevy, MacroFactor | Medium | Easy (photos Medium) |
| 12 | Auto deload — suggest −10% after repeated failures | New | StrongLifts, Alpha | Medium | Easy–Medium |
| 13 | RIR / RPE per set | New | Boostcamp, Alpha, MacroFactor | Medium | Easy |
| 14 | Supersets | New | Strong, Hevy, Boostcamp | Medium | Medium |
| 15 | Per-exercise charts: volume series + time-range filter | Improve | Strong, Hevy, Alpha | Medium | Easy |
| 16 | Custom exercises | New | Strong, Hevy, Gymshark | Medium | Easy–Medium |
| 17 | Ready-made programs with progression (5×5, GZCLP) | Improve | StrongLifts, Boostcamp | Medium | Medium |
| 18 | Gym profiles (home vs gym equipment) | New | Alpha, MacroFactor | Low–Medium | Medium |
| 19 | Strength score 0–100 (public strength standards) | New | Boostcamp, Caliber (paid) | Low–Medium | Easy |
| 20 | Muscle recovery % (time-decay model) | New | Fitbod (paid) | Medium | Medium |
| 21 | Watch app / lock-screen widget | New | Hevy, Strong, JEFIT | Low | Not possible in a PWA |

**Not worth copying:** AI-generated workouts (needs data + server), social feed (needs accounts),
human coaching chat, watch / Health sync (native only), huge video libraries.

**Claude's picks for portfolio value:** #2 (greedy algorithm), #5 (progression logic), #6 (data analysis on the
existing body map). Quick wins: #4, #8. Note: Ahmed earlier said #1 and #5 weren't necessary — research
ranks them high, so it's his call.

Sources: hevyapp.com feature pages, boostcamp.app/pro, alphaprogression.com, macrofactor.com/workouts,
fitbod.me blog + help, App Store listings (Strong, StrongLifts, Caliber, MacroFactor), sensai.fit reviews,
tomsguide.com Gymshark review, jefit.com blog.

## Bigger ideas for later (Ahmed, 2026-10-14)

### A. Meal photo → calories & protein (AI)
- Use an existing vision model (e.g. Claude) instead of training one — training needs deep learning,
  a GPU and a large labelled dataset (e.g. Nutrition5k).
- Needs a **backend**: the API key must never be in the website code. A Vercel Serverless Function can hold it.
- Needs a **usage limit** (paid per request) and a **privacy notice** (photos go to a third party).
- Be honest about accuracy: portion size from a photo is hard (±20–30%); let the user correct the amount.
- Ties into the profile: "this meal = 35% of your daily protein".

### B. Usage dashboard (who uses it, who keeps using it)
- Step 1: Vercel Web Analytics (visitors, no cookies). **Done 2026-10-14.** Note: page-based bounce rate is ~100% for a one-page app; real engagement needs custom events (Pro plan).
- Step 2: anonymous events (random device id, no personal data): workout logged, feature used →
  DAU / WAU, retention after 1 / 4 weeks, most-used features.
- Knowing users *by name* would need accounts + a backend and makes us responsible for personal data
  (Saudi PDPL). Prefer "how many", not "who"; tell users what is collected.
- Analysis in pandas + a Power BI dashboard (retention cohorts, funnel) = a full Data Analyst portfolio project.

### C. Health-data analysis project (Apple Health + this app)
- Apple Health → Export All Health Data gives an XML file (steps, sleep, weight).
- Join it with this app's CSV export in pandas → questions like "do I lift more after more sleep?" → Power BI dashboard.
- Own real data, every claim verifiable — a good Data Analyst portfolio project.
- Direct sync isn't possible from a PWA: Apple Health / Google Health Connect APIs are native-only.

### D. Sign-in / health-app permissions (OAuth)
- "Sign in with X" (OAuth) only works if the provider offers it to developers.
- Sehhaty / Rashaqa: no public developer API as far as we know (*unverified* — check before building).
- Nafath: identity only (not health data) and only for approved organisations.
- Realistic option: "Sign in with Google" to sync workouts between devices — needs a backend + database
  and makes us responsible for personal data (Saudi PDPL).
- Meanwhile use Rashaqa for food and this app for training, side by side.

### E. Apple Health via Shortcuts (weekly or one tap) — planned 2026-10-17
- A website can't read Apple Health (HealthKit / Core Motion are native-only). The bridge is Apple's
  **Shortcuts** app, which can read Health data ("Find Health Samples").
- Ahmed builds the shortcut ONCE on his iPhone and shares it as an **iCloud link**; the site gets an
  "Connect Apple Health" button → user taps "Add Shortcut" (one tap, like the Outcap app).
- The shortcut reads the last 7 days → opens `khutati.vercel.app/#health=...`. The part after `#` never
  reaches the server, so health data stays on the phone. Site parses it and saves to localStorage.
- Run by tapping (home-screen / widget) or a **weekly automation** (e.g. Sunday 9:00) — check on Ahmed's
  phone whether it runs without asking.
- Ask only for what's needed (least privilege): weight, sleep, steps; maybe active energy, resting HR
  (*unverified* availability). No location.
- Uses: auto-fill body weight (profile advice + weight goal), sleep vs training volume, steps on rest days,
  weekly report in Progress, smart hints ("slept < 6 h three nights → go lighter").
- Correlation ≠ causation; tiny sample (one person) → present as observations.
- iPhone only. Claude can't control the iPhone → Ahmed does the steps and sends screenshots.
- First test: shortcut sends today's steps only → site shows the number.

### F. Meal photo with CLIP + SFDA tables (free, on-device) — planned 2026-10-17
- **Food data:** SFDA "Saudi Food Composition Tables" (June 2026): 130 Saudi dishes, nutrients per 100 g.
  https://www.sfda.gov.sa/en/news/19089 — TODO: read SFDA terms of use before copying values; open the
  PDF (>10 MB) and confirm dish names (kabsa, jareesh, marqooq…).
- **Model:** CLIP zero-shot (`Xenova/clip-vit-base-patch32`, Transformers.js) — give it a photo + list of
  dish names, it ranks the closest. No training needed. TODO: confirm license and download size (~90–150 MB guess).
- **Flow:** photo → CLIP suggests top 3 dishes → user confirms + picks portion (plate / half / grams) →
  calories & protein from the SFDA table → % of daily protein from the profile.
- **Cost:** free per use (runs on the phone); model files served by Hugging Face.
- **Risks:** big first download (load only when the user enables it, show the size), slow on old phones,
  similar dishes get mixed (kabsa / mandi / biryani), portion is manual, foods outside the table,
  **iPhone Safari may crash on large models** (biggest risk), depends on Hugging Face hosting.
- Add a notice: "estimates, not medical advice".
- **vercel.json blocks the camera** (`Permissions-Policy: camera=()`) — change it to `camera=(self)` when building
  this, and add the model host (huggingface.co / its CDN) to the CSP `connect-src`.
- **First test:** separate test page, 5–10 real meal photos from Ahmed's phone → record accuracy, time,
  whether the iPhone copes → then decide: keep A, switch to Claude API (B, paid, more accurate),
  or a searchable dish list only (C).
- Researched but not chosen: no ready Food-101 ONNX model found (would need training); MENA-150
  (150 MENA dishes, license unknown); small Roboflow sets with kabsa (detection, license unclear).

### G. Profile photo and name
- Add a name and a photo to the existing profile (age / height / sex). Show them in the header ("Hi, Ahmed").
- No accounts: every person's profile already lives on their own device — nothing to set up per user.
- Photo: resize in the browser (canvas, ~256 px) before saving so localStorage (~5 MB) doesn't fill up;
  include it in the backup file.
- Sharing one profile across devices would need accounts + a backend (see D).

## Security review follow-ups (2026-10-17)
Done locally: 1) `esc()` on every user / backup text in innerHTML, 2) field-by-field backup validation,
3) safe `store.getJSON` + "couldn't save" bar, 4) `vercel.json` CSP + security headers + SRI on Chart.js,
5) offline fallback only for page visits.
**Next (reminder for Ahmed): 6) automated tests** for pure functions (checkBackup, estimated1RM, plates,
warm-up) — then the medium items: one in-memory cache instead of 22× loadWorkouts(), schema version,
ES modules, generated APP_FILES list, aria labels / tab roles.
