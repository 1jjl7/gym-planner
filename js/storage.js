// ===== Storage with a prefix =====
// Every key this app saves gets the prefix "gp_" (gp = gym planner), e.g. "workouts" → "gp_workouts".
// Why: sites on the same domain share ONE localStorage. A prefix keeps our data from clashing with
// another app on the same domain that also uses a key like "lang".
// Loaded first, before every other script.

const STORE_PREFIX = "gp_";

// Escape text before putting it inside innerHTML / an HTML attribute.
// Anything the user typed (plan or day names) or that came from an imported backup file must go
// through this, otherwise "<img src=x onerror=...>" would run as code (XSS).
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// All keys the app uses (backup.js also reads this list)
const STORE_KEYS = [
  "workouts", "slotChoices", "goals", "bodyWeights", "profile", "split", "startDate",
  "lang", "trackingFrom", "restSeconds", "barWeight", "customSplits", "skips",
];

const store = {
  // Some browsers (private mode, blocked site data) throw on ANY localStorage access → act as empty
  get(key) {
    try { return localStorage.getItem(STORE_PREFIX + key); } catch { return null; }
  },

  // Returns false when saving failed (storage full or blocked) and shows a red bar, so a workout
  // is never lost silently.
  set(key, value) {
    try {
      localStorage.setItem(STORE_PREFIX + key, value);
      return true;
    } catch (err) {
      console.error("Could not save", key, err);
      showStorageError();
      return false;
    }
  },

  remove(key) {
    try { localStorage.removeItem(STORE_PREFIX + key); } catch { /* nothing to remove */ }
  },

  // Read a JSON value safely. If it's missing → fallback. If it's broken (not JSON, or the wrong
  // type) → keep a copy under "broken_<key>" (so nothing is thrown away), and use the fallback,
  // so ONE bad value can't stop the whole app from loading (blank page).
  getJSON(key, fallback) {
    const raw = this.get(key);
    if (raw === null) return fallback;
    try {
      const value = JSON.parse(raw);
      const sameType = fallback === null
        ? value === null || (typeof value === "object" && !Array.isArray(value))
        : Array.isArray(fallback) === Array.isArray(value) && typeof value === typeof fallback && value !== null;
      if (sameType) return value;
    } catch { /* not valid JSON */ }
    console.warn(`Broken data in "${key}" — kept a copy in "broken_${key}" and started fresh.`);
    try { localStorage.setItem(STORE_PREFIX + "broken_" + key, raw); } catch { /* storage full */ }
    return fallback;
  },
};

// Red bar at the top: "couldn't save". Text comes from i18n.js (loaded later, used at runtime).
function showStorageError() {
  const bar = document.getElementById("storageError");
  if (!bar) return;
  bar.textContent = "⚠️ " + t("storageFull");
  bar.hidden = false;
}

// One-time move of data saved by older versions (without the prefix), so nobody loses anything
for (const key of STORE_KEYS) {
  const old = localStorage.getItem(key);
  if (old !== null && store.get(key) === null) {
    store.set(key, old);
    localStorage.removeItem(key);
  }
}
