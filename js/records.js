// ===== Personal records (PRs) =====
// Three records per exercise (movement.equipment):
//   heaviest  → highest weight lifted (at least 1 rep)
//   e1rm      → best estimated one-rep max (Epley), compares sets with different reps
//   reps      → most reps with the same or a heavier weight (also works for bodyweight, w = 0)
// Like everything else, records are computed from the log — never stored separately.

// Every finished set of one exercise: [{ date, index, w, r }]
function doneSetsOf(key) {
  const out = [];
  for (const [date, day] of Object.entries(loadWorkouts())) {
    (day.logs[key] || []).forEach((s, index) => {
      if (s.done && s.r > 0) out.push({ date, index, w: s.w, r: s.r });
    });
  }
  return out;
}

// Best of each kind among a list of sets
function bestOf(sets) {
  let heaviest = null;
  let e1rm = null;
  for (const s of sets) {
    if (s.w > 0 && (!heaviest || s.w > heaviest.w)) heaviest = s;
    const est = estimated1RM(s.w, s.r);
    if (s.w > 0 && (!e1rm || est > e1rm.value)) e1rm = { ...s, value: est };
  }
  return { heaviest, e1rm };
}

// Most reps done with at least weight w (before this set)
function bestRepsAtLeast(sets, w) {
  return sets.filter((s) => s.w >= w).reduce((m, s) => Math.max(m, s.r), 0);
}

// Called after a set is ticked ✓. Returns a message if it beat a previous record, else null.
function checkNewRecord(key, dateKey, index) {
  const all = doneSetsOf(key);
  const current = all.find((s) => s.date === dateKey && s.index === index);
  if (!current) return null;
  const before = all.filter((s) => s !== current);
  if (before.length === 0) return null; // first time ever → nothing to beat

  const old = bestOf(before);
  if (current.w > 0 && old.heaviest && current.w > old.heaviest.w) {
    return t("prWeight").replace("{new}", current.w).replace("{old}", old.heaviest.w);
  }
  const est = estimated1RM(current.w, current.r);
  if (current.w > 0 && old.e1rm && est > old.e1rm.value) {
    return t("prE1rm").replace("{new}", est).replace("{old}", old.e1rm.value);
  }
  const oldReps = bestRepsAtLeast(before, current.w);
  if (oldReps > 0 && current.r > oldReps) {
    return t("prReps").replace("{new}", current.r).replace("{old}", oldReps).replace("{w}", current.w);
  }
  return null;
}

// Gold banner for 5 seconds
let prTimer = null;
function showRecordToast(message) {
  const toast = document.getElementById("prToast");
  toast.innerHTML = `🏆 <b>${t("prTitle")}</b> ${message}`;
  toast.hidden = false;
  if (navigator.vibrate) navigator.vibrate([80, 60, 80, 60, 200]);
  clearTimeout(prTimer);
  prTimer = setTimeout(() => { toast.hidden = true; }, 5000);
}

// Records list for the technique window
function recordsHtml(key) {
  const sets = doneSetsOf(key);
  if (sets.length === 0) return `<p class="muted small">${t("prNone")}</p>`;
  const { heaviest, e1rm } = bestOf(sets);
  const mostReps = sets.reduce((m, s) => (s.r > m.r || (s.r === m.r && s.w > m.w) ? s : m));
  const when = (d) => formatDate(parseDate(d), { day: "numeric", month: "short" });
  const rows = [];
  // only the numbers are marked left-to-right, so Arabic words keep their natural order
  const n = (x) => `<span dir="ltr">${x}</span>`;
  if (heaviest) rows.push(`🏋️ ${t("prHeaviest")}: <b>${n(heaviest.w)} ${t("kg")} × ${n(heaviest.r)}</b> <span class="muted">· ${when(heaviest.date)}</span>`);
  if (e1rm) rows.push(`💪 ${t("prBestE1rm")}: <b>${n(e1rm.value)} ${t("kg")}</b> <span class="muted">(${n(e1rm.w + " × " + e1rm.r)}) · ${when(e1rm.date)}</span>`);
  rows.push(`🔁 ${t("prMostReps")}: <b>${n(mostReps.r)}</b> <span class="muted">(${n(mostReps.w)} ${t("kg")}) · ${when(mostReps.date)}</span>`);
  return `<ul class="records-list">${rows.map((r) => `<li>${r}</li>`).join("")}</ul>`;
}
