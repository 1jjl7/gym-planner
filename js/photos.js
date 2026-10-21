// ===== Progress photos =====
// Photos are too big for localStorage (~5 MB, text only), so they go in IndexedDB: a database
// INSIDE this browser on this device. Nothing is uploaded anywhere.
// Each record: { id, date: "2026-10-21", weight: 78.2 | null, blob: <JPEG file> }
// Photos are shrunk before saving (longest side 1080 px, JPEG 80%): a 4 MB phone photo → ~150 KB.

const PHOTO_DB = "gym-planner";
const PHOTO_STORE = "photos";
const PHOTO_MAX_SIDE = 1080;
let photoUrls = [];          // temporary blob: links currently on screen (freed on every redraw)
let comparePick = [];        // ids of the 2 photos being compared (empty = first vs latest)

// Open (or create) the database. IndexedDB uses callbacks, so we wrap it in a Promise.
function openPhotoDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(PHOTO_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(PHOTO_STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Run one action on the photo store and wait for it to finish
async function photoStore(mode, action) {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, mode);
    const req = action(tx.objectStore(PHOTO_STORE));
    tx.oncomplete = () => { db.close(); resolve(req?.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

const loadPhotos = async () =>
  ((await photoStore("readonly", (s) => s.getAll())) || []).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
const addPhoto = (record) => photoStore("readwrite", (s) => s.put(record));
const deletePhoto = (id) => photoStore("readwrite", (s) => s.delete(id));

// Shrink a photo in the browser: draw it smaller on a canvas, export as JPEG
async function shrinkPhoto(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
}

// "3 weeks" / "2 months" between two dates
function timeBetween(fromKey, toKey) {
  const days = Math.round((parseDate(toKey) - parseDate(fromKey)) / DAY_MS);
  if (days < 14) return t("photoDays").replace("{n}", days);
  if (days < 60) return t("photoWeeks").replace("{n}", Math.round(days / 7));
  return t("photoMonths").replace("{n}", Math.round(days / 30));
}

function photoLabel(p) {
  const date = formatDate(parseDate(p.date), { day: "numeric", month: "long", year: "numeric" });
  return p.weight ? `${date} · ${p.weight} ${t("kg")}` : date;
}

async function renderPhotos() {
  const grid = document.getElementById("photoGrid");
  const compare = document.getElementById("photoCompare");
  let photos;
  try {
    photos = await loadPhotos();
  } catch {
    compare.innerHTML = "";
    grid.innerHTML = `<p class="form-error">${t("photoDbError")}</p>`;
    return;
  }
  photoUrls.forEach((u) => URL.revokeObjectURL(u)); // free the old links (they hold memory)
  photoUrls = [];
  const url = (p) => {
    const u = URL.createObjectURL(p.blob);
    photoUrls.push(u);
    return u;
  };

  if (photos.length === 0) {
    compare.innerHTML = "";
    grid.innerHTML = `<p class="muted">${t("photosEmpty")}</p>`;
    return;
  }

  // The two photos to compare: the ones you picked, or first vs latest
  comparePick = comparePick.filter((id) => photos.some((p) => p.id === id));
  let pair = comparePick.length === 2
    ? photos.filter((p) => comparePick.includes(p.id))
    : [photos[0], photos[photos.length - 1]];
  if (pair[0] === pair[1]) pair = [pair[0]];

  let diff = "";
  if (pair.length === 2) {
    const parts = [timeBetween(pair[0].date, pair[1].date)];
    if (pair[0].weight && pair[1].weight) {
      const change = Math.round((pair[1].weight - pair[0].weight) * 10) / 10;
      // <bdi> keeps "−1.8" in the right order inside Arabic (right-to-left) text
      parts.push(`<bdi dir="ltr"><b>${change > 0 ? "+" : change < 0 ? "−" : ""}${Math.abs(change)}</b></bdi> ${t("kg")}`);
    }
    diff = `<p class="me-diff">${parts.join(" · ")}</p>`;
  }
  compare.innerHTML = `<div class="me-compare${pair.length === 1 ? " single" : ""}">${pair.map((p, i) => `
      <div class="me-photo">
        <img src="${url(p)}" alt="">
        <b>${pair.length === 1 ? t("photoFirst") : i === 0 ? t("photoBefore") : t("photoAfter")}</b>
        <span class="muted small">${photoLabel(p)}</span>
      </div>`).join("")}</div>${diff}
    ${photos.length > 2 ? `<p class="muted small">${t("photoPickHint")}</p>` : ""}`;

  // newest first; tap = pick for comparison; 🗑 = delete (tap twice)
  grid.innerHTML = "";
  [...photos].reverse().forEach((p) => {
    const cell = document.createElement("div");
    cell.className = "me-thumb" + (comparePick.includes(p.id) ? " picked" : "");
    cell.innerHTML = `<img src="${url(p)}" alt="" role="button" tabindex="0">
      <span class="small">${formatDate(parseDate(p.date), { day: "numeric", month: "short" })}</span>
      <button class="link-btn small photo-delete">🗑</button>`;
    cell.querySelector("img").addEventListener("click", () => {
      comparePick = comparePick.includes(p.id)
        ? comparePick.filter((id) => id !== p.id)
        : [...comparePick, p.id].slice(-2); // keep the last 2 taps
      renderPhotos();
    });
    confirmClick(cell.querySelector(".photo-delete"), async () => {
      await deletePhoto(p.id);
      renderPhotos();
      renderPhotoNudge();
    });
    grid.appendChild(cell);
  });
}

document.getElementById("photoInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  const error = document.getElementById("photoError");
  error.textContent = "";
  try {
    const blob = await shrinkPhoto(file);
    await addPhoto({ id: Date.now(), date: formatDateInput(todayDate()), weight: latestBodyWeight() ?? null, blob });
    comparePick = [];
  } catch {
    error.textContent = t("photoSaveError"); // unreadable image, or the browser refused to save
  }
  renderPhotos();
  renderPhotoNudge();
});

document.getElementById("meBtn").addEventListener("click", renderPhotos);

// ----- Monthly reminder in the Today tab -----
const PHOTO_EVERY_DAYS = 30;

async function renderPhotoNudge() {
  const box = document.getElementById("photoNudge");
  const today = formatDateInput(todayDate());
  let photos;
  try {
    photos = await loadPhotos();
  } catch {
    box.hidden = true; // photos can't be saved in this browser → no point reminding
    return;
  }
  const last = photos[photos.length - 1];
  const daysSince = last ? Math.round((parseDate(today) - parseDate(last.date)) / DAY_MS) : null;
  const due = daysSince === null || daysSince >= PHOTO_EVERY_DAYS;
  if (!due || store.get("photoNudgeHidden") === today) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  box.innerHTML = `<button class="photo-nudge-open">📸 ${last ? t("photoNudgeDue").replace("{n}", daysSince) : t("photoNudgeFirst")}</button>
    <button class="link-btn photo-nudge-hide" aria-label="${t("photoNudgeLater")}">${t("photoNudgeLater")}</button>`;
  box.querySelector(".photo-nudge-open").addEventListener("click", () => document.getElementById("meBtn").click());
  box.querySelector(".photo-nudge-hide").addEventListener("click", () => {
    store.set("photoNudgeHidden", today); // hide until tomorrow
    box.hidden = true;
  });
}

// ----- Photo backup: a separate file, so the normal backup stays small -----
// File: { app: "gym-planner-photos", version: 1, photos: [ { id, date, weight, jpeg: "<base64>" } ] }
const PHOTO_BACKUP_APP = "gym-planner-photos";

const blobToBase64 = (blob) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(",")[1]); // drop "data:image/jpeg;base64,"
  reader.readAsDataURL(blob);
});

function base64ToBlob(text) {
  const bytes = Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: "image/jpeg" });
}

function photoBackupMessage(text, isError = false) {
  const el = document.getElementById("photoBackupMessage");
  el.textContent = text;
  el.className = isError ? "form-error" : "data-ok";
}

document.getElementById("photoExport").addEventListener("click", async () => {
  const photos = await loadPhotos();
  if (photos.length === 0) return photoBackupMessage(t("photosEmpty"), true);
  const list = [];
  for (const p of photos) list.push({ id: p.id, date: p.date, weight: p.weight, jpeg: await blobToBase64(p.blob) });
  downloadFile(`gym-photos-${formatDateInput(todayDate())}.json`,
    JSON.stringify({ app: PHOTO_BACKUP_APP, version: 1, photos: list }), "application/json");
  photoBackupMessage("✅ " + t("photoExportDone").replace("{n}", list.length));
});

// Every photo in the file is checked before anything is saved (the file could come from anywhere)
function checkPhotoBackup(backup) {
  return isObj(backup) && backup.app === PHOTO_BACKUP_APP && Array.isArray(backup.photos) &&
    backup.photos.length <= 500 && backup.photos.every((p) =>
      isObj(p) && Number.isSafeInteger(p.id) && isDateKey(p.date) &&
      (p.weight === null || isNum(p.weight, LIMITS.bodyWeight.min, LIMITS.bodyWeight.max)) &&
      typeof p.jpeg === "string" && p.jpeg.length < 3000000 && /^[A-Za-z0-9+/=]+$/.test(p.jpeg));
}

document.getElementById("photoImportFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  let backup;
  try {
    backup = JSON.parse(await file.text());
  } catch {
    return photoBackupMessage("⚠️ " + t("restoreNotJson"), true);
  }
  if (!checkPhotoBackup(backup)) return photoBackupMessage("⚠️ " + t("restoreBroken"), true);
  // add to the photos already here (same id = same photo, so nothing is doubled)
  try {
    for (const p of backup.photos) await addPhoto({ id: p.id, date: p.date, weight: p.weight, blob: base64ToBlob(p.jpeg) });
  } catch {
    return photoBackupMessage("⚠️ " + t("photoSaveError"), true);
  }
  photoBackupMessage("✅ " + t("photoImportDone").replace("{n}", backup.photos.length));
  comparePick = [];
  renderPhotos();
  renderPhotoNudge();
});
// (the first reminder is drawn by renderToday() in app.js, which loads after this file)
