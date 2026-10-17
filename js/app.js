// ===== Saved state =====
// Which split the user chose (remembered in the browser), and which day is open in the Plan tab
let currentSplit = store.get("split") || DEFAULT_SPLIT;
if (!SPLITS[currentSplit]) currentSplit = DEFAULT_SPLIT; // e.g. a custom plan that was deleted
let selectedDay = 0;

// ===== Tab navigation =====
function showTab(tabName) {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabName);
  });
}

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    showTab(btn.dataset.tab);
    // Sets finished in Today should appear in the Log (and vice versa) when switching tabs
    if (btn.dataset.tab === "log") renderHistory();
    if (btn.dataset.tab === "today") renderToday();
    if (btn.dataset.tab === "goals") renderGoals();
    if (btn.dataset.tab === "progress") renderProgress(); // charts need a visible tab to get their size
  });
});

// ===== Plan tab =====

// 1) Cards to choose a split
function renderSplitChoices() {
  const box = document.getElementById("splitChoices");
  box.innerHTML = "";
  for (const key in SPLITS) {
    const split = SPLITS[key];
    const trainingDays = split.days.filter((d) => d.exercises.length > 0).length;
    const card = document.createElement("button");
    card.className = "split-card" + (key === currentSplit ? " active" : "");
    card.innerHTML = `
      <strong>${esc(split.name[currentLang])}</strong>
      <span class="muted">${trainingDays} ${t("trainingDays")}</span>
      ${isCustomSplit(key) ? `<span class="muted small">✏️ ${t("customBadge")}</span>` : ""}
      ${key === currentSplit ? `<span class="badge">${t("selected")}</span>` : ""}
    `;
    card.addEventListener("click", () => {
      currentSplit = key;
      store.set("split", key);
      selectedDay = 0;
      editMode = false;
      refreshAll();
    });
    box.appendChild(card);
  }
}

// 2) The 7 days of the cycle as small boxes
function renderDayStrip() {
  const strip = document.getElementById("dayStrip");
  strip.innerHTML = "";
  SPLITS[currentSplit].days.forEach((day, i) => {
    const isRest = day.exercises.length === 0;
    const box = document.createElement("button");
    box.className = "day-box" + (isRest ? " rest" : "") + (i === selectedDay ? " active" : "");
    box.innerHTML = `<small>${t("day")} ${i + 1}</small><b>${esc(day.title[currentLang])}</b>`;
    box.addEventListener("click", () => {
      selectedDay = i;
      renderPlan();
    });
    strip.appendChild(box);
  });
}

// ===== Slot choices (equipment / swapped movement) =====
// Saved as { "ppl_ul|0|2": { movement: "chest_fly", equip: "cable" }, ... }
// key = split | day number | position of the exercise in that day
let slotChoices = store.getJSON("slotChoices", {});
let openSwapKey = null; // which card has its "alternatives" list open

function slotKey(dayIndex, slotIndex) {
  return `${currentSplit}|${dayIndex}|${slotIndex}`;
}

// What the user will actually do in this slot: their saved choice, or the plan's default
function resolveSlot(dayIndex, slotIndex) {
  const [movement, sets, reps, equip] = SPLITS[currentSplit].days[dayIndex].exercises[slotIndex];
  const saved = slotChoices[slotKey(dayIndex, slotIndex)];
  return {
    original: movement,
    movement: saved ? saved.movement : movement,
    equip: saved ? saved.equip : equip,
    changed: Boolean(saved),
    sets,
    reps,
  };
}

function saveSlot(dayIndex, slotIndex, movement, equip) {
  slotChoices[slotKey(dayIndex, slotIndex)] = { movement, equip };
  store.set("slotChoices", JSON.stringify(slotChoices));
}

function resetSlot(dayIndex, slotIndex) {
  delete slotChoices[slotKey(dayIndex, slotIndex)];
  store.set("slotChoices", JSON.stringify(slotChoices));
}

// Main muscle of a movement = primary muscle of its first variant
function mainMuscle(movementKey) {
  const firstVariant = Object.values(MOVEMENTS[movementKey].variants)[0];
  return firstVariant.primary[0];
}

// Other movements that train the same main muscle
function alternativesFor(movementKey) {
  const muscle = mainMuscle(movementKey);
  return Object.keys(MOVEMENTS).filter((k) => k !== movementKey && mainMuscle(k) === muscle);
}

// Draws the exercise cards of one day inside a container.
// Used by both the Plan tab (the day you clicked) and the Today tab (today's day).
// withLog = true adds the set rows (weight / reps / ✓) under each card — only in the Today tab.
function renderExerciseList(list, dayIndex, withLog = false) {
  const day = SPLITS[currentSplit].days[dayIndex];
  list.innerHTML = "";

  if (day.exercises.length === 0) {
    list.innerHTML = `<p class="rest-msg">${t("restDay")}</p>`;
    return;
  }

  day.exercises.forEach((_, slotIndex) => {
    const slot = resolveSlot(dayIndex, slotIndex);
    const move = MOVEMENTS[slot.movement];
    const variant = move.variants[slot.equip];
    const key = list.id + "|" + slotKey(dayIndex, slotIndex); // unique per tab

    // Equipment buttons (only if the movement has more than one variant)
    const equipKeys = Object.keys(move.variants);
    const equipButtons = equipKeys.length > 1
      ? `<div class="chips">${equipKeys.map((eq) => `
          <button class="chip${eq === slot.equip ? " active" : ""}" data-equip="${eq}">${EQUIPMENT[eq][currentLang]}</button>
        `).join("")}</div>`
      : "";

    // Alternatives list (shown only when this card's swap button is open)
    const alternatives = alternativesFor(slot.original).concat(slot.movement !== slot.original ? [slot.original] : [])
      .filter((k) => k !== slot.movement);
    const swapList = openSwapKey === key
      ? `<div class="swap-list">${alternatives.map((k) => `
          <button class="swap-option" data-move="${k}">
            <img src="${exerciseImage(Object.values(MOVEMENTS[k].variants)[0].id, 0)}" alt="" loading="lazy">
            ${MOVEMENTS[k].name[currentLang]}
          </button>`).join("") || `<p class="muted">${t("noAlternatives")}</p>`}
        </div>`
      : "";

    const card = document.createElement("div");
    card.className = "exercise-card";
    card.dataset.slot = slotIndex; // lets the set panel tell two slots of the same exercise apart
    card.innerHTML = `
      <div class="exercise-main">
        <img src="${exerciseImage(variant.id, 0)}" alt="${move.name.en}" loading="lazy">
        <div class="exercise-info">
          <h4>${move.name[currentLang]} <span class="muted equip-name">· ${EQUIPMENT[slot.equip][currentLang]}</span></h4>
          <span class="muscle-tag">${MUSCLES[variant.primary[0]][currentLang]}</span>
          <p class="muted">${slot.sets} ${t("sets")} × ${slot.reps} ${t("reps")}</p>
        </div>
      </div>
      ${equipButtons}
      <div class="card-actions">
        <button class="link-btn detail-btn">ℹ️ ${t("technique")}</button>
        <button class="link-btn swap-btn">🔄 ${t("swap")}</button>
        ${slot.changed ? `<button class="link-btn reset-btn">↺ ${t("resetSlot")}</button>` : ""}
      </div>
      ${swapList}
      ${withLog ? `<div class="set-panel"></div>` : ""}
    `;

    // Workout finished and nothing logged for this exercise → show only its title (tap to open)
    if (withLog && isTodayFinished() && !getSets(formatDateInput(todayDate()), logKey(slot.movement, slot.equip)).some((x) => x.done)) {
      card.classList.add("collapsed");
      card.insertAdjacentHTML("beforeend", `<button class="link-btn expand-btn">${t("notLogged")}</button>`);
      card.querySelector(".expand-btn").addEventListener("click", () => card.classList.remove("collapsed"));
    }

    if (withLog) {
      renderSetPanel(card.querySelector(".set-panel"), formatDateInput(todayDate()),
        { movement: slot.movement, equip: slot.equip, sets: slot.sets, reps: slot.reps },
        { split: currentSplit, dayIndex });
    }

    // Image, title or "technique" button → open the details window
    card.querySelectorAll(".exercise-main img, .exercise-main h4, .detail-btn").forEach((el) => {
      el.addEventListener("click", () => openExercise(slot.movement, slot.equip));
    });
    // Click on an equipment chip → keep the movement, change the equipment
    card.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        saveSlot(dayIndex, slotIndex, slot.movement, chip.dataset.equip);
        refreshAll();
      });
    });
    // Open / close the alternatives list
    card.querySelector(".swap-btn").addEventListener("click", () => {
      openSwapKey = openSwapKey === key ? null : key;
      refreshAll();
    });
    // Pick an alternative → new movement with its first equipment
    card.querySelectorAll(".swap-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        const newMove = opt.dataset.move;
        saveSlot(dayIndex, slotIndex, newMove, Object.keys(MOVEMENTS[newMove].variants)[0]);
        openSwapKey = null;
        refreshAll();
      });
    });
    // Back to the plan's original exercise
    const resetBtn = card.querySelector(".reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        resetSlot(dayIndex, slotIndex);
        refreshAll();
      });
    }

    list.appendChild(card);
  });
}

function renderPlan() {
  renderSplitChoices();
  renderDayStrip();
  const editBtn = document.getElementById("editPlanBtn");
  editBtn.textContent = editMode ? "✓ " + t("doneEditingPlan") : "✏️ " + t("editPlan");
  editBtn.classList.toggle("active", editMode);
  if (editMode) renderEditor(document.getElementById("dayExercises"), selectedDay);
  else renderExerciseList(document.getElementById("dayExercises"), selectedDay);
}

// ===== Today tab =====
// The cycle is counted from a start date: day number = (days since start) mod 7
const DAY_MS = 24 * 60 * 60 * 1000;

// Today at midnight (local time), so the hour of the day doesn't matter
function todayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// "2026-10-13" ↔ Date. (We build the Date by hand: new Date("2026-10-13") would read it as UTC.)
function parseDate(text) {
  const [y, m, d] = text.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function formatDateInput(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Start date saved in the browser; first time = today (so today is Day 1)
let startDate = store.get("startDate") || formatDateInput(todayDate());
// First day the calendar counts from. Saved once; postponing later doesn't move it.
if (!store.get("trackingFrom")) store.set("trackingFrom", startDate);

// Which day of the cycle a given date falls on (0 = Day 1)
function cycleDayFor(date) {
  const cycleLength = SPLITS[currentSplit].days.length;
  const daysPassed = Math.round((date - parseDate(startDate)) / DAY_MS);
  // "% " can give a negative number for dates before the start, so we fix it into 0..length-1
  return ((daysPassed % cycleLength) + cycleLength) % cycleLength;
}

// Dates shown in the current language, always with the Gregorian calendar and 0-9 digits
function formatDate(date, options) {
  const locale = currentLang === "ar" ? "ar-u-ca-gregory-nu-latn" : "en-GB";
  return new Intl.DateTimeFormat(locale, options).format(date);
}

function renderToday() {
  const today = todayDate();
  const dayIndex = cycleDayFor(today);
  const day = SPLITS[currentSplit].days[dayIndex];

  document.getElementById("todayDate").textContent =
    formatDate(today, { weekday: "long", day: "numeric", month: "long" });
  document.getElementById("todayTitle").textContent = day.title[currentLang];
  document.getElementById("todayCycleInfo").textContent =
    `${t("day")} ${dayIndex + 1} / ${SPLITS[currentSplit].days.length} · ${SPLITS[currentSplit].name[currentLang]}`;
  document.getElementById("startDateInput").value = startDate;

  // Next 7 days
  const week = document.getElementById("weekAhead");
  week.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const d = SPLITS[currentSplit].days[cycleDayFor(date)];
    const box = document.createElement("div");
    box.className = "day-box" + (d.exercises.length === 0 ? " rest" : "") + (i === 0 ? " active" : "");
    box.innerHTML = `<small>${i === 0 ? t("todayWord") : formatDate(date, { weekday: "short" })}</small>
                     <b>${esc(d.title[currentLang])}</b>
                     <small>${formatDate(date, { day: "numeric", month: "numeric" })}</small>`;
    week.appendChild(box);
  }

  renderExerciseList(document.getElementById("todayExercises"), dayIndex, true);
  renderFinishBox();

  renderMonthSummary();
  document.getElementById("restSecondsInput").value = restSeconds();
  document.getElementById("barWeightInput").value = barWeightFor("barbell");
}

function setStartDate(text) {
  startDate = text;
  store.set("startDate", text);
  renderToday();
}

// Pick a start date from the calendar input
document.getElementById("startDateInput").addEventListener("change", (e) => {
  if (e.target.value) setStartDate(e.target.value);
});
// Missed a day → move the start one day later, so today repeats the workout you missed
document.getElementById("postponeBtn").addEventListener("click", () => {
  const d = parseDate(startDate);
  setStartDate(formatDateInput(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)));
});
// Make today any day of the cycle (e.g. "today I want to start from Day 1")
document.getElementById("startTodayBtn").addEventListener("click", () => {
  setStartDate(formatDateInput(todayDate()));
});

// Re-draw everything that depends on the plan / choices / language
function refreshAll() {
  renderPlan();
  renderToday();
  renderHistory();
  fillGoalExerciseOptions(); // drop-down names follow the language
  updateGoalForm();
  renderGoals();
  if (document.getElementById("progress").classList.contains("active")) renderProgress();
}

// ===== Exercise details window =====
let frameTimer = null; // timer that swaps the 2 images to make the animation

function openExercise(movementKey, equip) {
  const move = MOVEMENTS[movementKey];
  const variant = move.variants[equip];
  const videoId = findVideo(movementKey, equip);

  // Video: embedded player if we picked one, otherwise a YouTube search button
  const searchUrl = "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(variant.id.replace(/_/g, " ") + " proper form");
  const videoHtml = videoId
    ? `<div class="video-box">
         <iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="${move.name.en}"
           loading="lazy" allowfullscreen
           allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"></iframe>
       </div>
       <p class="muted small">${t("videoNote")}</p>`
    : `<p class="muted small">${t("noVideoYet")}</p>
       <a class="yt-btn" href="${searchUrl}" target="_blank" rel="noopener">▶ ${t("searchYoutube")}</a>`;

  const muscleChip = (m, cls) => `<span class="muscle-chip ${cls}">${MUSCLES[m][currentLang]}</span>`;

  document.getElementById("dialogContent").innerHTML = `
    <h2>${move.name[currentLang]} <span class="muted equip-name">· ${EQUIPMENT[equip][currentLang]}</span></h2>
    <div class="detail-grid">
      <img id="animFrame" class="anim-frame" src="${exerciseImage(variant.id, 0)}" alt="${move.name.en}">
      <div>
        ${bodyMapSVG(variant.primary, variant.secondary)}
        <div class="legend">
          ${variant.primary.map((m) => muscleChip(m, "primary")).join("")}
          ${variant.secondary.map((m) => muscleChip(m, "secondary")).join("")}
        </div>
      </div>
    </div>
    <h3>${t("tipsTitle")}</h3>
    <ol class="tips">${move.tips[currentLang].map((tip) => `<li>${tip}</li>`).join("")}</ol>
    <h3>🏆 ${t("prListTitle")}</h3>
    ${recordsHtml(movementKey + "." + equip)}
    <h3>${t("videoTitle")}</h3>
    ${videoHtml}
  `;

  // Animation: switch between frame 0 and frame 1 every 0.8 seconds
  new Image().src = exerciseImage(variant.id, 1); // preload the second frame
  let frame = 0;
  clearInterval(frameTimer);
  frameTimer = setInterval(() => {
    frame = 1 - frame;
    const img = document.getElementById("animFrame");
    if (img) img.src = exerciseImage(variant.id, frame);
  }, 800);

  document.getElementById("exerciseDialog").showModal();
}

const dialog = document.getElementById("exerciseDialog");
document.getElementById("closeDialog").addEventListener("click", () => dialog.close());
// Click on the dark area outside the window closes it
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) dialog.close();
});
// When the window closes (✕, outside click or Esc): stop the animation and the video
// (the "close" event arrives a moment later, so skip it if another exercise was opened meanwhile)
dialog.addEventListener("close", () => {
  if (dialog.open) return;
  clearInterval(frameTimer);
  document.getElementById("dialogContent").innerHTML = "";
});

// ===== Language toggle =====
document.getElementById("langToggle").addEventListener("click", () => {
  toggleLanguage();
  heatScrollPos = null; // direction flips, so start the map on the newest weeks again
  refreshAll(); // re-draw the parts built by JavaScript in the new language
});

// Restore needs a second tap to confirm (it replaces everything)
confirmClick(document.getElementById("restoreConfirm"), applyBackup);

document.getElementById("editPlanBtn").addEventListener("click", () => {
  if (editMode) stopEditing();
  else startEditing();
});

// ===== Start =====
applyLanguage();
refreshAll();
