// ===== Workout log =====
// Everything is saved in the browser (localStorage) under "workouts":
// {
//   "2026-10-13": {
//     split: "ppl_ul", dayIndex: 0,
//     logs: { "flat_press.dumbbell": [ { w: 25, r: 10, done: true }, ... ] }
//   },
//   ...
// }
// The log key is "movement.equipment" because 25 kg with dumbbells ≠ 25 kg with a barbell.

const WEIGHT_STEP = 2.5;
// Allowed values for one set (w = weight in kg, r = reps)
const SET_LIMITS = { w: 500, r: 100 };

// Keep a number inside 0..max (anything typed outside is pulled back to the limit)
function clampSet(field, value) {
  return Math.min(SET_LIMITS[field], Math.max(0, value));
}

// Two-tap delete: 1st tap asks "sure?", 2nd tap (within 3 s) runs the action.
// (Used instead of confirm() pop-ups, which some in-app browsers don't show.)
function confirmClick(button, action) {
  const original = button.textContent;
  let armed = false;
  let timer = null;
  button.addEventListener("click", () => {
    if (armed) {
      clearTimeout(timer);
      action();
      return;
    }
    armed = true;
    button.textContent = t("tapAgain");
    button.classList.add("danger");
    timer = setTimeout(() => {
      armed = false;
      button.textContent = original;
      button.classList.remove("danger");
    }, 3000);
  });
}

function loadWorkouts() {
  return JSON.parse(store.get("workouts") || "{}");
}
function saveWorkouts(workouts) {
  store.set("workouts", JSON.stringify(workouts));
}

function logKey(movement, equip) {
  return movement + "." + equip;
}

// Sets saved for one exercise on one date (empty list if none)
function getSets(dateKey, key) {
  const day = loadWorkouts()[dateKey];
  return day && day.logs[key] ? day.logs[key] : [];
}

// Save the sets of one exercise on one date. Removes empty days so the history stays clean.
function setSets(dateKey, key, sets, dayInfo) {
  const workouts = loadWorkouts();
  if (!workouts[dateKey]) workouts[dateKey] = { ...dayInfo, logs: {} };
  workouts[dateKey].logs[key] = sets;
  // keep only exercises with at least one finished set
  const hasDone = Object.values(workouts[dateKey].logs).some((s) => s.some((x) => x.done));
  if (!hasDone) delete workouts[dateKey];
  saveWorkouts(workouts);
}

// The most recent date BEFORE dateKey where this exercise has finished sets
function lastSession(key, dateKey) {
  const workouts = loadWorkouts();
  const dates = Object.keys(workouts).filter((d) => d < dateKey).sort().reverse();
  for (const d of dates) {
    const done = (workouts[d].logs[key] || []).filter((s) => s.done);
    if (done.length) return { date: d, sets: done };
  }
  return null;
}

// "25×10 · 25×9"
function setsText(sets) {
  return sets.map((s) => `${s.w}×${s.r}`).join(" · ");
}

// ----- The set rows (used in the Today tab and when editing an old workout) -----
// container: where to draw, dateKey: which day, slot: { movement, equip, sets(planned) }
function renderSetPanel(container, dateKey, slot, dayInfo) {
  const key = logKey(slot.movement, slot.equip);
  const last = lastSession(key, dateKey);
  let sets = getSets(dateKey, key);

  // Nothing saved yet for this day → prepare rows, pre-filled from last time
  if (sets.length === 0) {
    const count = Math.max(slot.sets || 3, last ? last.sets.length : 0);
    const planReps = parseInt(slot.reps) || 0; // "8-10" → 8 (used the very first time)
    sets = Array.from({ length: count }, (_, i) => {
      const prev = last ? last.sets[Math.min(i, last.sets.length - 1)] : null;
      return { w: prev ? prev.w : 0, r: prev ? prev.r : planReps, done: false };
    });
  }

  const save = () => setSets(dateKey, key, sets, dayInfo);
  const usesPlates = barWeightFor(slot.equip) !== null; // barbell / EZ bar → show the plate line
  // warm-up box: only for today's big lifts (not when editing an old workout)
  const isToday = dateKey === formatDateInput(todayDate());
  const showWarmup = isToday && needsWarmup(slot.movement, slot.equip);
  const warmupKey = key + "|" + container.closest(".exercise-card")?.dataset.slot;
  const doneCount = sets.filter((s) => s.done).length;

  container.innerHTML = `
    <div class="log-head">
      <span class="muted small">${last
        ? `${t("lastTime")} (${formatDate(parseDate(last.date), { day: "numeric", month: "numeric" })}): <b dir="ltr">${setsText(last.sets)}</b>`
        : t("firstTime")}</span>
      <span class="done-count">${doneCount}/${sets.length}</span>
    </div>
    ${showWarmup ? `<div class="warmup-holder">${warmupHtml(sets[0]?.w, slot, warmupKey)}</div>` : ""}
    <div class="set-rows">
      ${sets.map((s, i) => `
        <div class="set-row${s.done ? " done" : ""}" data-i="${i}">
          <span class="set-num">${i + 1}</span>
          <div class="stepper">
            <button class="step" data-field="w" data-dir="-1" aria-label="-">−</button>
            <input type="number" inputmode="decimal" step="0.5" min="0" max="500" data-field="w" value="${s.w}">
            <button class="step" data-field="w" data-dir="1" aria-label="+">+</button>
            <span class="unit">${t("kg")}</span>
          </div>
          <div class="stepper">
            <button class="step" data-field="r" data-dir="-1" aria-label="-">−</button>
            <input type="number" inputmode="numeric" step="1" min="0" max="100" data-field="r" value="${s.r}">
            <button class="step" data-field="r" data-dir="1" aria-label="+">+</button>
            <span class="unit">${t("repsShort")}</span>
          </div>
          <button class="check-btn" aria-label="done">✓</button>
          ${usesPlates ? `<div class="plate-line">${plateText(s.w, slot.equip)}</div>` : ""}
        </div>`).join("")}
    </div>
    <div class="log-actions">
      <button class="link-btn add-set">+ ${t("addSet")}</button>
      ${sets.length > 1 ? `<button class="link-btn remove-set">− ${t("removeSet")}</button>` : ""}
    </div>
  `;

  // remember open / closed state of the warm-up box
  const watchWarmupToggle = () => {
    const box = container.querySelector(".warmup");
    if (!box) return;
    box.addEventListener("toggle", () => {
      if (box.open) openWarmups.add(warmupKey);
      else openWarmups.delete(warmupKey);
    });
  };
  watchWarmupToggle();

  container.querySelectorAll(".set-row").forEach((row) => {
    const i = Number(row.dataset.i);
    // keep the plate line under this set in sync with its weight
    const updatePlates = () => {
      const line = row.querySelector(".plate-line");
      if (line) line.innerHTML = plateText(sets[i].w, slot.equip);
      // the warm-up is based on the FIRST set's weight
      const holder = container.querySelector(".warmup-holder");
      if (i === 0 && holder) {
        holder.innerHTML = warmupHtml(sets[0].w, slot, warmupKey);
        watchWarmupToggle();
      }
    };

    // − / + buttons: change the number, update the input, save if the set is already done
    row.querySelectorAll(".step").forEach((btn) => {
      btn.addEventListener("click", () => {
        const field = btn.dataset.field;
        const step = field === "w" ? WEIGHT_STEP : 1;
        const value = clampSet(field, sets[i][field] + step * Number(btn.dataset.dir));
        sets[i][field] = Math.round(value * 100) / 100;
        row.querySelector(`input[data-field="${field}"]`).value = sets[i][field];
        updatePlates();
        if (sets[i].done) save();
      });
    });

    // Typing a number directly
    row.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => {
        sets[i][input.dataset.field] = clampSet(input.dataset.field, Number(input.value) || 0);
        updatePlates();
        if (sets[i].done) save();
      });
      // when leaving the box, show the corrected number (e.g. 900 → 500)
      input.addEventListener("change", () => {
        input.value = sets[i][input.dataset.field];
      });
    });

    // ✓ = set finished (click again to undo)
    row.querySelector(".check-btn").addEventListener("click", () => {
      sets[i].done = !sets[i].done;
      save();
      renderSetPanel(container, dateKey, slot, dayInfo);
      // rest timer only for today's workout, and only when a set is ticked (not un-ticked)
      if (sets[i].done && dateKey === formatDateInput(todayDate())) {
        startRestTimer();
        const record = checkNewRecord(key, dateKey, i);
        if (record) showRecordToast(record);
      }
    });
  });

  // Add a set (copies the last row) / remove the last set
  container.querySelector(".add-set").addEventListener("click", () => {
    const lastRow = sets[sets.length - 1] || { w: 0, r: 0 };
    sets.push({ w: lastRow.w, r: lastRow.r, done: false });
    save();
    renderSetPanel(container, dateKey, slot, dayInfo);
  });
  const removeBtn = container.querySelector(".remove-set");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      sets.pop();
      save();
      renderSetPanel(container, dateKey, slot, dayInfo);
    });
  }
}

// ----- Log tab: history of all workouts -----
let editingDate = null; // date of the workout being edited in the Log tab

function renderHistory() {
  const box = document.getElementById("historyList");
  const workouts = loadWorkouts();
  const dates = Object.keys(workouts).sort().reverse();

  if (dates.length === 0) {
    box.innerHTML = `<p class="rest-msg">${t("noWorkouts")}</p>`;
    return;
  }

  box.innerHTML = "";
  dates.forEach((dateKey) => {
    const w = workouts[dateKey];
    const split = SPLITS[w.split];
    const title = split?.days[w.dayIndex]?.title[currentLang] ?? ""; // plan may have been edited / deleted
    const entries = Object.entries(w.logs).filter(([, sets]) => sets.some((s) => s.done));

    const card = document.createElement("div");
    card.className = "history-card";
    card.innerHTML = `
      <div class="history-head">
        <div>
          <b>${title}</b>
          <span class="muted small">${formatDate(parseDate(dateKey), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
        <div class="card-actions">
          <button class="link-btn edit-btn">${editingDate === dateKey ? "✓ " + t("doneEditing") : "✏️ " + t("edit")}</button>
          <button class="link-btn delete-btn">🗑 ${t("delete")}</button>
        </div>
      </div>
      <div class="history-body"></div>
    `;

    const body = card.querySelector(".history-body");
    entries.forEach(([key, sets]) => {
      const [movement, equip] = key.split(".");
      const move = MOVEMENTS[movement];
      const row = document.createElement("div");
      row.className = "history-ex";
      const name = `${move ? move.name[currentLang] : movement} <span class="muted">· ${EQUIPMENT[equip] ? EQUIPMENT[equip][currentLang] : equip}</span>`;
      if (editingDate === dateKey) {
        row.innerHTML = `<div class="history-ex-name">${name}</div><div class="set-panel"></div>`;
        renderSetPanel(row.querySelector(".set-panel"), dateKey, { movement, equip, sets: sets.length },
          { split: w.split, dayIndex: w.dayIndex });
      } else {
        const done = sets.filter((s) => s.done);
        row.innerHTML = `<div class="history-ex-name">${name}</div><div class="muted" dir="ltr">${setsText(done)}</div>`;
      }
      body.appendChild(row);
    });

    card.querySelector(".edit-btn").addEventListener("click", () => {
      editingDate = editingDate === dateKey ? null : dateKey;
      renderHistory();
    });
    confirmClick(card.querySelector(".delete-btn"), () => {
      const all = loadWorkouts();
      delete all[dateKey];
      saveWorkouts(all);
      refreshAll();
    });

    box.appendChild(card);
  });
}
