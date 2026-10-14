// ===== Rest timer =====
// Starts when a set is ticked ✓ in the Today tab. Shows a bar at the bottom of the screen.
// It stores the END time (not a countdown), so it stays correct even if the phone sleeps
// or the browser slows the page down in the background.

const REST_LIMITS = { min: 30, max: 300 };
let restEnd = null;      // timestamp (ms) when the rest is over
let restTotal = 0;       // full length of this rest (ms), for the progress line
let restTick = null;     // interval that redraws the bar
let restDoneTimer = null;

function restSeconds() {
  const saved = Number(store.get("restSeconds"));
  return saved >= REST_LIMITS.min && saved <= REST_LIMITS.max ? saved : 90;
}

function startRestTimer() {
  restTotal = restSeconds() * 1000;
  restEnd = Date.now() + restTotal;
  clearTimeout(restDoneTimer);
  clearInterval(restTick);
  restTick = setInterval(updateRestBar, 250);
  updateRestBar();
}

// −15 / +15 seconds
function addRest(seconds) {
  if (!restEnd) return;
  restEnd = Math.max(Date.now(), restEnd + seconds * 1000);
  restTotal = Math.max(restTotal + seconds * 1000, 1000);
  updateRestBar();
}

function stopRestTimer() {
  clearInterval(restTick);
  clearTimeout(restDoneTimer);
  restEnd = null;
  document.getElementById("restBar").hidden = true;
}

function updateRestBar() {
  const bar = document.getElementById("restBar");
  const left = Math.max(0, restEnd - Date.now());
  const secs = Math.ceil(left / 1000);
  bar.hidden = false;
  bar.classList.remove("done");
  document.getElementById("restTime").textContent =
    `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  document.getElementById("restLabel").textContent = t("restLabel");
  document.getElementById("restFill").style.width = `${(left / restTotal) * 100}%`;
  if (left === 0) finishRest();
}

function finishRest() {
  clearInterval(restTick);
  restEnd = null;
  const bar = document.getElementById("restBar");
  bar.classList.add("done");
  document.getElementById("restLabel").textContent = t("restDone");
  document.getElementById("restTime").textContent = "";
  if (navigator.vibrate) navigator.vibrate([300, 120, 300]);
  beep();
  restDoneTimer = setTimeout(stopRestTimer, 6000); // hide the green bar after a few seconds
}

// Short beep made in the browser (no sound file needed)
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.2);
    });
  } catch {
    /* sound not available — vibration / green bar still show */
  }
}

document.getElementById("restMinus").addEventListener("click", () => addRest(-15));
document.getElementById("restPlus").addEventListener("click", () => addRest(15));
document.getElementById("restSkip").addEventListener("click", stopRestTimer);

// Default rest setting (⚙️ schedule settings)
document.getElementById("restSecondsInput").addEventListener("change", (e) => {
  const value = Math.round(Number(e.target.value));
  if (value >= REST_LIMITS.min && value <= REST_LIMITS.max) store.set("restSeconds", value);
  e.target.value = restSeconds(); // shows the real value (fixes typos like 5 or 999)
});
