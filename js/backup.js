// ===== My data: backup (JSON), restore, and CSV export for analysis =====

// Every key the app uses (the list lives in storage.js; backups keep the names without the "gp_" prefix)
const DATA_KEYS = STORE_KEYS;
const BACKUP_APP = "gym-planner";
const BACKUP_VERSION = 1;

// Save text as a file on the user's device
function downloadFile(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setDataMessage(text, isError = false) {
  const el = document.getElementById("dataMessage");
  el.textContent = text;
  el.className = isError ? "form-error" : "data-ok";
}

// ----- 1) JSON backup -----
function buildBackup() {
  const data = {};
  for (const key of DATA_KEYS) {
    const raw = store.get(key);
    if (raw === null) continue;
    // values saved as JSON are stored as objects, plain strings (like "ppl_ul") stay strings
    try { data[key] = JSON.parse(raw); } catch { data[key] = raw; }
  }
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data };
}

document.getElementById("exportJson").addEventListener("click", () => {
  const today = formatDateInput(todayDate());
  downloadFile(`gym-backup-${today}.json`, JSON.stringify(buildBackup(), null, 2), "application/json");
  setDataMessage("✅ " + t("backupDone"));
});

// ----- 2) Restore from a backup file -----
// A backup file can come from anywhere (a friend, a download), so EVERY field is checked before
// anything is saved: right type, realistic range, and ids that really exist in the app.
// Returns an error key, or null when the file is safe to restore.
const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const isNum = (x, min, max) => typeof x === "number" && Number.isFinite(x) && x >= min && x <= max;
const isInt = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;
const isDateKey = (x) => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x);
// names: 1..maxLength characters, and no "<" or ">" (a real plan / day name never needs them)
const isText = (x, maxLength) => typeof x === "string" && x.length > 0 && x.length <= maxLength && !/[<>]/.test(x);
// "__proto__" / "constructor" as a key could change how every object in the app behaves
const safeKeys = (obj) => Object.keys(obj).every((k) => !["__proto__", "constructor", "prototype"].includes(k));
const isMoveEquip = (movement, equip) => Boolean(MOVEMENTS[movement] && MOVEMENTS[movement].variants[equip]);

function checkSets(sets) {
  return Array.isArray(sets) && sets.length <= 30 && sets.every((s) =>
    isObj(s) && isNum(s.w, 0, SET_LIMITS.w) && isInt(s.r, 0, SET_LIMITS.r) && typeof s.done === "boolean");
}

function checkWorkouts(workouts) {
  if (!isObj(workouts) || !safeKeys(workouts)) return false;
  return Object.entries(workouts).every(([date, day]) =>
    isDateKey(date) && isObj(day) && isObj(day.logs) && safeKeys(day.logs) &&
    (day.finished === undefined || typeof day.finished === "boolean") &&
    Object.entries(day.logs).every(([key, sets]) => {
      const [movement, equip] = key.split(".");
      return isMoveEquip(movement, equip) && checkSets(sets);
    }));
}

function checkGoals(goals) {
  return Array.isArray(goals) && goals.length <= 100 && goals.every((g) => {
    if (!isObj(g)) return false;
    if (g.deadline !== undefined && g.deadline !== "" && !isDateKey(g.deadline)) return false;
    if (g.type === "lift") return isMoveEquip(g.movement, g.equip) && isNum(g.target, 0, SET_LIMITS.w) && isNum(g.start, 0, SET_LIMITS.w);
    if (g.type === "bodyweight") return isNum(g.target, LIMITS.bodyWeight.min, LIMITS.bodyWeight.max) && isNum(g.start, LIMITS.bodyWeight.min, LIMITS.bodyWeight.max);
    if (g.type === "frequency") return isInt(g.target, LIMITS.perWeek.min, LIMITS.perWeek.max);
    return false;
  });
}

function checkCustomSplits(splits) {
  if (!isObj(splits) || !safeKeys(splits)) return false;
  return Object.entries(splits).every(([id, plan]) =>
    /^custom_\d+$/.test(id) && isObj(plan) && isObj(plan.name) &&
    isText(plan.name.ar, 40) && isText(plan.name.en, 40) &&
    Array.isArray(plan.days) && plan.days.length === 7 &&
    plan.days.every((day) => isObj(day) && isObj(day.title) && isText(day.title.ar, 20) && isText(day.title.en, 20) &&
      Array.isArray(day.exercises) && day.exercises.length <= 15 &&
      day.exercises.every((ex) => Array.isArray(ex) && isMoveEquip(ex[0], ex[3]) &&
        isInt(ex[1], 1, 10) && typeof ex[2] === "string" && REPS_PATTERN.test(ex[2]))));
}

function checkBackup(backup) {
  if (!isObj(backup) || backup.app !== BACKUP_APP || !isObj(backup.data)) return "restoreNotOurs";
  const d = backup.data;
  const ok = (key, test) => d[key] === undefined || test(d[key]);
  const customIds = isObj(d.customSplits) ? Object.keys(d.customSplits) : [];
  const valid =
    ok("workouts", checkWorkouts) &&
    ok("goals", checkGoals) &&
    ok("customSplits", checkCustomSplits) &&
    ok("skips", (x) => isObj(x) && safeKeys(x) && Object.entries(x).every(([date, day]) =>
      isDateKey(date) && isObj(day) && safeKeys(day) && Object.entries(day).every(([key, reason]) =>
        isMoveEquip(...key.split(".")) && ["", "time", "pain", "busy"].includes(reason)))) &&
    ok("bodyWeights", (x) => isObj(x) && safeKeys(x) && Object.entries(x).every(([k, v]) => isDateKey(k) && isNum(v, LIMITS.bodyWeight.min, LIMITS.bodyWeight.max))) &&
    ok("slotChoices", (x) => isObj(x) && safeKeys(x) && Object.values(x).every((c) => isObj(c) && isMoveEquip(c.movement, c.equip))) &&
    ok("profile", (x) => isObj(x) && isNum(x.age, PROFILE_LIMITS.age.min, PROFILE_LIMITS.age.max) && isNum(x.height, PROFILE_LIMITS.height.min, PROFILE_LIMITS.height.max) && ["male", "female"].includes(x.sex)) &&
    ok("split", (x) => typeof x === "string" && (BUILT_IN_SPLITS.includes(x) || customIds.includes(x))) &&
    ok("lang", (x) => x === "ar" || x === "en") &&
    ok("name", (x) => isText(x, 30)) &&
    ok("avatar", (x) => typeof x === "string" && x.length < 200000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(x)) &&
    ok("startDate", isDateKey) &&
    ok("trackingFrom", isDateKey) &&
    ok("photoNudgeHidden", isDateKey) &&
    ok("restSeconds", (x) => isInt(Number(x), REST_LIMITS.min, REST_LIMITS.max)) &&
    ok("barWeight", (x) => BAR_CHOICES.includes(Number(x)));
  return valid ? null : "restoreBroken";
}

let pendingBackup = null; // backup read from a file, waiting for the user's confirmation

document.getElementById("importFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = ""; // allow choosing the same file again later
  document.getElementById("restoreConfirm").hidden = true;
  pendingBackup = null;
  if (!file) return;

  let backup;
  try {
    backup = JSON.parse(await file.text());
  } catch {
    setDataMessage("⚠️ " + t("restoreNotJson"), true);
    return;
  }
  const error = checkBackup(backup);
  if (error) {
    setDataMessage("⚠️ " + t(error), true);
    return;
  }

  // Show a summary and ask to confirm
  pendingBackup = backup;
  const d = backup.data;
  const summary = t("restoreSummary")
    .replace("{workouts}", Object.keys(d.workouts || {}).length)
    .replace("{goals}", (d.goals || []).length)
    .replace("{weights}", Object.keys(d.bodyWeights || {}).length)
    .replace("{date}", (backup.exportedAt || "").slice(0, 10));
  setDataMessage(summary);
  document.getElementById("restoreConfirm").hidden = false;
});

function applyBackup() {
  if (!pendingBackup) return;
  for (const key of DATA_KEYS) store.remove(key);
  for (const [key, value] of Object.entries(pendingBackup.data)) {
    if (!DATA_KEYS.includes(key)) continue; // ignore anything we don't know
    store.set(key, typeof value === "string" ? value : JSON.stringify(value));
  }
  pendingBackup = null;
  location.reload(); // start fresh with the restored data
}

// ----- 3) CSV export for analysis (pandas / Excel / Power BI) -----
// Wrap a value in quotes if it contains a comma, quote or new line
function csvCell(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(rows) {
  // "﻿" (BOM) tells Excel the file is UTF-8
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

function setsCsv() {
  const rows = [["date", "day", "movement", "exercise", "equipment", "set", "weight_kg", "reps", "volume_kg", "est_1rm_kg"]];
  const workouts = loadWorkouts();
  for (const date of Object.keys(workouts).sort()) {
    const w = workouts[date];
    const split = SPLITS[w.split];
    const dayName = split?.days[w.dayIndex]?.title.en ?? "";
    for (const [key, sets] of Object.entries(w.logs)) {
      const [movement, equip] = key.split(".");
      const name = MOVEMENTS[movement] ? MOVEMENTS[movement].name.en : movement;
      let setNumber = 0;
      for (const s of sets) {
        if (!s.done) continue;
        setNumber += 1;
        rows.push([date, dayName, movement, name, equip, setNumber, s.w, s.r,
          Math.round(s.w * s.r * 100) / 100, estimated1RM(s.w, s.r)]);
      }
    }
  }
  return rows;
}

function bodyWeightCsv() {
  const data = loadBodyWeights();
  return [["date", "weight_kg"], ...Object.keys(data).sort().map((d) => [d, data[d]])];
}

document.getElementById("exportCsv").addEventListener("click", () => {
  const sets = setsCsv();
  if (sets.length === 1) {
    setDataMessage("⚠️ " + t("csvEmpty"), true);
    return;
  }
  downloadFile("gym-sets.csv", toCsv(sets), "text/csv;charset=utf-8");
  const bw = bodyWeightCsv();
  if (bw.length > 1) downloadFile("gym-body-weight.csv", toCsv(bw), "text/csv;charset=utf-8");
  setDataMessage("✅ " + t("csvDone").replace("{n}", sets.length - 1));
});
