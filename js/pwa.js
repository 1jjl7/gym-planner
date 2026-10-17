// ===== Installable app (PWA) =====

// Vercel Web Analytics queue (must exist before /_vercel/insights/script.js loads at the end of the page)
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };

// 1) Register the service worker (only works on https or localhost)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("sw.js");
      precachePlanImages();
    } catch (err) {
      console.warn("Service worker not registered:", err);
    }
  });
}

// 2) Ask the service worker to save the images of every exercise in the current plan
//    (the exercises you actually chose, including swaps and equipment)
async function precachePlanImages() {
  const reg = await navigator.serviceWorker.ready;
  if (!reg.active) return;
  const urls = new Set();
  SPLITS[currentSplit].days.forEach((day, dayIndex) => {
    day.exercises.forEach((_, slotIndex) => {
      const slot = resolveSlot(dayIndex, slotIndex);
      const id = MOVEMENTS[slot.movement].variants[slot.equip].id;
      urls.add(exerciseImage(id, 0));
      urls.add(exerciseImage(id, 1));
    });
  });
  reg.active.postMessage({ type: "precache-images", urls: [...urls] });
}

// 3) "Install app" button: the browser fires beforeinstallprompt when the site can be installed
let installEvent = null;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // don't show the browser's own mini-bar; we use our button
  installEvent = e;
  installBtn.hidden = false;
});
installBtn.addEventListener("click", async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  installBtn.hidden = true;
});
window.addEventListener("appinstalled", () => {
  installBtn.hidden = true;
});
