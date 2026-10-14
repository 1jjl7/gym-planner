// ===== Plate calculator =====
// For barbell exercises: which plates to put on EACH side for a total weight (bar included).
// Greedy algorithm: take the heaviest plate that still fits, repeat, then try the next lighter plate.
// With standard plates (each one is a multiple of the next smaller one) greedy always gives the fewest plates.

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]; // kg, common gym plates
const EZ_BAR = 10;                             // a typical EZ curl bar
const BAR_CHOICES = [20, 15, 10];              // olympic bar, women's bar, training bar

// Equipment that uses plates → which bar weight to use
function barWeightFor(equip) {
  if (equip === "barbell") return Number(store.get("barWeight")) || 20;
  if (equip === "ez") return EZ_BAR;
  return null; // dumbbell, cable, machine, smith (bar weight differs per gym) → no calculator
}

// Returns { status, perSide: [plates], total }
//   status: "exact" | "closest" (rounded down to what plates allow) | "barOnly" | "belowBar"
function platesFor(total, bar) {
  if (total < bar) return { status: "belowBar", perSide: [], total };
  if (total === bar) return { status: "barOnly", perSide: [], total };

  let remaining = (total - bar) / 2; // weight needed on ONE side
  const perSide = [];
  for (const plate of PLATES) {
    while (remaining >= plate - 0.001) { // tiny tolerance for decimals like 1.25
      perSide.push(plate);
      remaining -= plate;
    }
  }
  const loaded = bar + 2 * perSide.reduce((a, b) => a + b, 0);
  return { status: remaining < 0.001 ? "exact" : "closest", perSide, total: Math.round(loaded * 100) / 100 };
}

// Text shown under a set row, e.g. "🏋️ كل جهة: 20 + 10"
function plateText(total, equip) {
  const bar = barWeightFor(equip);
  if (bar === null || !total) return "";
  const r = platesFor(total, bar);
  if (r.status === "belowBar") return `🏋️ ${t("plateBelowBar").replace("{bar}", bar)}`;
  if (r.status === "barOnly") return `🏋️ ${t("plateBarOnly")}`;
  const list = r.perSide.join(" + ");
  return r.status === "exact"
    ? `🏋️ ${t("platePerSide")}: <b dir="ltr">${list}</b>`
    : `🏋️ ${t("plateClosest").replace("{total}", r.total)}: <b dir="ltr">${list}</b>`;
}

// Bar weight setting (⚙️ schedule settings)
document.getElementById("barWeightInput").addEventListener("change", (e) => {
  const value = Number(e.target.value);
  if (BAR_CHOICES.includes(value)) store.set("barWeight", value);
  renderToday(); // refresh the plate lines
});
