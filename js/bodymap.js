// Simple front + back body diagram drawn with SVG shapes.
// Every muscle shape has data-muscle="<key from MUSCLES>" so we can color it:
//   primary muscle → class "primary" (strong color), secondary → class "secondary" (light color).

// Front view (figure centered at x = 100)
const BODY_FRONT = `
  <circle class="base" cx="100" cy="32" r="18"/>
  <rect class="base" x="92" y="48" width="16" height="14"/>
  <ellipse class="muscle" data-muscle="shoulders" cx="62" cy="78" rx="14" ry="12"/>
  <ellipse class="muscle" data-muscle="shoulders" cx="138" cy="78" rx="14" ry="12"/>
  <path class="muscle" data-muscle="chest" d="M99 66 L76 68 Q64 80 68 100 Q84 108 99 104 Z"/>
  <path class="muscle" data-muscle="chest" d="M101 66 L124 68 Q136 80 132 100 Q116 108 101 104 Z"/>
  <rect class="muscle" data-muscle="abdominals" x="82" y="108" width="36" height="62" rx="8"/>
  <ellipse class="muscle" data-muscle="biceps" cx="54" cy="110" rx="9" ry="20"/>
  <ellipse class="muscle" data-muscle="biceps" cx="146" cy="110" rx="9" ry="20"/>
  <ellipse class="muscle" data-muscle="forearms" cx="49" cy="152" rx="8" ry="20"/>
  <ellipse class="muscle" data-muscle="forearms" cx="151" cy="152" rx="8" ry="20"/>
  <circle class="base" cx="46" cy="180" r="6"/>
  <circle class="base" cx="154" cy="180" r="6"/>
  <path class="base" d="M80 174 L120 174 L126 196 L74 196 Z"/>
  <ellipse class="muscle" data-muscle="quadriceps" cx="86" cy="238" rx="14" ry="40"/>
  <ellipse class="muscle" data-muscle="quadriceps" cx="114" cy="238" rx="14" ry="40"/>
  <circle class="base" cx="86" cy="284" r="7"/>
  <circle class="base" cx="114" cy="284" r="7"/>
  <ellipse class="muscle" data-muscle="calves" cx="86" cy="320" rx="10" ry="30"/>
  <ellipse class="muscle" data-muscle="calves" cx="114" cy="320" rx="10" ry="30"/>
  <ellipse class="base" cx="86" cy="358" rx="10" ry="5"/>
  <ellipse class="base" cx="114" cy="358" rx="10" ry="5"/>
`;

// Back view (same outline, different muscles)
const BODY_BACK = `
  <circle class="base" cx="100" cy="32" r="18"/>
  <rect class="base" x="92" y="48" width="16" height="10"/>
  <path class="muscle" data-muscle="traps" d="M88 56 L112 56 L128 72 L100 96 L72 72 Z"/>
  <ellipse class="muscle" data-muscle="shoulders" cx="62" cy="78" rx="14" ry="12"/>
  <ellipse class="muscle" data-muscle="shoulders" cx="138" cy="78" rx="14" ry="12"/>
  <path class="muscle" data-muscle="lats" d="M74 88 Q66 120 84 152 L92 152 L92 100 Z"/>
  <path class="muscle" data-muscle="lats" d="M126 88 Q134 120 116 152 L108 152 L108 100 Z"/>
  <path class="muscle" data-muscle="middle_back" d="M100 100 L106 100 L106 138 L94 138 L94 100 Z"/>
  <rect class="muscle" data-muscle="lower_back" x="86" y="142" width="28" height="28" rx="6"/>
  <ellipse class="muscle" data-muscle="triceps" cx="54" cy="110" rx="9" ry="20"/>
  <ellipse class="muscle" data-muscle="triceps" cx="146" cy="110" rx="9" ry="20"/>
  <ellipse class="muscle" data-muscle="forearms" cx="49" cy="152" rx="8" ry="20"/>
  <ellipse class="muscle" data-muscle="forearms" cx="151" cy="152" rx="8" ry="20"/>
  <circle class="base" cx="46" cy="180" r="6"/>
  <circle class="base" cx="154" cy="180" r="6"/>
  <ellipse class="muscle" data-muscle="glutes" cx="88" cy="190" rx="14" ry="16"/>
  <ellipse class="muscle" data-muscle="glutes" cx="112" cy="190" rx="14" ry="16"/>
  <ellipse class="muscle" data-muscle="hamstrings" cx="86" cy="244" rx="13" ry="36"/>
  <ellipse class="muscle" data-muscle="hamstrings" cx="114" cy="244" rx="13" ry="36"/>
  <circle class="base" cx="86" cy="286" r="7"/>
  <circle class="base" cx="114" cy="286" r="7"/>
  <ellipse class="muscle" data-muscle="calves" cx="86" cy="320" rx="11" ry="28"/>
  <ellipse class="muscle" data-muscle="calves" cx="114" cy="320" rx="11" ry="28"/>
  <ellipse class="base" cx="86" cy="358" rx="10" ry="5"/>
  <ellipse class="base" cx="114" cy="358" rx="10" ry="5"/>
`;

// Builds the full diagram (front + back side by side) with the given muscles highlighted
function bodyMapSVG(primary, secondary) {
  const svg = `
    <svg class="body-map" viewBox="0 0 400 390" role="img" aria-label="Muscle map">
      <g>${BODY_FRONT}<text x="100" y="384" text-anchor="middle">${t("front")}</text></g>
      <g transform="translate(200 0)">${BODY_BACK}<text x="100" y="384" text-anchor="middle">${t("back")}</text></g>
    </svg>`;

  // Turn the text into real elements so we can add classes to the muscles
  const holder = document.createElement("div");
  holder.innerHTML = svg;
  holder.querySelectorAll(".muscle").forEach((shape) => {
    const m = shape.dataset.muscle;
    if (primary.includes(m)) shape.classList.add("primary");
    else if (secondary.includes(m)) shape.classList.add("secondary");
  });
  return holder.innerHTML;
}
