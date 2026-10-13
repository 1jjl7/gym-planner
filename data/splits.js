// Training splits. Each split is a 7-day cycle that repeats.
// A day with an empty "exercises" list is a rest day.
// Each slot: [movement key, sets, reps, default equipment]
// The user can change the equipment or swap the movement; those choices are saved separately.

const SPLITS = {
  ppl_ul: {
    name: { ar: "دفع / سحب / أرجل / علوي / سفلي", en: "Push / Pull / Legs / Upper / Lower" },
    days: [
      { title: { ar: "دفع", en: "Push" }, exercises: [
        ["flat_press", 4, "6-8", "barbell"],
        ["incline_press", 3, "8-10", "dumbbell"],
        ["shoulder_press", 3, "8-10", "dumbbell"],
        ["lateral_raise", 3, "12-15", "dumbbell"],
        ["triceps_pushdown", 3, "10-12", "rope"],
        ["overhead_triceps", 3, "10-12", "cable"],
      ]},
      { title: { ar: "سحب", en: "Pull" }, exercises: [
        ["vertical_pull", 4, "6-10", "bodyweight"],
        ["row", 3, "8-10", "barbell"],
        ["row", 3, "10-12", "cable"],
        ["rear_delt", 3, "12-15", "cable"],
        ["biceps_curl", 3, "8-10", "barbell"],
        ["hammer_curl", 3, "10-12", "dumbbell"],
      ]},
      { title: { ar: "أرجل", en: "Legs" }, exercises: [
        ["squat", 4, "6-8", "barbell"],
        ["rdl", 3, "8-10", "barbell"],
        ["leg_press", 3, "10-12", "machine"],
        ["leg_curl", 3, "10-12", "lying"],
        ["calf_raise", 4, "12-15", "standing"],
      ]},
      { title: { ar: "راحة", en: "Rest" }, exercises: [] },
      { title: { ar: "علوي", en: "Upper" }, exercises: [
        ["flat_press", 3, "8-10", "dumbbell"],
        ["vertical_pull", 3, "8-10", "cable"],
        ["shoulder_press", 3, "8-10", "barbell"],
        ["row", 3, "10-12", "dumbbell"],
        ["incline_curl", 2, "10-12", "dumbbell"],
        ["skullcrusher", 2, "10-12", "ez"],
      ]},
      { title: { ar: "سفلي", en: "Lower" }, exercises: [
        ["deadlift", 3, "5", "barbell"],
        ["lunge", 3, "10-12", "dumbbell"],
        ["leg_extension", 3, "12-15", "machine"],
        ["leg_curl", 3, "12-15", "seated"],
        ["leg_raise", 3, "10-15", "bodyweight"],
      ]},
      { title: { ar: "راحة", en: "Rest" }, exercises: [] },
    ],
  },

  full_body: {
    name: { ar: "جسم كامل 3 أيام", en: "Full Body 3x" },
    days: [
      { title: { ar: "جسم كامل A", en: "Full Body A" }, exercises: [
        ["squat", 3, "6-8", "barbell"],
        ["flat_press", 3, "6-8", "barbell"],
        ["row", 3, "8-10", "barbell"],
        ["lateral_raise", 3, "12-15", "dumbbell"],
        ["plank", 3, "30-60s", "bodyweight"],
      ]},
      { title: { ar: "راحة", en: "Rest" }, exercises: [] },
      { title: { ar: "جسم كامل B", en: "Full Body B" }, exercises: [
        ["rdl", 3, "8-10", "barbell"],
        ["shoulder_press", 3, "6-8", "barbell"],
        ["vertical_pull", 3, "8-10", "cable"],
        ["lunge", 3, "10-12", "dumbbell"],
        ["crunch", 3, "12-15", "cable"],
      ]},
      { title: { ar: "راحة", en: "Rest" }, exercises: [] },
      { title: { ar: "جسم كامل A", en: "Full Body A" }, exercises: [
        ["squat", 3, "6-8", "barbell"],
        ["flat_press", 3, "6-8", "barbell"],
        ["row", 3, "8-10", "barbell"],
        ["lateral_raise", 3, "12-15", "dumbbell"],
        ["plank", 3, "30-60s", "bodyweight"],
      ]},
      { title: { ar: "راحة", en: "Rest" }, exercises: [] },
      { title: { ar: "راحة", en: "Rest" }, exercises: [] },
    ],
  },

  bro_split: {
    name: { ar: "عضلة لكل يوم", en: "Bro Split" },
    days: [
      { title: { ar: "صدر", en: "Chest" }, exercises: [
        ["flat_press", 4, "6-8", "barbell"],
        ["incline_press", 3, "8-10", "dumbbell"],
        ["chest_fly", 3, "12-15", "cable"],
        ["chest_dips", 3, "8-12", "bodyweight"],
      ]},
      { title: { ar: "ظهر", en: "Back" }, exercises: [
        ["vertical_pull", 4, "6-10", "bodyweight"],
        ["row", 3, "8-10", "barbell"],
        ["row", 3, "10-12", "cable"],
        ["shrug", 3, "10-12", "barbell"],
      ]},
      { title: { ar: "أكتاف", en: "Shoulders" }, exercises: [
        ["shoulder_press", 4, "6-8", "barbell"],
        ["lateral_raise", 4, "12-15", "dumbbell"],
        ["rear_delt", 3, "12-15", "cable"],
      ]},
      { title: { ar: "ذراع", en: "Arms" }, exercises: [
        ["biceps_curl", 3, "8-10", "barbell"],
        ["skullcrusher", 3, "8-10", "ez"],
        ["hammer_curl", 3, "10-12", "dumbbell"],
        ["triceps_dips", 3, "8-12", "bodyweight"],
      ]},
      { title: { ar: "أرجل", en: "Legs" }, exercises: [
        ["squat", 4, "6-8", "barbell"],
        ["leg_press", 3, "10-12", "machine"],
        ["rdl", 3, "8-10", "barbell"],
        ["hip_thrust", 3, "8-12", "barbell"],
        ["calf_raise", 4, "12-15", "standing"],
      ]},
      { title: { ar: "راحة", en: "Rest" }, exercises: [] },
      { title: { ar: "راحة", en: "Rest" }, exercises: [] },
    ],
  },
};

const DEFAULT_SPLIT = "ppl_ul";
