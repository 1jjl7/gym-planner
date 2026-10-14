// ===== Weekly sets per muscle (Progress tab) =====
// Counts finished sets for every muscle in one week (Sunday → Saturday):
//   the exercise's PRIMARY muscle gets 1 set, each SECONDARY (helper) muscle gets 0.5 set.
// Then colors the body map by that number and lists the muscles with a simple status:
//   under 10 = low, 10–20 = good, over 20 = high  (a common general guideline for muscle growth).

const VOLUME_LOW = 10;
const VOLUME_HIGH = 20;
let volumeWeekOffset = 0; // 0 = this week, 1 = last week, …

function weeklyMuscleSets(weekStartDate) {
  const from = formatDateInput(weekStartDate);
  const to = formatDateInput(addDays(weekStartDate, 6));
  const totals = Object.fromEntries(Object.keys(MUSCLES).map((m) => [m, 0]));

  for (const [date, day] of Object.entries(loadWorkouts())) {
    if (date < from || date > to) continue;
    for (const [key, sets] of Object.entries(day.logs)) {
      const [movement, equip] = key.split(".");
      const variant = MOVEMENTS[movement]?.variants[equip];
      if (!variant) continue;
      const n = sets.filter((s) => s.done && s.r > 0).length;
      variant.primary.forEach((m) => { totals[m] += n; });
      variant.secondary.forEach((m) => { totals[m] += n * 0.5; });
    }
  }
  return totals;
}

// Color step for the body map (one hue, darker/brighter = more sets)
function volumeLevel(sets) {
  if (sets === 0) return "lvl-0";
  if (sets < 5) return "lvl-1";
  if (sets < VOLUME_LOW) return "lvl-2";
  if (sets <= VOLUME_HIGH) return "lvl-3";
  return "lvl-4";
}

function volumeStatus(sets) {
  if (sets < VOLUME_LOW) return { cls: "low", text: "⚠️ " + t("volLow") };
  if (sets <= VOLUME_HIGH) return { cls: "good", text: "✅ " + t("volGood") };
  return { cls: "high", text: "🔶 " + t("volHigh") };
}

// 12.5 → "12.5", 12 → "12"
const fmtSets = (n) => String(Math.round(n * 10) / 10);

function renderVolume() {
  const start = addDays(weekStart(todayDate()), -7 * volumeWeekOffset);
  const totals = weeklyMuscleSets(start);
  const isThisWeek = volumeWeekOffset === 0;
  const range = `${formatDate(start, { day: "numeric", month: "short" })} – ${formatDate(addDays(start, 6), { day: "numeric", month: "short" })}`;

  // shape tooltip: e.g. "Chest: 14 sets" (shared shape lists both muscles)
  const label = (shape, value) =>
    SHAPE_TO_MUSCLES[shape].map((m) => MUSCLES[m][currentLang]).join(" / ") + `: ${fmtSets(value)} ${t("volSets")}`;

  const rows = Object.keys(MUSCLES)
    .sort((a, b) => totals[b] - totals[a])
    .map((m) => {
      const st = volumeStatus(totals[m]);
      return `<tr><td>${MUSCLES[m][currentLang]}</td><td><b>${fmtSets(totals[m])}</b></td><td><span class="vol-chip ${st.cls}">${st.text}</span></td></tr>`;
    }).join("");

  const total = Object.values(totals).reduce((a, b) => a + b, 0);

  document.getElementById("volumeBody").innerHTML = `
    <div class="cal-nav">
      <button class="step" id="volPrev" aria-label="${t("prevWeek")}">${currentLang === "ar" ? "›" : "‹"}</button>
      <b>${isThisWeek ? t("thisWeekLabel") + " · " : ""}${range}</b>
      <button class="step" id="volNext" aria-label="${t("nextWeek")}" ${isThisWeek ? "hidden" : ""}>${currentLang === "ar" ? "‹" : "›"}</button>
    </div>
    ${total === 0 ? `<p class="chart-empty muted small">${t("volEmpty")}</p>` : `
    <div class="vol-map">${bodyMapLevels(totals, volumeLevel, label)}</div>
    <div class="cal-stats vol-legend">
      <span><i class="dot lvl-0"></i>0</span>
      <span><i class="dot lvl-1"></i><span dir="ltr">1–4</span></span>
      <span><i class="dot lvl-2"></i><span dir="ltr">5–9</span></span>
      <span><i class="dot lvl-3"></i><span dir="ltr">10–20</span></span>
      <span><i class="dot lvl-4"></i><span dir="ltr">20+</span></span>
    </div>
    <table class="data-table vol-table">
      <thead><tr><th>${t("volMuscle")}</th><th>${t("volSetsHead")}</th><th>${t("volStatus")}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`}
    <p class="muted small">${t("volNote")}</p>
  `;

  document.getElementById("volPrev").addEventListener("click", () => { volumeWeekOffset++; renderVolume(); });
  document.getElementById("volNext").addEventListener("click", () => {
    volumeWeekOffset = Math.max(0, volumeWeekOffset - 1);
    renderVolume();
  });
}
