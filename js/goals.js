// ===== Goals =====
// Saved in localStorage:
//   "goals": [ { id, type: "lift" | "bodyweight" | "frequency", target, start, deadline, movement, equip }, ... ]
//   "bodyWeights": { "2026-10-13": 80.5, ... }
// Progress is always computed from the data (log / body weights), never typed by hand.

// Realistic ranges for every number the user can type
const LIMITS = {
  bodyWeight: { min: 30, max: 300 },  // kg, any adult
  liftWeight: { min: 1, max: 500 },   // kg, ~ world record deadlift
  perWeek: { min: 1, max: 7 },        // workouts per week
  maxBodyChange: 50,                  // kg between current and target body weight
};

// "Enter a number between 30 and 300"
function rangeError(limits) {
  return t("errorRange").replace("{min}", limits.min).replace("{max}", limits.max);
}

function loadGoals() {
  return JSON.parse(store.get("goals") || "[]");
}
function saveGoals(goals) {
  store.set("goals", JSON.stringify(goals));
}
function loadBodyWeights() {
  return JSON.parse(store.get("bodyWeights") || "{}");
}
function saveBodyWeights(data) {
  store.set("bodyWeights", JSON.stringify(data));
}

// Heaviest finished set ever for one exercise (0 if never done)
function bestWeight(key) {
  let best = 0;
  for (const day of Object.values(loadWorkouts())) {
    for (const s of day.logs[key] || []) {
      if (s.done && s.w > best) best = s.w;
    }
  }
  return best;
}

// Most recent body weight entry, or null
function latestBodyWeight() {
  const data = loadBodyWeights();
  const dates = Object.keys(data).sort();
  return dates.length ? data[dates[dates.length - 1]] : null;
}

// Number of logged workouts in the last 7 days (today included)
function workoutsLast7Days() {
  const today = todayDate();
  const from = formatDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6));
  return Object.keys(loadWorkouts()).filter((d) => d >= from).length;
}

// Current value of a goal, read from the data
function goalCurrent(goal) {
  if (goal.type === "lift") return bestWeight(logKey(goal.movement, goal.equip));
  if (goal.type === "bodyweight") return latestBodyWeight() ?? goal.start;
  return workoutsLast7Days();
}

// Progress 0..1 measured from the start value (works for losing AND gaining weight)
function goalProgress(goal, current) {
  if (goal.type === "frequency") return Math.min(1, current / goal.target);
  const total = goal.target - goal.start;
  if (total === 0) return 1;
  return Math.max(0, Math.min(1, (current - goal.start) / total));
}

function goalTitle(goal) {
  if (goal.type === "lift") {
    const move = MOVEMENTS[goal.movement];
    return `🏋️ ${move.name[currentLang]} · ${EQUIPMENT[goal.equip][currentLang]} — ${goal.target} ${t("kg")}`;
  }
  if (goal.type === "bodyweight") return `⚖️ ${t("goalBodyweight")} — ${goal.target} ${t("kg")}`;
  return `📅 ${goal.target} ${t("workoutsPerWeek")}`;
}

// ----- Draw the goals list -----
function renderGoals() {
  const list = document.getElementById("goalsList");
  const goals = loadGoals();
  list.innerHTML = goals.length ? "" : `<p class="rest-msg">${t("noGoals")}</p>`;

  goals.forEach((goal) => {
    const current = goalCurrent(goal);
    const progress = goalProgress(goal, current);
    const percent = Math.round(progress * 100);
    const done = progress >= 1;

    // Deadline text: "12 days left" / "deadline passed"
    let deadlineText = "";
    if (goal.deadline) {
      const daysLeft = Math.round((parseDate(goal.deadline) - todayDate()) / DAY_MS);
      deadlineText = daysLeft >= 0 ? `⏳ ${daysLeft} ${t("daysLeft")}` : `⌛ ${t("deadlinePassed")}`;
    }

    const detail = goal.type === "frequency"
      ? `${current} / ${goal.target} ${t("inLast7Days")}`
      : `${t("start")}: ${goal.start} → ${t("now")}: <b>${current}</b> → ${t("target")}: ${goal.target} ${t("kg")}`;

    const card = document.createElement("div");
    card.className = "goal-card" + (done ? " done" : "");
    card.innerHTML = `
      <div class="goal-head">
        <b>${goalTitle(goal)}</b>
        <button class="link-btn delete-goal">🗑</button>
      </div>
      <div class="progress"><div class="progress-fill" style="width:${percent}%"></div></div>
      <div class="goal-meta">
        <span class="muted small">${detail}</span>
        <span class="goal-percent">${done ? "🎉 " + t("goalDone") : percent + "%"}</span>
      </div>
      ${deadlineText ? `<span class="muted small">${deadlineText}</span>` : ""}
    `;
    confirmClick(card.querySelector(".delete-goal"), () => {
      saveGoals(loadGoals().filter((g) => g.id !== goal.id));
      renderGoals();
    });
    list.appendChild(card);
  });

  renderBodyWeightBox();
  renderProfile(); // advice depends on the latest body weight and goals
}

// ----- Body weight entry -----
function renderBodyWeightBox() {
  const data = loadBodyWeights();
  const dates = Object.keys(data).sort().reverse().slice(0, 5);
  document.getElementById("bodyWeightHistory").innerHTML = dates.length
    ? dates.map((d) => `<span class="muscle-chip secondary" dir="ltr">${formatDate(parseDate(d), { day: "numeric", month: "numeric" })}: ${data[d]} ${t("kg")}</span>`).join("")
    : `<span class="muted small">${t("noBodyWeight")}</span>`;
  const todayValue = data[formatDateInput(todayDate())];
  const input = document.getElementById("bodyWeightInput");
  if (document.activeElement !== input) input.value = todayValue ?? latestBodyWeight() ?? "";
}

document.getElementById("saveBodyWeight").addEventListener("click", () => {
  const value = Number(document.getElementById("bodyWeightInput").value);
  const errorEl = document.getElementById("bwError");
  if (!value || value < LIMITS.bodyWeight.min || value > LIMITS.bodyWeight.max) {
    errorEl.textContent = "⚠️ " + rangeError(LIMITS.bodyWeight);
    return;
  }
  errorEl.textContent = "";
  const data = loadBodyWeights();
  data[formatDateInput(todayDate())] = Math.round(value * 10) / 10;
  saveBodyWeights(data);
  renderGoals();
});

// ----- New goal form -----
// Fill the exercise and equipment drop-downs
function fillGoalExerciseOptions() {
  const moveSelect = document.getElementById("goalMovement");
  const chosen = moveSelect.value;
  moveSelect.innerHTML = Object.keys(MOVEMENTS)
    .sort((a, b) => MOVEMENTS[a].name[currentLang].localeCompare(MOVEMENTS[b].name[currentLang], currentLang))
    .map((k) => `<option value="${k}">${MOVEMENTS[k].name[currentLang]}</option>`).join("");
  if (chosen) moveSelect.value = chosen;
  fillGoalEquipOptions();
}
function fillGoalEquipOptions() {
  const move = MOVEMENTS[document.getElementById("goalMovement").value];
  document.getElementById("goalEquip").innerHTML = Object.keys(move.variants)
    .map((eq) => `<option value="${eq}">${EQUIPMENT[eq][currentLang]}</option>`).join("");
  updateGoalHint();
}

// Show only the fields that the chosen goal type needs, and a hint with the current value
function updateGoalForm() {
  const type = document.getElementById("goalType").value;
  document.querySelectorAll("[data-goal-field]").forEach((el) => {
    el.hidden = !el.dataset.goalField.split(" ").includes(type);
  });
  updateGoalHint();
}
function updateGoalHint() {
  const type = document.getElementById("goalType").value;
  let hint = "";
  if (type === "lift") {
    const key = logKey(document.getElementById("goalMovement").value, document.getElementById("goalEquip").value);
    const best = bestWeight(key);
    hint = best ? `${t("yourBest")}: ${best} ${t("kg")}` : t("noLiftYet");
  } else if (type === "bodyweight") {
    // pre-fill "current weight" with the last saved weight (if any)
    const input = document.getElementById("goalCurrentWeight");
    if (!input.value && latestBodyWeight() !== null) input.value = latestBodyWeight();
    hint = "";
  } else {
    hint = `${t("inLast7Days")}: ${workoutsLast7Days()}`;
  }
  const hintEl = document.getElementById("goalHint");
  hintEl.textContent = hint;
  hintEl.classList.remove("error");
}

// Show a problem inside the form (instead of a pop-up alert)
function showGoalError(message) {
  const hintEl = document.getElementById("goalHint");
  hintEl.textContent = "⚠️ " + message;
  hintEl.classList.add("error");
}

document.getElementById("goalType").addEventListener("change", updateGoalForm);
document.getElementById("goalMovement").addEventListener("change", fillGoalEquipOptions);
document.getElementById("goalEquip").addEventListener("change", updateGoalHint);

// Checks a goal before saving it. Returns an error message, or null if everything is OK.
function validateGoal(type, target, current, best, deadline) {
  const limits = LIMITS[type === "lift" ? "liftWeight" : type === "bodyweight" ? "bodyWeight" : "perWeek"];
  if (!target) return t("errorTarget");
  if (target < limits.min || target > limits.max) return rangeError(limits);

  if (type === "lift" && best > 0 && target <= best) {
    return t("errorLiftBelowBest").replace("{best}", best);
  }
  if (type === "bodyweight") {
    if (!current) return t("errorCurrentWeight");
    if (current < LIMITS.bodyWeight.min || current > LIMITS.bodyWeight.max) return rangeError(LIMITS.bodyWeight);
    if (target === current) return t("errorSameWeight");
    if (Math.abs(target - current) > LIMITS.maxBodyChange) {
      return t("errorTooBigChange").replace("{max}", LIMITS.maxBodyChange);
    }
  }
  if (deadline && parseDate(deadline) <= todayDate()) return t("errorDeadline");
  return null;
}

document.getElementById("goalForm").addEventListener("submit", (e) => {
  e.preventDefault(); // stay on the page (a form normally reloads it)
  const type = document.getElementById("goalType").value;
  const target = Number(document.getElementById("goalTarget").value);
  const current = Number(document.getElementById("goalCurrentWeight").value);
  const deadline = document.getElementById("goalDeadline").value || null;
  const movement = document.getElementById("goalMovement").value;
  const equip = document.getElementById("goalEquip").value;
  const best = type === "lift" ? bestWeight(logKey(movement, equip)) : 0;

  const error = validateGoal(type, target, current, best, deadline);
  if (error) {
    showGoalError(error);
    return;
  }

  const goal = { id: Date.now(), type, target, deadline };
  if (type === "lift") {
    goal.movement = movement;
    goal.equip = equip;
    goal.start = best;
  } else if (type === "bodyweight") {
    // the current weight is also saved as today's body weight entry
    const data = loadBodyWeights();
    data[formatDateInput(todayDate())] = Math.round(current * 10) / 10;
    saveBodyWeights(data);
    goal.start = data[formatDateInput(todayDate())];
  } else {
    goal.start = 0;
  }

  saveGoals([...loadGoals(), goal]);
  e.target.reset();
  document.getElementById("newGoalBox").open = false;
  updateGoalForm();
  renderGoals();
});
