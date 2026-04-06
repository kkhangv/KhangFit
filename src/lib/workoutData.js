// Workout program data — 4-day split, 5-week cycles (week 5 = deload)

export const DELOAD_WEEK = 5;
export const DELOAD_WEIGHT_FACTOR = 0.6;
export const DELOAD_SETS = 2;

// ─── Day 1 — Monday: Chest + Triceps (Heavy Day) ────────────────────────────

const day1 = {
  id: 'day1',
  name: 'Chest + Triceps',
  subtitle: 'Heavy Day',
  dayOfWeek: 'Monday',
  hasPeloton: true,
  pelotonNote: 'Power Zone 30 min → 2 min rest → begin lifting',
  targetDuration: 35,
  exercises: [
    {
      id: 'incline-db-press',
      name: 'Incline Dumbbell Press',
      equipment: 'Dumbbells + Bench at 30°',
      muscleGroup: 'Upper Chest',
      cue: 'Let the DBs sink deep at the bottom — feel a full chest stretch before pressing. Do not bounce.',
      tip: '30° targets clavicular head with maximum activation. Dumbbells allow greater ROM than barbell, aligning with stretch-mediated hypertrophy research.',
      sets: [
        { setNum: 1, weight: 55, reps: '8–10', rpe: 7, rest: 120, tempo: '3/1/1', technique: null },
        { setNum: 2, weight: 60, reps: '8–10', rpe: 8, rest: 120, tempo: '3/1/1', technique: null },
        { setNum: 3, weight: 60, reps: '6–8', rpe: 9, rest: 120, tempo: '3/1/1', technique: null },
        { setNum: 4, weight: 60, reps: 'to failure', rpe: 10, rest: 0, tempo: '3/1/1', technique: 'rest-pause', techniqueNote: 'Hit failure → rack 15–20 sec → do 2–3 more reps' }
      ]
    },
    {
      id: 'flat-barbell-bench',
      name: 'Flat Barbell Bench Press',
      equipment: 'Barbell + Plates',
      muscleGroup: 'Mid/Lower Chest',
      cue: 'Full ROM — bar touches chest on every rep. Control the eccentric. Grip at ~1.5× shoulder width.',
      tip: 'Sternal head development. Control the 3-second descent for maximum mechanical tension.',
      sets: [
        { setNum: 1, weight: 175, reps: '8–10', rpe: 8, rest: 120, tempo: '3/0/1', technique: null },
        { setNum: 2, weight: 185, reps: '6–8', rpe: 9, rest: 120, tempo: '3/0/1', technique: null },
        { setNum: 3, weight: 185, reps: 'to failure', rpe: 10, rest: 0, tempo: '3/0/1', technique: 'drop-set', techniqueNote: 'Hit failure → strip to 135 lbs → continue to failure' }
      ]
    },
    {
      id: 'cable-fly',
      name: 'Cable Fly',
      equipment: 'Cable Machine (mid-height)',
      muscleGroup: 'Chest (constant tension)',
      cue: "Step slightly forward for a deeper stretch. Bring hands together and squeeze the chest hard at peak contraction. Don't let your elbows drift behind your shoulders.",
      tip: 'Cables maintain constant tension throughout full ROM (93–98% of bench press pec activation). Superior to dumbbells for consistent stimulus.',
      sets: [
        { setNum: 1, weight: null, reps: '12–15', rpe: 8, rest: 60, tempo: '2/1/2', technique: null, weightNote: 'Moderate' },
        { setNum: 2, weight: null, reps: '12–15', rpe: 9, rest: 60, tempo: '2/1/2', technique: null, weightNote: 'Moderate' },
        { setNum: 3, weight: null, reps: 'to failure', rpe: 10, rest: 0, tempo: '2/1/2', technique: 'drop-set', techniqueNote: 'Reduce ~25% → continue to failure', weightNote: 'Moderate' }
      ]
    },
    {
      id: 'cable-pushdown',
      name: 'Cable Pushdown',
      equipment: 'Cable Machine (straight bar or rope)',
      muscleGroup: 'Triceps',
      cue: 'Lock elbows at your sides. Full lockout at the bottom, slow controlled return.',
      tip: null,
      sets: [
        { setNum: 1, weight: null, reps: '10–12', rpe: 8, rest: 60, tempo: '2/0/2', technique: null, weightNote: 'Moderate' },
        { setNum: 2, weight: null, reps: '10–12', rpe: 9, rest: 60, tempo: '2/0/2', technique: null, weightNote: 'Moderate' },
        { setNum: 3, weight: null, reps: 'to failure', rpe: 10, rest: 0, tempo: '2/0/2', technique: 'drop-set', techniqueNote: 'Reduce ~25% → continue to failure', weightNote: 'Moderate' }
      ]
    },
    {
      id: 'overhead-db-tricep-ext',
      name: 'Overhead DB Tricep Extension',
      equipment: 'Single Dumbbell (both hands), Seated',
      muscleGroup: 'Triceps (long head)',
      cue: 'Seated on the bench, back supported. Deep stretch at the bottom.',
      tip: 'Overhead position maximizes tricep long head stretch — research shows ~40% greater long head hypertrophy vs. pushdown-only training (Maeo et al. 2022).',
      sets: [
        { setNum: 1, weight: 50, reps: '10–12', rpe: 8, rest: 60, tempo: '3/0/1', technique: null },
        { setNum: 2, weight: 50, reps: '10–12', rpe: 9, rest: 0, tempo: '3/0/1', technique: null }
      ]
    }
  ]
};

// ─── Day 2 — Tuesday: Back + Biceps (V-Taper Focus) ─────────────────────────

const day2 = {
  id: 'day2',
  name: 'Back + Biceps',
  subtitle: 'V-Taper Focus',
  dayOfWeek: 'Tuesday',
  hasPeloton: false,
  warmupNote: '2 min arm circles + band pull-aparts',
  targetDuration: 37,
  exercises: [
    {
      id: 'lat-pulldown',
      name: 'Cable Lat Pulldown (Wide Grip)',
      equipment: 'Cable Machine',
      muscleGroup: 'Lats (width)',
      cue: "Pull to upper chest, not behind neck. Squeeze lats at the bottom — imagine putting your elbows into your back pockets. Full stretch at the top.",
      tip: 'Wide grip maximally recruits latissimus dorsi. The V-taper builder #1.',
      sets: [
        { setNum: 1, weight: null, reps: '8–10', rpe: 7, rest: 120, tempo: '3/1/1', technique: null, weightNote: 'Heavy' },
        { setNum: 2, weight: null, reps: '8–10', rpe: 8, rest: 120, tempo: '3/1/1', technique: null, weightNote: 'Heavy' },
        { setNum: 3, weight: null, reps: '6–8', rpe: 9, rest: 120, tempo: '3/1/1', technique: null, weightNote: 'Heavy' },
        { setNum: 4, weight: null, reps: 'to failure', rpe: 10, rest: 0, tempo: '3/1/1', technique: 'drop-set', techniqueNote: 'Reduce ~25% → continue to failure', weightNote: 'Heavy' }
      ]
    },
    {
      id: 'seated-cable-row',
      name: 'Seated Cable Row',
      equipment: 'Cable Machine (close-grip or V-handle)',
      muscleGroup: 'Mid Back / Rhomboids',
      cue: "Sit tall, slight lean forward at the start for a full stretch, pull to your belly button. DO NOT round your lower back.",
      tip: 'Seated rows protect the lower back. AVOID bent-over barbell rows.',
      sets: [
        { setNum: 1, weight: null, reps: '10–12', rpe: 8, rest: 90, tempo: '2/1/1', technique: null, weightNote: 'Moderate-Heavy' },
        { setNum: 2, weight: null, reps: '10–12', rpe: 9, rest: 90, tempo: '2/1/1', technique: null, weightNote: 'Moderate-Heavy' },
        { setNum: 3, weight: null, reps: 'to failure', rpe: 10, rest: 0, tempo: '2/1/1', technique: null, weightNote: 'Moderate-Heavy' }
      ]
    },
    {
      id: 'single-arm-db-row',
      name: 'Single-Arm DB Row',
      equipment: 'Dumbbell + Bench',
      muscleGroup: 'Lats / Mid Back',
      cue: 'Knee and hand on bench supports your lower back. Pull the DB toward your hip, not your chest. Full stretch at the bottom.',
      tip: null,
      sets: [
        { setNum: 1, weight: 60, reps: '10–12', rpe: 8, rest: 60, tempo: '2/1/1', technique: null, perSide: true },
        { setNum: 2, weight: 65, reps: '8–10', rpe: 9, rest: 60, tempo: '2/1/1', technique: null, perSide: true },
        { setNum: 3, weight: 70, reps: 'to failure', rpe: 10, rest: 0, tempo: '2/1/1', technique: null, perSide: true }
      ]
    },
    {
      id: 'cable-face-pull-d2',
      name: 'Cable Face Pull',
      equipment: 'Cable Machine (rope, high pulley)',
      muscleGroup: 'Rear Delts / Rotator Cuff',
      cue: 'Pull toward your forehead, externally rotate at the end (thumbs back). Critical for shoulder health.',
      tip: 'Rear delt work is essential for shoulder health and contributes to V-taper.',
      sets: [
        { setNum: 1, weight: null, reps: '15–20', rpe: 8, rest: 60, tempo: '2/1/2', technique: null, weightNote: 'Light-Moderate' },
        { setNum: 2, weight: null, reps: '15–20', rpe: 9, rest: 0, tempo: '2/1/2', technique: null, weightNote: 'Light-Moderate' }
      ]
    },
    {
      id: 'barbell-curl',
      name: 'Barbell Curl',
      equipment: 'Barbell',
      muscleGroup: 'Biceps',
      cue: null,
      tip: null,
      sets: [
        { setNum: 1, weight: 75, reps: '8–10', rpe: 8, rest: 90, tempo: '3/0/1', technique: null },
        { setNum: 2, weight: 80, reps: '8–10', rpe: 9, rest: 90, tempo: '3/0/1', technique: null },
        { setNum: 3, weight: 80, reps: 'to failure', rpe: 10, rest: 0, tempo: '3/0/1', technique: 'drop-set', techniqueNote: 'Reduce to 55 lbs → continue to failure' }
      ]
    },
    {
      id: 'incline-db-curl',
      name: 'Incline DB Curl',
      equipment: 'Dumbbells + Bench at 45°',
      muscleGroup: 'Biceps (long head)',
      cue: 'Let arms hang fully before curling. Incline position provides a deep stretch at the start of every rep.',
      tip: 'Incline position stretches the bicep long head — maximizes the lengthened-position stimulus the research strongly supports.',
      sets: [
        { setNum: 1, weight: 25, reps: '10–12', rpe: 8, rest: 60, tempo: '3/0/1', technique: null },
        { setNum: 2, weight: 25, reps: 'to failure', rpe: 10, rest: 0, tempo: '3/0/1', technique: null }
      ]
    }
  ]
};

// ─── Day 3 — Thursday: Shoulders + Arms ─────────────────────────────────────

const day3 = {
  id: 'day3',
  name: 'Shoulders + Arms',
  subtitle: '',
  dayOfWeek: 'Thursday',
  hasPeloton: true,
  pelotonNote: 'Power Zone 30 min → 2 min rest → begin lifting',
  targetDuration: 32,
  exercises: [
    {
      id: 'seated-db-shoulder-press',
      name: 'Seated DB Shoulder Press',
      equipment: 'Dumbbells + Bench (back supported)',
      muscleGroup: 'Front/Mid Delts',
      cue: null,
      tip: 'Seated protects the lower back vs. standing. Full ROM overhead.',
      sets: [
        { setNum: 1, weight: 45, reps: '8–10', rpe: 7, rest: 120, tempo: '2/0/1', technique: null },
        { setNum: 2, weight: 50, reps: '8–10', rpe: 8, rest: 120, tempo: '2/0/1', technique: null },
        { setNum: 3, weight: 50, reps: '6–8', rpe: 9, rest: 120, tempo: '2/0/1', technique: null },
        { setNum: 4, weight: 50, reps: 'to failure', rpe: 10, rest: 0, tempo: '2/0/1', technique: 'rest-pause', techniqueNote: 'Hit failure → rack 15–20 sec → do 2–3 more reps' }
      ]
    },
    {
      id: 'cable-lateral-raise',
      name: 'Cable Lateral Raise',
      equipment: 'Cable Machine (low pulley)',
      muscleGroup: 'Side Delts',
      cue: 'Stand perpendicular to cable, handle in far hand. Raise to just above shoulder height, slight forward lean. Pinky-up slightly.',
      tip: 'Cables > dumbbells for side delts — constant tension throughout full ROM. The #1 V-taper width builder.',
      sets: [
        { setNum: 1, weight: null, reps: '12–15', rpe: 8, rest: 60, tempo: '2/1/2', technique: null, weightNote: 'Light' },
        { setNum: 2, weight: null, reps: '12–15', rpe: 9, rest: 60, tempo: '2/1/2', technique: null, weightNote: 'Light' },
        { setNum: 3, weight: null, reps: 'to failure', rpe: 10, rest: 0, tempo: '2/1/2', technique: 'drop-set', techniqueNote: 'Reduce ~25% → continue to failure', weightNote: 'Light' }
      ]
    },
    {
      id: 'cable-face-pull-d3',
      name: 'Cable Face Pull',
      equipment: 'Cable Machine (rope, high pulley)',
      muscleGroup: 'Rear Delts',
      cue: 'Pull toward your forehead, externally rotate at the end (thumbs back).',
      tip: null,
      sets: [
        { setNum: 1, weight: null, reps: '15–20', rpe: 8, rest: 60, tempo: '2/1/2', technique: null, weightNote: 'Light-Moderate' },
        { setNum: 2, weight: null, reps: '15–20', rpe: 9, rest: 0, tempo: '2/1/2', technique: null, weightNote: 'Light-Moderate' }
      ]
    },
    {
      id: 'hammer-curl-superset',
      name: 'DB Hammer Curl',
      equipment: 'Dumbbells',
      muscleGroup: 'Biceps (brachialis)',
      cue: null,
      tip: null,
      supersetWith: 'oh-cable-tricep-ext',
      sets: [
        { setNum: 1, weight: 30, reps: '10–12', rpe: 8, rest: 0, tempo: null, technique: 'superset' },
        { setNum: 2, weight: 35, reps: '8–10', rpe: 9, rest: 0, tempo: null, technique: 'superset' },
        { setNum: 3, weight: 35, reps: 'to failure', rpe: 10, rest: 0, tempo: null, technique: 'superset' }
      ]
    },
    {
      id: 'oh-cable-tricep-ext',
      name: 'Overhead Cable Tricep Extension',
      equipment: 'Cable Machine',
      muscleGroup: 'Triceps (long head)',
      cue: 'Face away from cable, arms overhead, deep stretch at the bottom.',
      tip: 'Overhead position targets tricep long head for maximum growth.',
      supersetWith: 'hammer-curl-superset',
      sets: [
        { setNum: 1, weight: null, reps: '10–12', rpe: 8, rest: 90, tempo: null, technique: 'superset', weightNote: 'Moderate' },
        { setNum: 2, weight: null, reps: '10–12', rpe: 9, rest: 90, tempo: null, technique: 'superset', weightNote: 'Moderate' },
        { setNum: 3, weight: null, reps: 'to failure', rpe: 10, rest: 0, tempo: null, technique: 'drop-set', techniqueNote: 'Reduce ~25% → continue to failure', weightNote: 'Moderate' }
      ]
    },
    {
      id: 'cable-crunch',
      name: 'Cable Crunch (Kneeling)',
      equipment: 'Cable Machine',
      muscleGroup: 'Abs',
      cue: "Round your spine and pull your elbows toward your knees. Don't just hip-hinge.",
      tip: null,
      sets: [
        { setNum: 1, weight: null, reps: '15–20', rpe: 8, rest: 60, tempo: '2/1/1', technique: null, weightNote: 'Moderate' },
        { setNum: 2, weight: null, reps: '15–20', rpe: 9, rest: 60, tempo: '2/1/1', technique: null, weightNote: 'Moderate' },
        { setNum: 3, weight: null, reps: 'to failure', rpe: 10, rest: 0, tempo: '2/1/1', technique: null, weightNote: 'Moderate' }
      ]
    }
  ]
};

// ─── Day 4 — Saturday: Chest + Back (Volume Day) ─────────────────────────────

const day4 = {
  id: 'day4',
  name: 'Chest + Back',
  subtitle: 'Volume / Hypertrophy Day',
  dayOfWeek: 'Saturday',
  hasPeloton: false,
  warmupNote: '2 min light cable flies + pull-aparts',
  targetDuration: 30,
  exercises: [
    {
      id: 'flat-db-press-d4',
      name: 'Flat DB Press',
      equipment: 'Dumbbells',
      muscleGroup: 'Mid/Lower Chest',
      cue: null,
      tip: null,
      supersetWith: 'seated-cable-row-d4',
      sets: [
        { setNum: 1, weight: 60, reps: '10–12', rpe: 8, rest: 0, tempo: null, technique: 'superset' },
        { setNum: 2, weight: 65, reps: '8–10', rpe: 9, rest: 0, tempo: null, technique: 'superset' },
        { setNum: 3, weight: 65, reps: 'to failure', rpe: 10, rest: 0, tempo: null, technique: 'drop-set+superset', techniqueNote: 'Drop to 45 lbs → to failure' }
      ]
    },
    {
      id: 'seated-cable-row-d4',
      name: 'Seated Cable Row',
      equipment: 'Cable Machine',
      muscleGroup: 'Mid Back',
      cue: null,
      tip: null,
      supersetWith: 'flat-db-press-d4',
      sets: [
        { setNum: 1, weight: null, reps: '10–12', rpe: 8, rest: 90, tempo: null, technique: 'superset', weightNote: 'Moderate-Heavy' },
        { setNum: 2, weight: null, reps: '10–12', rpe: 9, rest: 90, tempo: null, technique: 'superset', weightNote: 'Moderate-Heavy' },
        { setNum: 3, weight: null, reps: 'to failure', rpe: 10, rest: 90, tempo: null, technique: 'superset', weightNote: 'Moderate-Heavy' }
      ]
    },
    {
      id: 'incline-db-press-d4',
      name: 'Incline DB Press (30°)',
      equipment: 'Dumbbells + Bench at 30°',
      muscleGroup: 'Upper Chest',
      cue: null,
      tip: null,
      supersetWith: 'lat-pulldown-d4',
      sets: [
        { setNum: 1, weight: 50, reps: '10–12', rpe: 8, rest: 0, tempo: null, technique: 'superset' },
        { setNum: 2, weight: 55, reps: '8–10', rpe: 9, rest: 0, tempo: null, technique: 'superset' },
        { setNum: 3, weight: 55, reps: 'to failure', rpe: 10, rest: 0, tempo: null, technique: 'superset' }
      ]
    },
    {
      id: 'lat-pulldown-d4',
      name: 'Cable Lat Pulldown',
      equipment: 'Cable Machine',
      muscleGroup: 'Lats',
      cue: null,
      tip: null,
      supersetWith: 'incline-db-press-d4',
      sets: [
        { setNum: 1, weight: null, reps: '10–12', rpe: 8, rest: 90, tempo: null, technique: 'superset', weightNote: 'Moderate' },
        { setNum: 2, weight: null, reps: '10–12', rpe: 9, rest: 90, tempo: null, technique: 'superset', weightNote: 'Moderate' },
        { setNum: 3, weight: null, reps: 'to failure', rpe: 10, rest: 0, tempo: null, technique: 'drop-set+superset', techniqueNote: 'Drop ~25% → continue to failure', weightNote: 'Moderate' }
      ]
    },
    {
      id: 'low-to-high-cable-fly',
      name: 'Low-to-High Cable Fly',
      equipment: 'Cable Machine (low pulleys)',
      muscleGroup: 'Upper Chest (finisher)',
      cue: null,
      tip: 'Low-to-high angle preferentially targets the clavicular head for upper chest sweep.',
      sets: [
        { setNum: 1, weight: null, reps: '15–20', rpe: 8, rest: 60, tempo: '2/1/2', technique: null, weightNote: 'Light' },
        { setNum: 2, weight: null, reps: 'to failure', rpe: 10, rest: 0, tempo: '2/1/2', technique: 'drop-set', techniqueNote: 'Reduce ~25% → continue to failure', weightNote: 'Light' }
      ]
    },
    {
      id: 'hanging-knee-raise',
      name: 'Hanging Knee Raise',
      equipment: 'Pull-up bar (or lying on floor)',
      muscleGroup: 'Abs',
      cue: null,
      tip: null,
      sets: [
        { setNum: 1, weight: null, reps: '12–15', rpe: 8, rest: 60, tempo: null, technique: null },
        { setNum: 2, weight: null, reps: 'to failure', rpe: 10, rest: 60, tempo: null, technique: null }
      ]
    },
    {
      id: 'cable-woodchop',
      name: 'Cable Woodchop',
      equipment: 'Cable Machine',
      muscleGroup: 'Obliques',
      cue: null,
      tip: 'Works obliques for waist definition. Protects lower back vs. rotational movements.',
      sets: [
        { setNum: 1, weight: null, reps: '12–15', rpe: 8, rest: 60, tempo: null, technique: null, perSide: true, weightNote: 'Moderate' },
        { setNum: 2, weight: null, reps: 'to failure', rpe: 10, rest: 0, tempo: null, technique: null, perSide: true, weightNote: 'Moderate' }
      ]
    }
  ]
};

// ─── Program export ──────────────────────────────────────────────────────────

export const workoutProgram = [day1, day2, day3, day4];

export { day1, day2, day3, day4 };

/**
 * Look up a day by its id (e.g. 'day1', 'day2', 'day3', 'day4').
 * Returns undefined if not found.
 */
export function getDay(id) {
  return workoutProgram.find((d) => d.id === id);
}

// ─── Weekly volume summary ───────────────────────────────────────────────────

export const weeklyVolume = {
  chest:     { weekly: 18, target: '12–20', status: 'optimal' },
  back:      { weekly: 16, target: '12–20', status: 'optimal' },
  sideDelts: { weekly: 9,  target: '8–14',  status: 'good' },
  rearDelts: { weekly: 4,  target: '4–8',   status: 'good' },
  biceps:    { weekly: 10, target: '8–14',  status: 'good' },
  triceps:   { weekly: 11, target: '8–14',  status: 'good' },
  abs:       { weekly: 7,  target: '6–10',  status: 'good' }
};
