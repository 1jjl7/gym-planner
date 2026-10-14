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
- Step 1: Vercel Web Analytics (visitors, no cookies).
- Step 2: anonymous events (random device id, no personal data): workout logged, feature used →
  DAU / WAU, retention after 1 / 4 weeks, most-used features.
- Knowing users *by name* would need accounts + a backend and makes us responsible for personal data
  (Saudi PDPL). Prefer "how many", not "who"; tell users what is collected.
- Analysis in pandas + a Power BI dashboard (retention cohorts, funnel) = a full Data Analyst portfolio project.
