// ===== Me page: name, greeting and profile photo =====
// Saved on this device only: "name" (text) and "avatar" (a small JPEG as a data: URL, ~10 KB).
// The photo is cropped to a square and shrunk in the browser before saving, because a phone
// photo (3-5 MB) would fill localStorage (~5 MB) on its own.

const NAME_MAX = 30;
const AVATAR_SIZE = 160; // px — the circle is at most 72 px, x2 for sharp phone screens

function loadName() {
  return store.get("name") || "";
}
function loadAvatar() {
  return store.get("avatar") || "";
}

// The circle: photo if there is one, otherwise the first letter of the name, otherwise 👤
function avatarHtml() {
  const photo = loadAvatar();
  if (photo) return `<img src="${esc(photo)}" alt="">`;
  const name = loadName();
  return name ? esc([...name][0]) : "👤"; // [...name] keeps emoji / Arabic letters whole
}

function renderMe() {
  const name = loadName();
  document.getElementById("meBtn").innerHTML = avatarHtml();
  const avatar = document.getElementById("meAvatar");
  avatar.querySelectorAll("img, .me-initial").forEach((el) => el.remove());
  avatar.insertAdjacentHTML("afterbegin", loadAvatar() ? avatarHtml() : `<span class="me-initial">${avatarHtml()}</span>`);
  document.getElementById("avatarRemove").hidden = !loadAvatar();

  document.getElementById("meHello").textContent = name ? t("helloName").replace("{name}", name) : t("helloNoName");
  const p = loadProfile();
  const weight = latestBodyWeight();
  const parts = [];
  if (p) parts.push(`${p.age} ${t("years")}`, `${p.height} ${t("cm")}`);
  if (weight !== null && weight !== undefined) parts.push(`${weight} ${t("kg")}`);
  document.getElementById("meInfo").textContent = parts.join(" · ") || t("meInfoEmpty");

  const input = document.getElementById("nameInput");
  if (document.activeElement !== input) input.value = name;
}

// Name: saved when you leave the box / press Enter
document.getElementById("nameInput").addEventListener("change", (e) => {
  const error = document.getElementById("meError");
  const value = e.target.value.trim();
  if (/[<>]/.test(value)) {
    error.textContent = t("nameBadChars");
    return;
  }
  error.textContent = "";
  if (value) store.set("name", value.slice(0, NAME_MAX));
  else store.remove("name");
  renderMe();
});

// Photo: read the file -> crop the middle square -> shrink -> save as JPEG
document.getElementById("avatarInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  const error = document.getElementById("meError");
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = AVATAR_SIZE;
    canvas.getContext("2d").drawImage(bitmap,
      (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, // middle square of the photo
      0, 0, AVATAR_SIZE, AVATAR_SIZE);
    bitmap.close();
    if (store.set("avatar", canvas.toDataURL("image/jpeg", 0.85))) error.textContent = "";
  } catch {
    error.textContent = t("avatarBad"); // not an image the browser can read
  }
  renderMe();
});

document.getElementById("avatarRemove").addEventListener("click", () => {
  store.remove("avatar");
  renderMe();
});

document.getElementById("meBtn").addEventListener("click", () => {
  showTab("me");
  renderProfile(); // advice uses the latest weight and goals (also calls renderMe)
});

renderMe();
