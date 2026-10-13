// ===== Profile + personal advice =====
// Saved in localStorage as "profile": { age, height, sex }.  Weight comes from the body weight log.
// All advice is general guidance from well-known formulas, not medical advice.

const PROFILE_LIMITS = { age: { min: 13, max: 100 }, height: { min: 120, max: 230 } };

function loadProfile() {
  return JSON.parse(localStorage.getItem("profile") || "null");
}
function saveProfile(profile) {
  localStorage.setItem("profile", JSON.stringify(profile));
}

// BMI = weight (kg) / height (m)²  — WHO categories
function bmiInfo(weight, heightCm) {
  const h = heightCm / 100;
  const bmi = weight / (h * h);
  let category;
  if (bmi < 18.5) category = "bmiUnder";
  else if (bmi < 25) category = "bmiNormal";
  else if (bmi < 30) category = "bmiOver";
  else category = "bmiObese";
  // healthy range for this height = BMI 18.5 … 24.9
  return {
    bmi: Math.round(bmi * 10) / 10,
    category,
    healthyMin: Math.round(18.5 * h * h),
    healthyMax: Math.round(24.9 * h * h),
  };
}

// Activity factor from how many training days the chosen split has
function activityFactor() {
  const days = SPLITS[currentSplit].days.filter((d) => d.exercises.length > 0).length;
  if (days <= 2) return 1.375; // light
  if (days <= 5) return 1.55;  // moderate
  return 1.725;                // very active
}

// Mifflin-St Jeor: calories the body burns at rest, × activity = maintenance calories
function maintenanceCalories(p, weight) {
  const bmr = 10 * weight + 6.25 * p.height - 5 * p.age + (p.sex === "male" ? 5 : -161);
  return Math.round((bmr * activityFactor()) / 10) * 10;
}

function ageTipKey(age) {
  if (age < 18) return "ageTipTeen";
  if (age < 30) return "ageTip18";
  if (age < 40) return "ageTip30";
  if (age < 55) return "ageTip40";
  return "ageTip55";
}

// For each body weight goal with a deadline: is the speed safe? (0.5–1% of body weight per week)
function goalPaceTips(weight) {
  return loadGoals()
    .filter((g) => g.type === "bodyweight" && g.deadline)
    .map((g) => {
      const weeks = Math.max(1, (parseDate(g.deadline) - todayDate()) / DAY_MS / 7);
      const change = Math.abs(g.target - weight);
      const perWeek = change / weeks;
      const safeMax = weight * 0.01;
      const weeksNeeded = Math.ceil(change / safeMax);
      const text = perWeek <= safeMax
        ? t("paceOk").replace("{kg}", perWeek.toFixed(2))
        : t("paceTooFast").replace("{kg}", perWeek.toFixed(2)).replace("{safe}", safeMax.toFixed(1)).replace("{weeks}", weeksNeeded);
      return { ok: perWeek <= safeMax, text: `🎯 ${g.target} ${t("kg")}: ${text}` };
    });
}

// ----- Draw the profile form + advice -----
function renderProfile() {
  const p = loadProfile();
  const weight = latestBodyWeight();
  if (p && document.activeElement?.closest("#profileForm") == null) {
    document.getElementById("profileAge").value = p.age;
    document.getElementById("profileHeight").value = p.height;
    document.getElementById("profileSex").value = p.sex;
  }

  const box = document.getElementById("adviceCards");
  if (!p) {
    box.innerHTML = `<p class="muted small">${t("profileEmpty")}</p>`;
    return;
  }
  if (weight === null) {
    box.innerHTML = `<p class="muted small">${t("profileNeedWeight")}</p>`;
    return;
  }

  const b = bmiInfo(weight, p.height);
  const kcal = maintenanceCalories(p, weight);
  const proteinMin = Math.round(weight * 1.6);
  const proteinMax = Math.round(weight * 2.2);
  const water = (weight * 0.035).toFixed(1);
  const pace = goalPaceTips(weight);

  box.innerHTML = `
    <div class="advice-card">
      <b>⚖️ ${t("bmiTitle")}: <span dir="ltr">${b.bmi}</span> — ${t(b.category)}</b>
      <p>${t("healthyRange").replace("{min}", b.healthyMin).replace("{max}", b.healthyMax)}</p>
      <p class="muted small">${t("bmiNote")}</p>
    </div>
    <div class="advice-card">
      <b>🔥 ${t("caloriesTitle")}</b>
      <p>${t("kcalMaintain")}: <b dir="ltr">${kcal}</b> · ${t("kcalCut")}: <b dir="ltr">${kcal - 500}</b> · ${t("kcalBulk")}: <b dir="ltr">${kcal + 300}</b></p>
      <p class="muted small">${t("kcalNote")}</p>
    </div>
    <div class="advice-card">
      <b>🥩 ${t("proteinTitle")}</b>
      <p>${t("proteinText").replace("{min}", proteinMin).replace("{max}", proteinMax)}</p>
      <p>💧 ${t("waterText").replace("{l}", water)}</p>
    </div>
    <div class="advice-card">
      <b>🎂 ${t("ageTitle")} (${p.age})</b>
      <p>${t(ageTipKey(p.age))}</p>
    </div>
    ${pace.map((x) => `<div class="advice-card ${x.ok ? "ok" : "warn"}"><p>${x.text}</p></div>`).join("")}
    <p class="muted small">⚕️ ${t("adviceDisclaimer")}</p>
  `;
}

document.getElementById("profileForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const age = Number(document.getElementById("profileAge").value);
  const height = Number(document.getElementById("profileHeight").value);
  const sex = document.getElementById("profileSex").value;
  const errorEl = document.getElementById("profileError");

  let error = null;
  if (!age || age < PROFILE_LIMITS.age.min || age > PROFILE_LIMITS.age.max) {
    error = t("ageLabel") + ": " + rangeError(PROFILE_LIMITS.age);
  } else if (!height || height < PROFILE_LIMITS.height.min || height > PROFILE_LIMITS.height.max) {
    error = t("heightLabel") + ": " + rangeError(PROFILE_LIMITS.height);
  } else if (!sex) {
    error = t("errorSex");
  }
  if (error) {
    errorEl.textContent = "⚠️ " + error;
    return;
  }
  errorEl.textContent = "";
  saveProfile({ age: Math.round(age), height: Math.round(height), sex });
  renderProfile();
});
