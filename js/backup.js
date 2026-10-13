// ===== My data: backup (JSON), restore, and CSV export for analysis =====

// Every localStorage key the app uses
const DATA_KEYS = ["workouts", "slotChoices", "goals", "bodyWeights", "profile", "split", "startDate", "lang", "trackingFrom"];
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
    const raw = localStorage.getItem(key);
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
// Checks the file really is our backup and the data has the right shape. Returns an error key or null.
function checkBackup(backup) {
  const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
  if (!isObj(backup) || backup.app !== BACKUP_APP || !isObj(backup.data)) return "restoreNotOurs";
  const d = backup.data;
  if (d.workouts !== undefined) {
    if (!isObj(d.workouts)) return "restoreBroken";
    for (const [date, day] of Object.entries(d.workouts)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isObj(day) || !isObj(day.logs)) return "restoreBroken";
    }
  }
  if (d.goals !== undefined && !Array.isArray(d.goals)) return "restoreBroken";
  if (d.bodyWeights !== undefined && !isObj(d.bodyWeights)) return "restoreBroken";
  return null;
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
  for (const key of DATA_KEYS) localStorage.removeItem(key);
  for (const [key, value] of Object.entries(pendingBackup.data)) {
    if (!DATA_KEYS.includes(key)) continue; // ignore anything we don't know
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
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
    const dayName = split ? split.days[w.dayIndex].title.en : "";
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
