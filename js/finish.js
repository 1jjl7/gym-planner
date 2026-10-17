// ===== Finish workout =====
// One button under today's exercises. Shown once at least one set is ticked ✓.
// Finishing: removes the sets that were NOT ticked, stops the rest timer and marks the day
// as finished ("finished: true" on that date in the log). The button then becomes a one-line
// summary with an "Undo" link (undo re-opens the day; removed sets don't come back).

function todayKey() {
  return formatDateInput(todayDate());
}

function isTodayFinished() {
  const day = loadWorkouts()[todayKey()];
  return Boolean(day && day.finished);
}

// Summary numbers for one day: finished sets, volume (kg × reps) and new records
function daySummary(dateKey) {
  const day = loadWorkouts()[dateKey];
  let sets = 0;
  let volume = 0;
  let records = 0;
  for (const [key, list] of Object.entries(day.logs)) {
    const done = list.filter((s) => s.done);
    sets += done.length;
    volume += done.reduce((sum, s) => sum + s.w * s.r, 0);
    // a record = today's best beats the best of all EARLIER days (one per exercise)
    const earlier = doneSetsOf(key).filter((s) => s.date < dateKey);
    if (earlier.length && done.length) {
      const old = bestOf(earlier);
      const now = bestOf(done);
      const heavier = now.heaviest && old.heaviest && now.heaviest.w > old.heaviest.w;
      const stronger = now.e1rm && old.e1rm && now.e1rm.value > old.e1rm.value;
      if (heavier || stronger) records++;
    }
  }
  return { sets, volume: Math.round(volume), records };
}

function finishWorkout() {
  const dateKey = todayKey();
  const workouts = loadWorkouts();
  const day = workouts[dateKey];
  if (!day) return;
  // keep only the ticked sets; drop exercises with none
  for (const key of Object.keys(day.logs)) {
    day.logs[key] = day.logs[key].filter((s) => s.done);
    if (day.logs[key].length === 0) delete day.logs[key];
  }
  day.finished = true;
  saveWorkouts(workouts);
  stopRestTimer();
  renderToday(); // redraws the set panels (without the removed sets) and this box
}

function undoFinish() {
  const workouts = loadWorkouts();
  const day = workouts[todayKey()];
  if (!day) return;
  delete day.finished;
  saveWorkouts(workouts);
  renderToday(); // re-opens the collapsed exercises too
}

// Draws the button / summary line. Called by renderToday() and after every ✓.
function renderFinishBox() {
  const box = document.getElementById("finishBox");
  const day = loadWorkouts()[todayKey()];
  const hasDone = day && Object.values(day.logs).some((list) => list.some((s) => s.done));

  if (!hasDone) {
    box.hidden = true; // nothing ticked yet (or a rest day)
    return;
  }
  box.hidden = false;

  if (day.finished) {
    const s = daySummary(todayKey());
    const title = document.getElementById("todayTitle").textContent;
    const parts = [
      t("finishedTitle").replace("{day}", esc(title)),
      t("finishedSets").replace("{n}", s.sets),
      `<span dir="ltr">${s.volume.toLocaleString("en")}</span> ${t("kg")}`,
    ];
    if (s.records) parts.push(`🏆 ${t("finishedRecords").replace("{n}", s.records)}`);
    box.innerHTML = `<div class="finish-done">
        <span>✅ ${parts.join(" · ")}</span>
        <button id="undoFinishBtn">${t("undo")}</button>
      </div>`;
    document.getElementById("undoFinishBtn").addEventListener("click", undoFinish);
    return;
  }

  box.innerHTML = `<button id="finishBtn" class="finish-btn">${t("finishWorkout")}</button>`;
  confirmClick(document.getElementById("finishBtn"), finishWorkout);
}
