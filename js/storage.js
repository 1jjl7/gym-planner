// ===== Storage with a prefix =====
// Every key this app saves gets the prefix "gp_" (gp = gym planner), e.g. "workouts" → "gp_workouts".
// Why: sites on the same domain share ONE localStorage. A prefix keeps our data from clashing with
// another app on the same domain that also uses a key like "lang".
// Loaded first, before every other script.

const STORE_PREFIX = "gp_";

// All keys the app uses (backup.js also reads this list)
const STORE_KEYS = [
  "workouts", "slotChoices", "goals", "bodyWeights", "profile", "split", "startDate",
  "lang", "trackingFrom", "restSeconds", "barWeight", "customSplits",
];

const store = {
  get: (key) => localStorage.getItem(STORE_PREFIX + key),
  set: (key, value) => localStorage.setItem(STORE_PREFIX + key, value),
  remove: (key) => localStorage.removeItem(STORE_PREFIX + key),
};

// One-time move of data saved by older versions (without the prefix), so nobody loses anything
for (const key of STORE_KEYS) {
  const old = localStorage.getItem(key);
  if (old !== null && store.get(key) === null) {
    store.set(key, old);
    localStorage.removeItem(key);
  }
}
