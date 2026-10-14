// ===== Plan editor (✏️ edit your plan) =====
// Built-in plans (data/splits.js) are never changed. The first time you edit one, a copy is made
// ("My plan (edited)") with your current equipment / swap choices baked in, and you edit the copy.
// Custom plans are saved in localStorage "customSplits" and merged into SPLITS when the page loads.
// The cycle always stays 7 days; any day can be a training day or a rest day.

const BUILT_IN_SPLITS = Object.keys(SPLITS);
let editMode = false;

function loadCustomSplits() {
  return JSON.parse(localStorage.getItem("customSplits") || "{}");
}
function saveCustomSplits() {
  const custom = {};
  for (const id of Object.keys(SPLITS)) if (!BUILT_IN_SPLITS.includes(id)) custom[id] = SPLITS[id];
  localStorage.setItem("customSplits", JSON.stringify(custom));
}
// Merge saved custom plans in (runs once, before app.js reads SPLITS)
Object.assign(SPLITS, loadCustomSplits());

function isCustomSplit(id) {
  return !BUILT_IN_SPLITS.includes(id);
}

// Copy a built-in plan, keeping what the user actually does (their saved swaps / equipment)
function copyToCustom(fromId) {
  const from = SPLITS[fromId];
  const id = "custom_" + Date.now();
  SPLITS[id] = {
    name: { ar: t("myPlanEdited"), en: t("myPlanEdited") },
    basedOn: fromId,
    days: from.days.map((day, dayIndex) => ({
      title: { ...day.title },
      exercises: day.exercises.map((_, slotIndex) => {
        const s = resolveSlot(dayIndex, slotIndex); // reads currentSplit === fromId
        return [s.movement, s.sets, s.reps, s.equip];
      }),
    })),
  };
  return id;
}

// Choices saved for a custom plan (swaps made in Today) are baked into the plan, then cleared,
// so the editor shows exactly what you do — and moving/removing rows can't mix them up.
function bakeChoices(id) {
  SPLITS[id].days.forEach((day, dayIndex) => {
    day.exercises = day.exercises.map((_, slotIndex) => {
      const s = resolveSlot(dayIndex, slotIndex);
      return [s.movement, s.sets, s.reps, s.equip];
    });
  });
  for (const key of Object.keys(slotChoices)) if (key.startsWith(id + "|")) delete slotChoices[key];
  localStorage.setItem("slotChoices", JSON.stringify(slotChoices));
}

function startEditing() {
  if (!isCustomSplit(currentSplit)) {
    currentSplit = copyToCustom(currentSplit);
    localStorage.setItem("split", currentSplit);
  }
  bakeChoices(currentSplit);
  saveCustomSplits();
  editMode = true;
  refreshAll();
}

function stopEditing() {
  editMode = false;
  refreshAll();
}

function deleteCustomPlan() {
  const plan = SPLITS[currentSplit];
  const back = plan.basedOn && SPLITS[plan.basedOn] ? plan.basedOn : DEFAULT_SPLIT;
  delete SPLITS[currentSplit];
  saveCustomSplits();
  currentSplit = back;
  localStorage.setItem("split", back);
  editMode = false;
  selectedDay = 0;
  refreshAll();
}

// Every change goes through here: save + redraw
function planChanged() {
  saveCustomSplits();
  refreshAll();
}

// Reps text: "8", "8-10" or "30-60s"
const REPS_PATTERN = /^\d{1,3}(-\d{1,3})?s?$/;

// Movements grouped by main muscle, for the "add exercise" picker
function movementOptions(muscleFilter) {
  return Object.keys(MOVEMENTS)
    .filter((k) => !muscleFilter || mainMuscle(k) === muscleFilter)
    .sort((a, b) => MOVEMENTS[a].name[currentLang].localeCompare(MOVEMENTS[b].name[currentLang], currentLang))
    .map((k) => `<option value="${k}">${MOVEMENTS[k].name[currentLang]}</option>`).join("");
}

let addMuscleFilter = "";

function renderEditor(list, dayIndex) {
  const plan = SPLITS[currentSplit];
  const day = plan.days[dayIndex];
  const isRest = day.exercises.length === 0;

  const rows = day.exercises.map(([movement, sets, reps, equip], i) => {
    const move = MOVEMENTS[movement];
    const equipOptions = Object.keys(move.variants)
      .map((eq) => `<option value="${eq}" ${eq === equip ? "selected" : ""}>${EQUIPMENT[eq][currentLang]}</option>`).join("");
    return `
      <div class="edit-row" data-i="${i}">
        <div class="edit-name">
          <img src="${exerciseImage(move.variants[equip].id, 0)}" alt="" loading="lazy">
          <b>${move.name[currentLang]}</b>
        </div>
        <div class="edit-fields">
          <select class="edit-equip" aria-label="${t("equipment")}">${equipOptions}</select>
          <label class="edit-num">${t("sets")} <input type="number" class="edit-sets" min="1" max="10" value="${sets}"></label>
          <label class="edit-num">${t("reps")} <input type="text" class="edit-reps" value="${reps}" dir="ltr"></label>
          <div class="edit-actions">
            <button class="step edit-up" aria-label="${t("moveUp")}" ${i === 0 ? "disabled" : ""}>↑</button>
            <button class="step edit-down" aria-label="${t("moveDown")}" ${i === day.exercises.length - 1 ? "disabled" : ""}>↓</button>
            <button class="step edit-remove" aria-label="${t("delete")}">🗑</button>
          </div>
        </div>
      </div>`;
  }).join("");

  const muscleOptions = `<option value="">${t("allMuscles")}</option>` + Object.keys(MUSCLES)
    .filter((m) => Object.keys(MOVEMENTS).some((k) => mainMuscle(k) === m))
    .map((m) => `<option value="${m}" ${m === addMuscleFilter ? "selected" : ""}>${MUSCLES[m][currentLang]}</option>`).join("");

  list.innerHTML = `
    <div class="editor">
      <label class="field">
        <span>${t("planNameLabel")}</span>
        <input type="text" id="editPlanName" maxlength="40" value="${plan.name[currentLang]}">
      </label>
      <label class="field">
        <span>${t("dayNameLabel")} ${dayIndex + 1}</span>
        <input type="text" id="editDayName" maxlength="20" value="${day.title[currentLang]}">
      </label>
      ${isRest ? `<p class="rest-msg">${t("restDay")}</p>` : `<div class="edit-list">${rows}</div>`}
      <div class="add-box">
        <b>+ ${t("addExercise")}</b>
        <div class="add-fields">
          <select id="addMuscle">${muscleOptions}</select>
          <select id="addMovement">${movementOptions(addMuscleFilter)}</select>
          <button class="primary-btn" id="addBtn">${t("add")}</button>
        </div>
      </div>
      <div class="settings-actions">
        ${isRest ? "" : `<button class="secondary-btn" id="makeRest">😴 ${t("makeRestDay")}</button>`}
        <button class="link-btn" id="deletePlan">🗑 ${t("deletePlan")}</button>
      </div>
      <p id="editError" class="form-error"></p>
    </div>`;

  const showError = (msg) => { document.getElementById("editError").textContent = "⚠️ " + msg; };

  // plan & day names (same text used for both languages)
  document.getElementById("editPlanName").addEventListener("change", (e) => {
    const v = e.target.value.trim();
    if (!v) return showError(t("errorEmptyName"));
    plan.name = { ar: v, en: v };
    planChanged();
  });
  document.getElementById("editDayName").addEventListener("change", (e) => {
    const v = e.target.value.trim();
    if (!v) return showError(t("errorEmptyName"));
    day.title = { ar: v, en: v };
    planChanged();
  });

  // each exercise row
  list.querySelectorAll(".edit-row").forEach((row) => {
    const i = Number(row.dataset.i);
    const ex = day.exercises[i];
    row.querySelector(".edit-equip").addEventListener("change", (e) => { ex[3] = e.target.value; planChanged(); });
    row.querySelector(".edit-sets").addEventListener("change", (e) => {
      const v = Math.round(Number(e.target.value));
      if (v >= 1 && v <= 10) { ex[1] = v; planChanged(); } else { showError(t("errorSets")); e.target.value = ex[1]; }
    });
    row.querySelector(".edit-reps").addEventListener("change", (e) => {
      const v = e.target.value.trim().replace(/\s/g, "").replace("–", "-");
      if (REPS_PATTERN.test(v)) { ex[2] = v; planChanged(); } else { showError(t("errorReps")); e.target.value = ex[2]; }
    });
    row.querySelector(".edit-up").addEventListener("click", () => {
      [day.exercises[i - 1], day.exercises[i]] = [day.exercises[i], day.exercises[i - 1]];
      planChanged();
    });
    row.querySelector(".edit-down").addEventListener("click", () => {
      [day.exercises[i + 1], day.exercises[i]] = [day.exercises[i], day.exercises[i + 1]];
      planChanged();
    });
    confirmClick(row.querySelector(".edit-remove"), () => {
      day.exercises.splice(i, 1);
      planChanged();
    });
  });

  // add an exercise (adding to a rest day turns it into a training day)
  document.getElementById("addMuscle").addEventListener("change", (e) => {
    addMuscleFilter = e.target.value;
    document.getElementById("addMovement").innerHTML = movementOptions(addMuscleFilter);
  });
  document.getElementById("addBtn").addEventListener("click", () => {
    const movement = document.getElementById("addMovement").value;
    if (!movement) return;
    day.exercises.push([movement, 3, "8-12", Object.keys(MOVEMENTS[movement].variants)[0]]);
    planChanged();
  });

  const restBtn = document.getElementById("makeRest");
  if (restBtn) confirmClick(restBtn, () => {
    day.exercises = [];
    day.title = { ar: "راحة", en: "Rest" }; // same name the built-in plans use for rest days
    planChanged();
  });
  confirmClick(document.getElementById("deletePlan"), deleteCustomPlan);
}
