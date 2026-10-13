// Technique videos (YouTube video ids). All from ScottHermanFitness "How To" tutorials,
// checked to exist and allow embedding.
//
// Lookup order:  "movement.equipment"  →  "movement"  →  no video (the page shows a YouTube search button)
// To add a video: copy the id from the YouTube link (watch?v=THIS_PART) and add one line.
const VIDEOS = {
  // ----- Push -----
  flat_press: "rT7DgCr-3pg",            // How To: Barbell Bench Press
  incline_press: "8iPEnn-ltC8",         // How To: Dumbbell Incline Chest Press
  shoulder_press: "qEwKCR5JCog",        // How To: Dumbbell Shoulder Press
  lateral_raise: "3VcKaXpzqRo",         // How To: Dumbbell Side Lateral Raise
  triceps_pushdown: "vB5OHsJ3EME",      // How To: Rope Push-Down
  overhead_triceps: "fYqswDVbJDg",      // How To: Overhead Triceps Extension
  skullcrusher: "d_KZxkY_0cM",          // How To: Skull Crushers

  // ----- Pull -----
  vertical_pull: "ylVmNQlKdAI",         // How To: Pull Up
  "vertical_pull.cable": "CAwf7n6Luuc", // How To: Lat Pulldown
  row: "9efgcAjQe7E",                   // How To: Barbell Bent-Over Row
  "row.cable": "GZbfZ033f74",           // How To: Seated Low Row
  "row.dumbbell": "KRN38chlkds",        // How To: Dumbbell Single-Arm Row (On Bench)
  rear_delt: "rep-qVOkqgk",             // How To: Face Pull
  biceps_curl: "LY1V6UbRHFM",           // How To: Straight-Bar Bicep Curl
  hammer_curl: "zC3nLlEvin4",           // How To: Dumbbell Hammer Curl
  incline_curl: "soxrZlIl35U",          // How To: Seated Incline Dumbbell Bicep Curl

  // ----- Legs -----
  squat: "SW_C1A-rejs",                 // How To: Deep Barbell Back Squat
  deadlift: "n454SpMZRt8",              // How To Deadlift Safely
  rdl: "JCXUYuzwNrM",                   // How To: Romanian Deadlift (Barbell)
  leg_press: "oujca3_Shgw",             // How To: Leg Press
  leg_curl: "1Tq3QdYUuHs",              // How To: Prone (lying) Leg Curl
  "leg_curl.seated": "ELOCsoDSmrg",     // How To: Seated Leg Curl
  leg_extension: "YyvSfVjQeL0",         // How To: Leg Extension
  lunge: "D7KaRcUTQeE",                 // How To: Dumbbell Stepping Lunge
  calf_raise: "YMmgqO8Jo-k",            // How To: Standing Calf

  // ----- Abs -----
  leg_raise: "hdng3Nm1x_E",             // How To: Hanging Leg-Lift
};

// Returns the video id for a movement + equipment, or null if we have none yet
function findVideo(movementKey, equip) {
  return VIDEOS[movementKey + "." + equip] || VIDEOS[movementKey] || null;
}
