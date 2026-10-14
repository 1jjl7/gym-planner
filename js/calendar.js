// ===== Attendance heatmap (Today tab) — 6 months, like GitHub's contribution map =====
// Each column is a week (Sunday → Saturday), each small square is a day:
//   attended → you logged at least one finished set that day (blue)
//   missed   → a training day of your plan that has passed with nothing logged (light red)
//   off      → a rest day of your plan — never counted as absent (grey)
//   today / future / before tracking started → not counted
// Below the map: a table with the numbers of every month shown.

const HEAT_WEEKS = 26;   // about 6 months
let heatOffset = 0;      // 0 = ends this week, 1 = the 6 months before, …
let heatSelected = null; // date the user tapped (to show its details)
let heatScrollPos = null; // where the user scrolled the map to (kept when the map redraws)

// The first day we count from: the day you started using the plan (kept even if you postpone later)
function trackingStart() {
  let from = store.get("trackingFrom") || startDate;
  const firstWorkout = Object.keys(loadWorkouts()).sort()[0];
  if (firstWorkout && firstWorkout < from) from = firstWorkout;
  return from;
}

function isRestDay(dateKey) {
  return SPLITS[currentSplit].days[cycleDayFor(parseDate(dateKey))].exercises.length === 0;
}

// Status of one date: attended | missed | off | off-future | pending | future | before
function dayStatus(dateKey, workouts, today, from) {
  const rest = isRestDay(dateKey);
  if (workouts[dateKey]) return "attended";
  if (dateKey > today) return rest ? "off-future" : "future";
  if (dateKey < from) return "before";
  if (rest) return "off";
  if (dateKey === today) return "pending";
  return "missed";
}

function renderCalendar() {
  const workouts = loadWorkouts();
  const todayD = todayDate();
  const today = formatDateInput(todayD);
  const from = trackingStart();

  // Window: HEAT_WEEKS weeks, the last one is "this week" moved back by the offset
  const lastWeekStart = addDays(weekStart(todayD), -7 * HEAT_WEEKS * heatOffset);
  const firstWeekStart = addDays(lastWeekStart, -7 * (HEAT_WEEKS - 1));

  // One grid for everything: column 1 = weekday letters, then one column per week.
  // Each column = [month label row] + 7 day rows, so letters, labels and squares always line up.
  let cells = `<span class="heat-label"></span>` + Array.from({ length: 7 }, (_, i) =>
    `<span class="heat-letter">${i % 2 === 0 ? formatDate(new Date(2026, 0, 4 + i), { weekday: "narrow" }) : ""}</span>`).join("");
  const monthKeys = new Set(); // months that appear in the map, e.g. "2026-10"

  for (let w = 0; w < HEAT_WEEKS; w++) {
    // month name on top of the week that contains the 1st of a month
    let label = "";
    for (let d = 0; d < 7; d++) {
      const date = addDays(firstWeekStart, w * 7 + d);
      if (date.getDate() === 1) label = formatDate(date, { month: "short" });
    }
    cells += `<span class="heat-label">${label}</span>`;
    for (let d = 0; d < 7; d++) {
      const date = addDays(firstWeekStart, w * 7 + d);
      const key = formatDateInput(date);
      const status = dayStatus(key, workouts, today, from);

      monthKeys.add(key.slice(0, 7));

      const cls = ["heat-cell", status];
      if (key === today) cls.push("today");
      if (key === heatSelected) cls.push("selected");
      const tip = `${formatDate(date, { weekday: "long", day: "numeric", month: "long" })}: ${t("cal_" + status.replace("-", "_"))}`;
      cells += `<button class="${cls.join(" ")}" data-date="${key}" title="${tip}" aria-label="${tip}"></button>`;
    }
  }

  // Month table: every month that appears in the map, counted over the WHOLE month
  // (so a month cut at the edge of the map still shows its full numbers). Newest first.
  const months = {};
  for (const m of monthKeys) months[m] = monthStats(m, workouts, today, from);
  const rows = Object.keys(months).sort().reverse()
    .filter((m) => months[m].attended + months[m].missed + months[m].off > 0)
    .map((m) => {
      const s = months[m];
      const counted = s.attendedOnTraining + s.missed;
      const rate = counted ? Math.round((s.attendedOnTraining / counted) * 100) + "%" : "—";
      const [y, mo] = m.split("-").map(Number);
      return `<tr><td>${formatDate(new Date(y, mo - 1, 1), { month: "long", year: "numeric" })}</td>
        <td>${s.attended}</td><td>${s.missed}</td><td>${s.off}</td><td><b>${rate}</b></td></tr>`;
    }).join("");

  // Details of the tapped day
  let selectedText = `<span class="muted small">${t("heatTapHint")}</span>`;
  if (heatSelected) {
    const st = dayStatus(heatSelected, workouts, today, from);
    selectedText = `<b>${formatDate(parseDate(heatSelected), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</b>: ${t("cal_" + st.replace("-", "_"))}`;
  }

  const rangeText = `${formatDate(firstWeekStart, { month: "short", year: "numeric" })} – ${formatDate(addDays(lastWeekStart, 6), { month: "short", year: "numeric" })}`;

  document.getElementById("calendarCard").innerHTML = `
    <div class="cal-nav">
      <button class="step" id="calPrev" aria-label="${t("prevMonth")}">${currentLang === "ar" ? "›" : "‹"}</button>
      <b>${rangeText}</b>
      <button class="step" id="calNext" aria-label="${t("nextMonth")}" ${heatOffset === 0 ? "hidden" : ""}>${currentLang === "ar" ? "‹" : "›"}</button>
    </div>
    <div class="heat-scroll" id="heatScroll">
      <div class="heat-grid" style="grid-template-columns:auto repeat(${HEAT_WEEKS},minmax(12px,1fr))">${cells}</div>
    </div>
    <div class="cal-stats">
      <span><i class="dot attended"></i>${t("calAttended")}</span>
      <span><i class="dot missed"></i>${t("calMissed")}</span>
      <span><i class="dot off"></i>${t("calOff")}</span>
    </div>
    <p class="heat-selected">${selectedText}</p>
    ${rows ? `<table class="data-table month-table">
      <thead><tr><th>${t("month")}</th><th>${t("calAttended")}</th><th>${t("calMissed")}</th><th>${t("calOff")}</th><th>${t("calRate")}</th></tr></thead>
      <tbody>${rows}</tbody></table>` : ""}
  `;

  // On narrow screens the map scrolls sideways: start on the newest weeks
  // (newest is at the end: the left side in Arabic, the right side in English)
  const scroller = document.getElementById("heatScroll");
  scroller.scrollLeft = heatScrollPos ?? (currentLang === "ar" ? -scroller.scrollWidth : scroller.scrollWidth);
  scroller.addEventListener("scroll", () => { heatScrollPos = scroller.scrollLeft; });

  document.getElementById("calPrev").addEventListener("click", () => {
    heatOffset++;
    heatScrollPos = null;
    renderCalendar();
  });
  document.getElementById("calNext").addEventListener("click", () => {
    heatOffset = Math.max(0, heatOffset - 1);
    heatScrollPos = null;
    renderCalendar();
  });
  document.querySelectorAll(".heat-cell").forEach((cell) => {
    cell.addEventListener("click", () => {
      heatSelected = heatSelected === cell.dataset.date ? null : cell.dataset.date;
      renderCalendar();
    });
  });
}

// One-line summary of this month for the Today tab; tapping it opens the full map in Progress
function renderMonthSummary() {
  const today = formatDateInput(todayDate());
  const s = monthStats(today.slice(0, 7), loadWorkouts(), today, trackingStart());
  const counted = s.attendedOnTraining + s.missed;
  const rate = counted ? Math.round((s.attendedOnTraining / counted) * 100) + "%" : "—";
  document.getElementById("monthSummary").innerHTML =
    `📅 ${t("thisMonth")}: <b>${s.attended}</b> ${t("calAttended")} · <b>${s.missed}</b> ${t("calMissed")} · ${t("calRate")} <b>${rate}</b>
     <span class="month-summary-arrow">${currentLang === "ar" ? "←" : "→"}</span>`;
}

document.getElementById("monthSummary").addEventListener("click", () => {
  showTab("progress");
  renderProgress();
  document.getElementById("attendanceSection").scrollIntoView({ behavior: "smooth", block: "start" });
});

// Numbers of one whole month ("2026-10")
function monthStats(monthKey, workouts, today, from) {
  const [y, m] = monthKey.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const s = { attended: 0, attendedOnTraining: 0, missed: 0, off: 0 };
  for (let d = 1; d <= days; d++) {
    const key = formatDateInput(new Date(y, m - 1, d));
    const status = dayStatus(key, workouts, today, from);
    if (status === "attended") {
      s.attended++;
      if (!isRestDay(key)) s.attendedOnTraining++;
    }
    if (status === "missed") s.missed++;
    if (status === "off") s.off++;
  }
  return s;
}

// Small date helpers (week starts on Sunday)
function weekStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
}
function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}
