// Movement library (generated from free-exercise-db data, then kept as a normal file).
// Images + muscles come from free-exercise-db (public domain): https://github.com/yuhonas/free-exercise-db
// Each exercise folder has 2 frames: 0.jpg (start position) and 1.jpg (end position).
//
// Structure: a MOVEMENT (e.g. flat chest press) has one or more VARIANTS by equipment
// (barbell / dumbbell / cable / machine ...). Each variant points to one exercise in the database.
const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

// Muscle names in both languages (keys are also used as ids in the body map later)
const MUSCLES = {
  chest:       { ar: "الصدر", en: "Chest" },
  shoulders:   { ar: "الأكتاف", en: "Shoulders" },
  triceps:     { ar: "الترايسبس", en: "Triceps" },
  biceps:      { ar: "البايسبس", en: "Biceps" },
  forearms:    { ar: "الساعد", en: "Forearms" },
  lats:        { ar: "الظهر العريض", en: "Lats" },
  middle_back: { ar: "منتصف الظهر", en: "Middle back" },
  lower_back:  { ar: "أسفل الظهر", en: "Lower back" },
  traps:       { ar: "الترابيس", en: "Traps" },
  abdominals:  { ar: "البطن", en: "Abs" },
  quadriceps:  { ar: "الفخذ الأمامي", en: "Quadriceps" },
  hamstrings:  { ar: "الفخذ الخلفي", en: "Hamstrings" },
  glutes:      { ar: "المؤخرة", en: "Glutes" },
  calves:      { ar: "السمانة", en: "Calves" },
};

// Equipment / variant labels
const EQUIPMENT = {
  barbell:    { ar: "بار", en: "Barbell" },
  dumbbell:   { ar: "دمبل", en: "Dumbbell" },
  cable:      { ar: "كيبل", en: "Cable" },
  machine:    { ar: "جهاز", en: "Machine" },
  smith:      { ar: "سميث", en: "Smith" },
  bodyweight: { ar: "وزن الجسم", en: "Bodyweight" },
  ez:         { ar: "بار EZ", en: "EZ bar" },
  rope:       { ar: "حبل", en: "Rope" },
  bar:        { ar: "بار مستقيم", en: "Straight bar" },
  close_grip: { ar: "قبضة ضيقة", en: "Close grip" },
  chin_up:    { ar: "عقلة عكسية", en: "Chin-up" },
  tbar:       { ar: "تي بار", en: "T-bar" },
  lying:      { ar: "منبطح", en: "Lying" },
  seated:     { ar: "جالس", en: "Seated" },
  standing:   { ar: "واقف", en: "Standing" },
};

const MOVEMENTS = {
  flat_press: {
    name: { ar: "ضغط صدر مستوي", en: "Flat Chest Press" },
    tips: {
      ar: ["ثبّت لوحي الكتف للخلف وللأسفل", "نزّل الوزن لمنتصف الصدر بتحكم", "القدمين ثابتة والمؤخرة على الكرسي"],
      en: ["Pull shoulder blades back and down", "Lower the weight to mid-chest with control", "Feet flat, glutes stay on the bench"],
    },
    variants: {
      barbell: { id: "Barbell_Bench_Press_-_Medium_Grip", primary: ["chest"], secondary: ["shoulders", "triceps"] },
      dumbbell: { id: "Dumbbell_Bench_Press", primary: ["chest"], secondary: ["shoulders", "triceps"] },
      cable: { id: "Cable_Chest_Press", primary: ["chest"], secondary: ["shoulders", "triceps"] },
      machine: { id: "Leverage_Chest_Press", primary: ["chest"], secondary: ["shoulders", "triceps"] },
      smith: { id: "Smith_Machine_Bench_Press", primary: ["chest"], secondary: ["shoulders", "triceps"] },
    },
  },
  incline_press: {
    name: { ar: "ضغط صدر مائل", en: "Incline Chest Press" },
    tips: {
      ar: ["ميلان الكرسي 30–45 درجة", "الأكواع بزاوية 45° تقريباً من الجسم", "نزّل لأعلى الصدر"],
      en: ["Bench at 30–45 degrees", "Elbows about 45° from your body", "Lower to your upper chest"],
    },
    variants: {
      barbell: { id: "Barbell_Incline_Bench_Press_-_Medium_Grip", primary: ["chest"], secondary: ["shoulders", "triceps"] },
      dumbbell: { id: "Incline_Dumbbell_Press", primary: ["chest"], secondary: ["shoulders", "triceps"] },
      cable: { id: "Incline_Cable_Chest_Press", primary: ["chest"], secondary: ["shoulders", "triceps"] },
      machine: { id: "Leverage_Incline_Chest_Press", primary: ["chest"], secondary: ["shoulders", "triceps"] },
      smith: { id: "Smith_Machine_Incline_Bench_Press", primary: ["chest"], secondary: ["shoulders", "triceps"] },
    },
  },
  chest_fly: {
    name: { ar: "تفتيح صدر", en: "Chest Fly" },
    tips: {
      ar: ["انحناءة خفيفة ثابتة في الكوع", "حركة قوس واسعة مثل ما تحضن شجرة", "اعصر الصدر لما تتقابل اليدين"],
      en: ["Keep a slight fixed bend in the elbows", "Wide arc, like hugging a tree", "Squeeze the chest when hands meet"],
    },
    variants: {
      cable: { id: "Cable_Crossover", primary: ["chest"], secondary: ["shoulders"] },
      dumbbell: { id: "Dumbbell_Flyes", primary: ["chest"], secondary: [] },
      machine: { id: "Butterfly", primary: ["chest"], secondary: [] },
    },
  },
  chest_dips: {
    name: { ar: "متوازي للصدر", en: "Chest Dips" },
    tips: {
      ar: ["مِل بجسمك للأمام", "الأكواع تطلع للجوانب شوي", "انزل لين يصير الكتف بمستوى الكوع"],
      en: ["Lean your torso forward", "Let elbows flare slightly", "Go down until shoulders reach elbow level"],
    },
    variants: {
      bodyweight: { id: "Dips_-_Chest_Version", primary: ["chest"], secondary: ["shoulders", "triceps"] },
    },
  },
  pushup: {
    name: { ar: "ضغط", en: "Push-up" },
    tips: {
      ar: ["الجسم خط مستقيم من الراس للكعب", "شد البطن والمؤخرة", "الصدر يقرب من الأرض"],
      en: ["Body in a straight line head to heels", "Brace abs and glutes", "Bring chest close to the floor"],
    },
    variants: {
      bodyweight: { id: "Pushups", primary: ["chest"], secondary: ["shoulders", "triceps"] },
    },
  },
  shoulder_press: {
    name: { ar: "ضغط أكتاف", en: "Shoulder Press" },
    tips: {
      ar: ["شد البطن ولا تقوّس ظهرك", "ابدأ الوزن بمستوى الأذن تقريباً", "ادفع لفوق بدون ما تقفل الكوع بقوة"],
      en: ["Brace your abs, don't arch your back", "Start the weight around ear level", "Press up without slamming the lockout"],
    },
    variants: {
      barbell: { id: "Standing_Military_Press", primary: ["shoulders"], secondary: ["triceps"] },
      dumbbell: { id: "Dumbbell_Shoulder_Press", primary: ["shoulders"], secondary: ["triceps"] },
      cable: { id: "Cable_Shoulder_Press", primary: ["shoulders"], secondary: ["triceps"] },
      machine: { id: "Leverage_Shoulder_Press", primary: ["shoulders"], secondary: ["triceps"] },
      smith: { id: "Smith_Machine_Overhead_Shoulder_Press", primary: ["shoulders"], secondary: ["triceps"] },
    },
  },
  lateral_raise: {
    name: { ar: "رفرفة جانبي", en: "Lateral Raise" },
    tips: {
      ar: ["ارفع لين مستوى الكتف بس", "قُد الحركة بالكوع مو باليد", "وزن خفيف بدون مرجحة"],
      en: ["Raise only to shoulder height", "Lead with the elbows, not the hands", "Light weight, no swinging"],
    },
    variants: {
      dumbbell: { id: "Side_Lateral_Raise", primary: ["shoulders"], secondary: [] },
      cable: { id: "Cable_Seated_Lateral_Raise", primary: ["shoulders"], secondary: ["middle_back", "traps"] },
    },
  },
  rear_delt: {
    name: { ar: "خلفي الكتف", en: "Rear Delt" },
    tips: {
      ar: ["اسحب بالكوع للخلف والجوانب", "اعصر لوحي الكتف ثانية", "وزن خفيف وحركة نظيفة"],
      en: ["Pull elbows back and out", "Squeeze shoulder blades for a second", "Light weight, clean reps"],
    },
    variants: {
      cable: { id: "Face_Pull", primary: ["shoulders"], secondary: ["middle_back"] },
      dumbbell: { id: "Reverse_Flyes", primary: ["shoulders"], secondary: [] },
      machine: { id: "Reverse_Machine_Flyes", primary: ["shoulders"], secondary: [] },
    },
  },
  triceps_pushdown: {
    name: { ar: "ترايسبس كيبل لتحت", en: "Triceps Pushdown" },
    tips: {
      ar: ["الأكواع ثابتة جنب الجسم", "مد الذراع كامل تحت", "لا تستخدم وزن جسمك"],
      en: ["Elbows pinned to your sides", "Fully extend at the bottom", "Don't use body weight to push"],
    },
    variants: {
      rope: { id: "Triceps_Pushdown_-_Rope_Attachment", primary: ["triceps"], secondary: [] },
      bar: { id: "Triceps_Pushdown", primary: ["triceps"], secondary: [] },
    },
  },
  overhead_triceps: {
    name: { ar: "ترايسبس فوق الراس", en: "Overhead Triceps Extension" },
    tips: {
      ar: ["الأكواع قريبة من الراس", "حس بالتمدد ورا الذراع", "مد الذراع كامل"],
      en: ["Keep elbows close to your head", "Feel the stretch behind the arm", "Fully extend the arms"],
    },
    variants: {
      cable: { id: "Cable_Rope_Overhead_Triceps_Extension", primary: ["triceps"], secondary: [] },
      dumbbell: { id: "Standing_Dumbbell_Triceps_Extension", primary: ["triceps"], secondary: [] },
      barbell: { id: "Standing_Overhead_Barbell_Triceps_Extension", primary: ["triceps"], secondary: ["shoulders"] },
    },
  },
  skullcrusher: {
    name: { ar: "سكل كراشر", en: "Skullcrusher" },
    tips: {
      ar: ["الأكواع تأشر للسقف ولا تفتح", "نزّل الوزن للجبهة أو ورا الراس", "تحكم بالنزول"],
      en: ["Elbows point to the ceiling, don't flare", "Lower to forehead or just behind", "Control the descent"],
    },
    variants: {
      ez: { id: "EZ-Bar_Skullcrusher", primary: ["triceps"], secondary: ["forearms"] },
      dumbbell: { id: "Lying_Dumbbell_Tricep_Extension", primary: ["triceps"], secondary: ["chest", "shoulders"] },
      cable: { id: "Cable_Lying_Triceps_Extension", primary: ["triceps"], secondary: [] },
    },
  },
  triceps_dips: {
    name: { ar: "متوازي للترايسبس", en: "Triceps Dips" },
    tips: {
      ar: ["الجسم مستقيم عمودي", "الأكواع للخلف قريبة من الجسم", "لا تنزل لدرجة ألم بالكتف"],
      en: ["Keep torso upright", "Elbows back, close to the body", "Don't go so deep your shoulder hurts"],
    },
    variants: {
      bodyweight: { id: "Dips_-_Triceps_Version", primary: ["triceps"], secondary: ["chest", "shoulders"] },
    },
  },
  vertical_pull: {
    name: { ar: "سحب عمودي", en: "Vertical Pull" },
    tips: {
      ar: ["ابدأ من تمدد كامل", "اسحب الأكواع لتحت باتجاه الجيوب", "الصدر لفوق بدون مرجحة"],
      en: ["Start from a full stretch", "Drive elbows down toward your pockets", "Chest up, no swinging"],
    },
    variants: {
      bodyweight: { id: "Pullups", primary: ["lats"], secondary: ["biceps", "middle_back"] },
      cable: { id: "Wide-Grip_Lat_Pulldown", primary: ["lats"], secondary: ["biceps", "middle_back", "shoulders"] },
      close_grip: { id: "Close-Grip_Front_Lat_Pulldown", primary: ["lats"], secondary: ["biceps", "middle_back", "shoulders"] },
      chin_up: { id: "Chin-Up", primary: ["lats"], secondary: ["biceps", "forearms", "middle_back"] },
    },
  },
  row: {
    name: { ar: "تجديف", en: "Row" },
    tips: {
      ar: ["الظهر مستقيم والصدر لفوق", "اسحب باتجاه البطن/الورك", "اعصر لوحي الكتف ببعض"],
      en: ["Flat back, chest up", "Pull toward your stomach/hip", "Squeeze shoulder blades together"],
    },
    variants: {
      barbell: { id: "Bent_Over_Barbell_Row", primary: ["middle_back"], secondary: ["biceps", "lats", "shoulders"] },
      dumbbell: { id: "One-Arm_Dumbbell_Row", primary: ["middle_back"], secondary: ["biceps", "lats", "shoulders"] },
      cable: { id: "Seated_Cable_Rows", primary: ["middle_back"], secondary: ["biceps", "lats", "shoulders"] },
      machine: { id: "Leverage_Iso_Row", primary: ["lats"], secondary: ["biceps", "middle_back"] },
      smith: { id: "Smith_Machine_Bent_Over_Row", primary: ["middle_back"], secondary: ["biceps", "lats", "shoulders"] },
      tbar: { id: "T-Bar_Row_with_Handle", primary: ["middle_back"], secondary: ["biceps", "lats"] },
    },
  },
  shrug: {
    name: { ar: "ترابيس", en: "Shrug" },
    tips: {
      ar: ["ارفع الكتف لفوق للأذن", "لا تلف الكتف دوائر", "ثبت ثانية فوق"],
      en: ["Lift shoulders straight up to ears", "Don't roll the shoulders", "Hold one second at the top"],
    },
    variants: {
      barbell: { id: "Barbell_Shrug", primary: ["traps"], secondary: [] },
      dumbbell: { id: "Dumbbell_Shrug", primary: ["traps"], secondary: [] },
      cable: { id: "Cable_Shrugs", primary: ["traps"], secondary: [] },
      machine: { id: "Leverage_Shrug", primary: ["traps"], secondary: ["forearms"] },
    },
  },
  deadlift: {
    name: { ar: "ديدلفت", en: "Deadlift" },
    tips: {
      ar: ["البار فوق منتصف القدم وقريب من الساق", "الظهر محايد لا تقوسه أبداً", "ادفع الأرض برجولك ومد الورك سوا"],
      en: ["Bar over mid-foot, close to shins", "Neutral spine, never round your back", "Push the floor away and extend hips together"],
    },
    variants: {
      barbell: { id: "Barbell_Deadlift", primary: ["lower_back"], secondary: ["calves", "forearms", "glutes", "hamstrings", "lats", "middle_back", "quadriceps", "traps"] },
    },
  },
  biceps_curl: {
    name: { ar: "بايسبس", en: "Biceps Curl" },
    tips: {
      ar: ["الأكواع ثابتة جنب الجسم", "لا ترجّح بظهرك", "نزّل ببطء لين تمد الذراع"],
      en: ["Elbows fixed at your sides", "Don't swing with your back", "Lower slowly to full extension"],
    },
    variants: {
      barbell: { id: "Barbell_Curl", primary: ["biceps"], secondary: ["forearms"] },
      dumbbell: { id: "Dumbbell_Bicep_Curl", primary: ["biceps"], secondary: ["forearms"] },
      ez: { id: "EZ-Bar_Curl", primary: ["biceps"], secondary: [] },
      cable: { id: "Standing_Biceps_Cable_Curl", primary: ["biceps"], secondary: [] },
      machine: { id: "Machine_Bicep_Curl", primary: ["biceps"], secondary: [] },
    },
  },
  hammer_curl: {
    name: { ar: "هامر كيرل", en: "Hammer Curl" },
    tips: {
      ar: ["الكفوف متقابلة طول الحركة", "ارفع لين الكتف تقريباً", "تحكم بالنزول"],
      en: ["Palms face each other throughout", "Curl up to about shoulder height", "Control the way down"],
    },
    variants: {
      dumbbell: { id: "Hammer_Curls", primary: ["biceps"], secondary: [] },
      rope: { id: "Cable_Hammer_Curls_-_Rope_Attachment", primary: ["biceps"], secondary: [] },
    },
  },
  incline_curl: {
    name: { ar: "بايسبس مائل", en: "Incline Curl" },
    tips: {
      ar: ["خلّ الذراع تتدلى ورا الجسم", "لا تقدّم الكوع وانت ترفع", "تمدد كامل تحت"],
      en: ["Let arms hang behind your torso", "Don't push elbows forward while curling", "Full stretch at the bottom"],
    },
    variants: {
      dumbbell: { id: "Incline_Dumbbell_Curl", primary: ["biceps"], secondary: [] },
    },
  },
  preacher_curl: {
    name: { ar: "بايسبس ارتكاز", en: "Preacher Curl" },
    tips: {
      ar: ["أعلى الذراع ملاصق للمسند", "لا تقفل الكوع بقوة تحت", "اعصر فوق"],
      en: ["Upper arm flat on the pad", "Don't hyperextend at the bottom", "Squeeze at the top"],
    },
    variants: {
      barbell: { id: "Preacher_Curl", primary: ["biceps"], secondary: [] },
      dumbbell: { id: "One_Arm_Dumbbell_Preacher_Curl", primary: ["biceps"], secondary: [] },
      cable: { id: "Cable_Preacher_Curl", primary: ["biceps"], secondary: ["forearms"] },
      machine: { id: "Machine_Preacher_Curls", primary: ["biceps"], secondary: [] },
    },
  },
  squat: {
    name: { ar: "سكوات", en: "Squat" },
    tips: {
      ar: ["الركب تمشي باتجاه أصابع القدم", "انزل لين الفخذ موازي للأرض أو أعمق", "الصدر لفوق والكعب على الأرض"],
      en: ["Knees track over your toes", "Go to parallel or deeper", "Chest up, heels down"],
    },
    variants: {
      barbell: { id: "Barbell_Squat", primary: ["quadriceps"], secondary: ["calves", "glutes", "hamstrings", "lower_back"] },
      dumbbell: { id: "Dumbbell_Squat", primary: ["quadriceps"], secondary: ["calves", "glutes", "hamstrings", "lower_back"] },
      machine: { id: "Hack_Squat", primary: ["quadriceps"], secondary: ["calves", "glutes", "hamstrings"] },
      smith: { id: "Smith_Machine_Squat", primary: ["quadriceps"], secondary: ["calves", "glutes", "hamstrings", "lower_back"] },
    },
  },
  leg_press: {
    name: { ar: "دفع أرجل", en: "Leg Press" },
    tips: {
      ar: ["أسفل الظهر ملاصق للكرسي", "لا تقفل الركبة بقوة فوق", "انزل لين ركبتك تقريباً 90°"],
      en: ["Lower back stays on the pad", "Don't hard-lock your knees", "Lower to about 90° at the knee"],
    },
    variants: {
      machine: { id: "Leg_Press", primary: ["quadriceps"], secondary: ["calves", "glutes", "hamstrings"] },
      smith: { id: "Smith_Machine_Leg_Press", primary: ["quadriceps"], secondary: ["calves", "glutes", "hamstrings"] },
    },
  },
  rdl: {
    name: { ar: "رومانيان ديدلفت", en: "Romanian Deadlift" },
    tips: {
      ar: ["ادفع الورك للخلف والركبة شبه مستقيمة", "الوزن يمشي ملاصق للفخذ", "انزل لين تحس بشد في الفخذ الخلفي"],
      en: ["Push hips back, knees soft", "Weight slides along your thighs", "Go down until hamstrings feel the stretch"],
    },
    variants: {
      barbell: { id: "Romanian_Deadlift", primary: ["hamstrings"], secondary: ["calves", "glutes", "lower_back"] },
      dumbbell: { id: "Stiff-Legged_Dumbbell_Deadlift", primary: ["hamstrings"], secondary: ["glutes", "lower_back"] },
      smith: { id: "Smith_Machine_Stiff-Legged_Deadlift", primary: ["hamstrings"], secondary: ["glutes", "lower_back"] },
    },
  },
  leg_extension: {
    name: { ar: "رفرفة أمامي", en: "Leg Extension" },
    tips: {
      ar: ["ركبتك على محور الجهاز", "اعصر ثانية فوق", "نزّل ببطء"],
      en: ["Align knees with the machine pivot", "Squeeze for a second at the top", "Lower slowly"],
    },
    variants: {
      machine: { id: "Leg_Extensions", primary: ["quadriceps"], secondary: [] },
    },
  },
  leg_curl: {
    name: { ar: "رفرفة خلفي", en: "Leg Curl" },
    tips: {
      ar: ["ثبّت الورك/الفخذ على الجهاز", "اسحب الكعب لأقصى مدى", "تحكم بالرجوع"],
      en: ["Keep hips/thighs locked on the pad", "Curl through full range", "Control the return"],
    },
    variants: {
      lying: { id: "Lying_Leg_Curls", primary: ["hamstrings"], secondary: [] },
      seated: { id: "Seated_Leg_Curl", primary: ["hamstrings"], secondary: [] },
    },
  },
  lunge: {
    name: { ar: "طعن", en: "Lunge" },
    tips: {
      ar: ["خطوة طويلة كفاية", "الركبة الخلفية تقرب من الأرض", "الجذع مستقيم"],
      en: ["Take a long enough step", "Back knee comes close to the floor", "Keep torso upright"],
    },
    variants: {
      dumbbell: { id: "Dumbbell_Lunges", primary: ["quadriceps"], secondary: ["calves", "glutes", "hamstrings"] },
      barbell: { id: "Barbell_Lunge", primary: ["quadriceps"], secondary: ["calves", "glutes", "hamstrings"] },
    },
  },
  hip_thrust: {
    name: { ar: "هيب ثرست", en: "Hip Thrust" },
    tips: {
      ar: ["أعلى الظهر على حافة الكرسي", "ادفع بالكعب واعصر المؤخرة فوق", "الذقن للداخل لا تقوس ظهرك"],
      en: ["Upper back on the bench edge", "Drive through heels, squeeze glutes at top", "Tuck chin, don't over-arch"],
    },
    variants: {
      barbell: { id: "Barbell_Hip_Thrust", primary: ["glutes"], secondary: ["calves", "hamstrings"] },
    },
  },
  calf_raise: {
    name: { ar: "سمانة", en: "Calf Raise" },
    tips: {
      ar: ["انزل لأقصى تمدد", "ارتفع على أطراف الأصابع", "ثبت ثانية فوق"],
      en: ["Drop to a full stretch", "Rise onto the balls of your feet", "Pause one second at the top"],
    },
    variants: {
      standing: { id: "Standing_Calf_Raises", primary: ["calves"], secondary: [] },
      seated: { id: "Seated_Calf_Raise", primary: ["calves"], secondary: [] },
      dumbbell: { id: "Standing_Dumbbell_Calf_Raise", primary: ["calves"], secondary: [] },
      smith: { id: "Smith_Machine_Calf_Raise", primary: ["calves"], secondary: [] },
    },
  },
  plank: {
    name: { ar: "بلانك", en: "Plank" },
    tips: {
      ar: ["الأكواع تحت الكتف", "الجسم خط مستقيم لا ترفع الورك", "تنفس بانتظام"],
      en: ["Elbows under shoulders", "Straight line, don't pike your hips", "Breathe steadily"],
    },
    variants: {
      bodyweight: { id: "Plank", primary: ["abdominals"], secondary: [] },
    },
  },
  leg_raise: {
    name: { ar: "رفع رجل معلق", en: "Hanging Leg Raise" },
    tips: {
      ar: ["لا تترجح", "لف الحوض لفوق في النهاية", "نزّل ببطء"],
      en: ["No swinging", "Curl your pelvis up at the top", "Lower slowly"],
    },
    variants: {
      bodyweight: { id: "Hanging_Leg_Raise", primary: ["abdominals"], secondary: [] },
    },
  },
  crunch: {
    name: { ar: "كرنش", en: "Crunch" },
    tips: {
      ar: ["قرّب الصدر من الحوض بلف الظهر", "الحركة من البطن مو من اليدين", "ازفر وانت تطلع"],
      en: ["Bring ribs toward pelvis by rounding your spine", "Move with abs, not arms", "Exhale on the way up"],
    },
    variants: {
      cable: { id: "Cable_Crunch", primary: ["abdominals"], secondary: [] },
      machine: { id: "Ab_Crunch_Machine", primary: ["abdominals"], secondary: [] },
      bodyweight: { id: "Crunches", primary: ["abdominals"], secondary: [] },
    },
  },
};

// Image URL of a database exercise (frame 0 = start, 1 = end)
function exerciseImage(id, frame = 0) {
  return IMAGE_BASE + id + "/" + frame + ".jpg";
}
