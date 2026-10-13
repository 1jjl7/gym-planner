// ===== Progress tab: stat tiles + charts (Chart.js) =====
// Everything is computed from the saved data (workouts, body weights) every time the tab opens.

const charts = {}; // Chart.js objects, kept so we can destroy them before drawing again

// Colors come from the CSS variables, so the charts match the site theme
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Estimated one-rep max (Epley formula): weight × (1 + reps / 30)
function estimated1RM(w, r) {
  return r <= 1 ? w : Math.round(w * (1 + r / 30) * 10) / 10;
}

// ----- Data helpers -----

// All exercises (movement.equipment) that have at least one finished set
function loggedExercises() {
  const counts = {};
  for (const day of Object.values(loadWorkouts())) {
    for (const [key, sets] of Object.entries(day.logs)) {
      if (sets.some((s) => s.done)) counts[key] = (counts[key] || 0) + 1;
    }
  }
  // most logged first
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
}

// For one exercise: [{ date, w, r, oneRM }] — the heaviest set of each workout, oldest first
function exerciseHistory(key) {
  const workouts = loadWorkouts();
  return Object.keys(workouts).sort().flatMap((date) => {
    const done = (workouts[date].logs[key] || []).filter((s) => s.done);
    if (!done.length) return [];
    const top = done.reduce((a, b) => (b.w > a.w || (b.w === a.w && b.r > a.r) ? b : a));
    return [{ date, w: top.w, r: top.r, oneRM: estimated1RM(top.w, top.r) }];
  });
}

function totals() {
  let sets = 0;
  let volume = 0;
  const workouts = loadWorkouts();
  for (const day of Object.values(workouts)) {
    for (const list of Object.values(day.logs)) {
      for (const s of list) {
        if (!s.done) continue;
        sets += 1;
        volume += s.w * s.r;
      }
    }
  }
  return { workouts: Object.keys(workouts).length, last7: workoutsLast7Days(), sets, volume };
}

// ----- Shared chart look -----
function baseOptions() {
  const muted = cssVar("--muted");
  const grid = cssVar("--border");
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    interaction: { mode: "index", intersect: false }, // hover anywhere above a point
    plugins: {
      legend: { display: false }, // one series per chart → the title names it
      tooltip: {
        rtl: currentLang === "ar",
        backgroundColor: cssVar("--bg"),
        borderColor: grid,
        borderWidth: 1,
        titleColor: cssVar("--text"),
        bodyColor: cssVar("--text"),
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: muted, maxRotation: 0, autoSkipPadding: 12 } },
      y: {
        beginAtZero: false,
        grid: { color: grid },
        border: { display: false },
        ticks: { color: muted, precision: 0 },
      },
    },
  };
}

function lineDataset(values) {
  const accent = cssVar("--accent");
  return {
    data: values,
    borderColor: accent,
    backgroundColor: accent,
    borderWidth: 2,
    pointRadius: 4, // 8px markers
    pointHoverRadius: 6,
    pointBorderColor: cssVar("--card"), // thin ring so overlapping points stay readable
    pointBorderWidth: 2,
    tension: 0.25,
  };
}

// Draw (or redraw) one chart, or show an "empty" message instead
function drawChart(id, config, isEmpty, emptyText) {
  // No internet the first time → the chart library didn't load; the rest of the tab still works
  if (typeof Chart === "undefined") {
    isEmpty = true;
    emptyText = t("chartsOffline");
  }
  if (charts[id]) charts[id].destroy();
  const wrap = document.getElementById(id).parentElement;
  wrap.querySelector(".chart-empty")?.remove();
  document.getElementById(id).hidden = isEmpty;
  if (isEmpty) {
    wrap.insertAdjacentHTML("beforeend", `<p class="chart-empty muted small">${emptyText}</p>`);
    return;
  }
  charts[id] = new Chart(document.getElementById(id), config);
}

// "19/8" written by hand: Arabic date strings contain invisible direction marks
// that the chart canvas draws in the wrong order ("8/19")
const shortDate = (d) => `${d.getDate()}/${d.getMonth() + 1}`;

// ----- Main render -----
function renderProgress() {
  // 1) Stat tiles
  const tot = totals();
  document.getElementById("statTiles").innerHTML = [
    [tot.workouts, t("statWorkouts")],
    [tot.last7, t("statLast7")],
    [tot.sets, t("statSets")],
    [tot.volume >= 1000 ? (tot.volume / 1000).toFixed(1) + " " + t("tons") : tot.volume + " " + t("kg"), t("statVolume")],
  ].map(([value, label]) => `<div class="stat-tile"><b dir="ltr">${value}</b><span class="muted small">${label}</span></div>`).join("");

  // 2) Exercise progress
  const select = document.getElementById("progressExercise");
  const keys = loggedExercises();
  const chosen = keys.includes(select.value) ? select.value : keys[0];
  select.innerHTML = keys.map((k) => {
    const [m, eq] = k.split(".");
    return `<option value="${k}">${MOVEMENTS[m].name[currentLang]} · ${EQUIPMENT[eq][currentLang]}</option>`;
  }).join("");
  select.hidden = keys.length === 0;
  if (chosen) select.value = chosen;

  const history = chosen ? exerciseHistory(chosen) : [];
  const exOptions = baseOptions();
  exOptions.plugins.tooltip.callbacks = {
    label: (ctx) => {
      const p = history[ctx.dataIndex];
      return [`${t("topSet")}: ${p.w} ${t("kg")} × ${p.r}`, `${t("est1RM")}: ${p.oneRM} ${t("kg")}`];
    },
  };
  drawChart("exerciseChart", {
    type: "line",
    data: { labels: history.map((p) => shortDate(parseDate(p.date))), datasets: [lineDataset(history.map((p) => p.w))] },
    options: exOptions,
  }, history.length === 0, t("noExerciseData"));

  // Table view of the same numbers (accessible + easy to copy)
  document.getElementById("exerciseTable").innerHTML = history.length
    ? `<table class="data-table"><thead><tr><th>${t("date")}</th><th>${t("topSet")}</th><th>${t("est1RM")}</th></tr></thead><tbody>${
        history.slice().reverse().map((p) => `<tr><td>${shortDate(parseDate(p.date))}</td><td dir="ltr">${p.w} × ${p.r}</td><td dir="ltr">${p.oneRM}</td></tr>`).join("")
      }</tbody></table>`
    : "";

  // 3) Attendance map (calendar.js) — sits where the weekly bars used to be
  renderCalendar();

  // 4) Body weight
  const bw = loadBodyWeights();
  const bwDates = Object.keys(bw).sort();
  const bwOptions = baseOptions();
  bwOptions.plugins.tooltip.callbacks = { label: (ctx) => `${ctx.parsed.y} ${t("kg")}` };
  drawChart("bodyWeightChart", {
    type: "line",
    data: { labels: bwDates.map((d) => shortDate(parseDate(d))), datasets: [lineDataset(bwDates.map((d) => bw[d]))] },
    options: bwOptions,
  }, bwDates.length < 2, t("noBodyWeightData"));
}

document.getElementById("progressExercise").addEventListener("change", renderProgress);
