// ===== Warm-up calculator =====
// Suggests warm-up sets before the first working set of a big (compound) lift:
//   empty bar × 10 (barbell / EZ only) → 50% × 5 → 70% × 3 → 85% × 1
// Weights are rounded to the nearest 2.5 kg (something you can actually load).
// For display only — warm-up sets are not saved in the log.

// Big multi-joint movements that benefit from warm-up sets
const COMPOUND_MOVES = ["flat_press", "incline_press", "shoulder_press", "row", "squat", "deadlift", "rdl", "leg_press", "hip_thrust"];
const WARMUP_STEPS = [[0.5, 5], [0.7, 3], [0.85, 1]]; // [percent of working weight, reps]
const openWarmups = new Set(); // which warm-up boxes are open (kept when the panel redraws)

function needsWarmup(movement, equip) {
  return COMPOUND_MOVES.includes(movement) && equip !== "bodyweight";
}

// Returns [{ w, r }] for a working weight
function warmupSets(work, equip) {
  const bar = barWeightFor(equip); // null when it isn't a barbell / EZ bar
  const sets = [];
  if (bar !== null) sets.push({ w: bar, r: 10, isBar: true });
  for (const [pct, reps] of WARMUP_STEPS) {
    const w = Math.round((work * pct) / WEIGHT_STEP) * WEIGHT_STEP;
    const previous = sets.length ? sets[sets.length - 1].w : 0;
    // skip steps that are lighter than (or equal to) the step before, or not lighter than the working weight
    if (w <= previous || w >= work) continue;
    sets.push({ w, r: reps });
  }
  return sets;
}

// HTML for the warm-up box inside a set panel
function warmupHtml(work, slot, boxKey) {
  const open = openWarmups.has(boxKey) ? " open" : "";
  if (!work) {
    return `<details class="warmup"${open} data-key="${boxKey}"><summary>🔥 ${t("warmupTitle")}</summary>
      <p class="muted small">${t("warmupNeedWeight")}</p></details>`;
  }
  const sets = warmupSets(work, slot.equip);
  const usesPlates = barWeightFor(slot.equip) !== null;
  const items = sets.map((s) => {
    const label = s.isBar ? t("warmupBar") : `${s.w} ${t("kg")}`;
    let plates = "";
    if (usesPlates && !s.isBar) {
      const p = platesFor(s.w, barWeightFor(slot.equip));
      plates = ` <span class="muted">(${t("platePerSide")} <span dir="ltr">${p.perSide.join(" + ")}</span>)</span>`;
    }
    return `<li><b>${label}</b> × ${s.r}${plates}</li>`;
  }).join("");
  return `<details class="warmup"${open} data-key="${boxKey}">
      <summary>🔥 ${t("warmupTitle")} <span class="muted">(${t("warmupBefore").replace("{w}", work)})</span></summary>
      <ol class="warmup-list">${items}</ol>
    </details>`;
}
