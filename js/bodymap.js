// ===== Muscle map (front + back) =====
// The body shapes come from data/body-model.js (body-highlighter, MIT).
// Their muscle names differ from ours, so this table says which of their shapes belong to each of our muscles.
const MUSCLE_SHAPES = {
  chest: ["chest"],
  shoulders: ["front_deltoids", "back_deltoids"],
  triceps: ["triceps"],
  biceps: ["biceps"],
  forearms: ["forearm"],
  lats: ["upper_back"],        // the model has one "upper back" shape for lats + middle back
  middle_back: ["upper_back"],
  lower_back: ["lower_back"],
  traps: ["trapezius"],
  abdominals: ["abs", "obliques"],
  quadriceps: ["quadriceps"],
  hamstrings: ["hamstring"],
  glutes: ["gluteal"],
  calves: ["calves", "left_soleus", "right_soleus"],
};

// Reverse lookup: model shape → our muscle keys (e.g. "upper_back" → ["lats", "middle_back"])
const SHAPE_TO_MUSCLES = {};
for (const [muscle, shapes] of Object.entries(MUSCLE_SHAPES)) {
  for (const shape of shapes) (SHAPE_TO_MUSCLES[shape] ??= []).push(muscle);
}

// Draws front + back. colorFor(shape) returns a CSS class for that shape ("" = plain).
function drawBody(colorFor, titleFor = () => "") {
  const view = (polys) => polys.map((p) => {
    const isMuscle = Boolean(SHAPE_TO_MUSCLES[p.muscle]);
    const cls = isMuscle ? `muscle ${colorFor(p.muscle)}` : "base"; // head, neck, knees… stay neutral
    const title = isMuscle ? titleFor(p.muscle) : "";
    return p.points.map((pts) =>
      `<polygon class="${cls}" points="${pts}">${title ? `<title>${title}</title>` : ""}</polygon>`).join("");
  }).join("");

  return `
    <svg class="body-map" viewBox="0 0 225 240" role="img" aria-label="Muscle map">
      <g transform="translate(5 4)">${view(BODY_FRONT)}</g>
      <g transform="translate(120 0)">${view(BODY_BACK)}</g>
      <text x="55" y="236" text-anchor="middle">${t("front")}</text>
      <text x="170" y="236" text-anchor="middle">${t("back")}</text>
    </svg>`;
}

// Technique window: primary muscles strong, helper muscles light
function bodyMapSVG(primary, secondary) {
  return drawBody((shape) => {
    const ours = SHAPE_TO_MUSCLES[shape];
    if (ours.some((m) => primary.includes(m))) return "primary"; // primary wins if a shape is shared
    if (ours.some((m) => secondary.includes(m))) return "secondary";
    return "";
  });
}

// Feature 6: color each muscle by a number (weekly sets). levelFor(value) → "lvl-0" … "lvl-4"
function bodyMapLevels(values, levelFor, labelFor) {
  // a shared shape (upper back) shows the larger of its muscles' values
  const shapeValue = (shape) => Math.max(...SHAPE_TO_MUSCLES[shape].map((m) => values[m] || 0));
  return drawBody((shape) => levelFor(shapeValue(shape)), (shape) => labelFor(shape, shapeValue(shape)));
}
