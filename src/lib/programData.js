// ─── Workout Programs & Exercise Database ────────────────────────────────────
//
// Structured for insertion into Upstash Redis (or any KV / document store).
//
// Key conventions (mirrors storage.js):
//   program:<id>              → single program metadata object
//   program:<id>:days         → array of day objects for that program
//   exercises:<id>            → single exercise object
//   exercises:index           → array of all exercise ids
//   programs:index            → array of all program ids
//
// All objects are plain JSON -- no classes, no functions -- so they can be
// serialised with JSON.stringify() and dropped straight into kv.set().
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 -- PROGRAM METADATA
// ═══════════════════════════════════════════════════════════════════════════════

export const programs = [

  // ── 1. 4-Day Hypertrophy (Chest Focus) -- existing program ─────────────────
  {
    id: 'chest-focus-4day',
    name: '4-Day Hypertrophy (Chest Focus)',
    shortName: 'Chest Focus',
    description:
      'A 4-day push/pull split built around chest twice a week with dedicated arm volume. ' +
      'Heavy compound days early in the week; a high-volume superset day on Saturday for metabolic ' +
      'stimulus and extra chest/back frequency.',
    goal: 'Hypertrophy -- chest specialisation',
    bestFor: 'Intermediate-to-advanced lifters prioritising chest development while maintaining full-body balance.',
    frequency: 4,
    daysPerWeek: [1, 2, 4, 6], // 0=Sun … 6=Sat
    cycleLengthWeeks: 5,
    deloadWeek: 5,
    deloadWeightFactor: 0.6,
    deloadSets: 2,
    difficulty: 'advanced',
    lowerBackFriendly: true,
    lowerBackNotes:
      'Bent-over rows replaced with seated cable rows and supported DB rows. ' +
      'Deadlifts absent. Seated shoulder press eliminates spinal loading.',
    weeklyVolumeSummary: {
      chest: { sets: 18, target: '12-20', status: 'optimal' },
      back: { sets: 16, target: '12-20', status: 'optimal' },
      sideDelts: { sets: 9, target: '8-14', status: 'good' },
      rearDelts: { sets: 4, target: '4-8', status: 'good' },
      biceps: { sets: 10, target: '8-14', status: 'good' },
      triceps: { sets: 11, target: '8-14', status: 'good' },
      legs: { sets: 0, target: '12-20', status: 'none -- add if desired' },
      abs: { sets: 7, target: '6-10', status: 'good' }
    },
    pros: [
      'High chest frequency (2×/week) accelerates chest development',
      'Superset Saturday compresses volume into a shorter session',
      'Lower-back-friendly exercise selection throughout',
      'Intensity techniques (drop sets, rest-pause) drive adaptation'
    ],
    cons: [
      'Zero dedicated leg volume -- requires separate leg days or substitution',
      'High intensity techniques demand solid recovery',
      'Chest-bias means other groups receive maintenance volume only'
    ],
    equipment: ['Dumbbells (up to 70 lbs)', 'Barbell + plates', 'Cable machine', 'Adjustable bench', 'Pull-up bar'],
    tags: ['hypertrophy', 'chest', 'push-pull', '4-day', 'advanced']
  },

  // ── 2. Push / Pull / Legs (PPL) -- 4-day condensed ─────────────────────────
  {
    id: 'ppl-4day',
    name: 'Push / Pull / Legs -- 4-Day',
    shortName: 'PPL 4-Day',
    description:
      'Classic Push/Pull/Legs condensed from the standard 6-day version into 4 sessions. ' +
      'Week A: Push A → Pull A → Legs → Push B. Week B: Pull B → Legs → Push A → Pull A (rotating). ' +
      'Each muscle group hits ~2× per week on a two-week rolling cycle. ' +
      'Push days emphasise chest/shoulders/triceps; pull days hit back/biceps/rear delts; ' +
      'leg day covers quads, hamstrings, glutes, and calves.',
    goal: 'Mass building -- balanced hypertrophy across all major groups',
    bestFor:
      'Intermediate-to-advanced lifters who want a complete physique program with manageable frequency. ' +
      'Ideal for adding lean muscle mass.',
    frequency: 4,
    daysPerWeek: [1, 2, 4, 6], // Mon / Tue / Thu / Sat (default rotation)
    cycleLengthWeeks: 5,
    deloadWeek: 5,
    deloadWeightFactor: 0.6,
    deloadSets: 2,
    difficulty: 'intermediate-advanced',
    lowerBackFriendly: true,
    lowerBackNotes:
      'Conventional deadlifts replaced with Romanian deadlifts (lighter, hip-hinge focus) or ' +
      'leg press. Bent-over rows replaced with cable rows and chest-supported rows. ' +
      'Back squats can be swapped for goblet squats or hack squats.',
    weeklyVolumeSummary: {
      chest: { sets: 14, target: '12-20', status: 'optimal' },
      back: { sets: 16, target: '12-20', status: 'optimal' },
      shoulders: { sets: 12, target: '10-16', status: 'optimal' },
      biceps: { sets: 10, target: '8-14', status: 'good' },
      triceps: { sets: 10, target: '8-14', status: 'good' },
      quads: { sets: 10, target: '12-20', status: 'moderate -- increase if prioritising legs' },
      hamstrings: { sets: 8, target: '10-16', status: 'moderate' },
      glutes: { sets: 6, target: '8-16', status: 'moderate' },
      calves: { sets: 6, target: '8-16', status: 'moderate' }
    },
    pros: [
      'Natural groupings minimise inter-session fatigue (push muscles fresh on push day)',
      'Easy to add a 5th or 6th day if schedule allows',
      'Well-researched -- extensive community data on progression',
      'Highly scalable: add sets or days as recovery improves'
    ],
    cons: [
      'Legs only 1-1.5× per week in 4-day version (vs 2× in full PPL)',
      'Long leg sessions (45-60 min) if squats, RDLs, and accessories all included',
      'Less specialisation than a chest-focus or arm-focus split'
    ],
    equipment: ['Dumbbells (up to 70 lbs)', 'Barbell + plates', 'Cable machine', 'Adjustable bench', 'Pull-up bar'],
    tags: ['hypertrophy', 'mass', 'ppl', '4-day', 'intermediate', 'advanced']
  },

  // ── 3. Upper / Lower Split -- 4-day ────────────────────────────────────────
  {
    id: 'upper-lower-4day',
    name: 'Upper / Lower Split -- 4-Day',
    shortName: 'Upper / Lower',
    description:
      'Classic 4-day upper/lower periodised split. Upper A and Lower A are strength-focused ' +
      '(3-6 reps, heavy compounds); Upper B and Lower B are hypertrophy-focused (8-15 reps, ' +
      'moderate load, more volume). Each muscle group trained 2× per week. ' +
      'Lower body days deliberately avoid heavy axial spinal loading (no conventional deadlifts, ' +
      'no heavy barbell squats) -- substituted with hip-hinge patterns, leg press, and unilateral work.',
    goal: 'Balanced strength + hypertrophy -- concurrent periodisation',
    bestFor:
      'Advanced lifters with lower back issues who still want to train heavy. ' +
      'Also excellent for natural athletes following a strength-hypertrophy block structure.',
    frequency: 4,
    daysPerWeek: [1, 2, 4, 6], // Mon / Tue / Thu / Sat
    cycleLengthWeeks: 5,
    deloadWeek: 5,
    deloadWeightFactor: 0.6,
    deloadSets: 2,
    difficulty: 'intermediate-advanced',
    lowerBackFriendly: true,
    lowerBackNotes:
      'Designed specifically with lower back safety in mind. Conventional deadlifts replaced by ' +
      'Romanian deadlifts and cable pull-throughs. Barbell back squats replaced by goblet squats, ' +
      'Bulgarian split squats, or leg press. No heavy axial loading on the spine. ' +
      'Core work focuses on anti-extension and anti-rotation patterns.',
    weeklyVolumeSummary: {
      chest: { sets: 14, target: '12-20', status: 'optimal' },
      back: { sets: 16, target: '12-20', status: 'optimal' },
      shoulders: { sets: 10, target: '10-16', status: 'good' },
      biceps: { sets: 8, target: '8-14', status: 'good' },
      triceps: { sets: 8, target: '8-14', status: 'good' },
      quads: { sets: 12, target: '12-20', status: 'optimal' },
      hamstrings: { sets: 10, target: '10-16', status: 'good' },
      glutes: { sets: 8, target: '8-16', status: 'good' },
      calves: { sets: 6, target: '8-16', status: 'moderate' }
    },
    pros: [
      'Trains each muscle group twice a week -- optimal frequency for most advanced lifters',
      'Strength + hypertrophy periodisation in one program',
      'Lower back-friendly by design -- no heavy axial loading',
      'Easy to autoregulate: swap heavy day to hypertrophy day if feeling beat up'
    ],
    cons: [
      'Requires more planning to execute heavy compound movements safely without machines',
      'Lower A strength day may feel limited without barbell squat / deadlift',
      'Less chest specialisation than Chest Focus split'
    ],
    equipment: ['Dumbbells (up to 70 lbs)', 'Barbell + plates', 'Cable machine', 'Adjustable bench', 'Pull-up bar'],
    tags: ['strength', 'hypertrophy', 'upper-lower', '4-day', 'lower-back-friendly', 'advanced']
  },

  // ── 4. Arnold Split -- 4-day condensed ─────────────────────────────────────
  {
    id: 'arnold-4day',
    name: 'Arnold Split -- 4-Day',
    shortName: 'Arnold Split',
    description:
      'The Arnold Split trains chest+back, shoulders+arms, and legs twice per week in a 6-session ' +
      'original format. This 4-day adaptation runs the sessions in a rolling A/B/C pattern: ' +
      'Day 1 = Chest + Back A, Day 2 = Shoulders + Arms A, Day 3 = Legs, Day 4 = Chest + Back B. ' +
      'Week 2 picks up at Shoulders + Arms B. The hallmark is training opposing muscles (chest and back) ' +
      'together, creating maximum blood flow and the "pump" Schwarzenegger famously valued.',
    goal: 'Hypertrophy -- classic bodybuilding aesthetic development',
    bestFor:
      'Advanced bodybuilding-style lifters who want high volume, enjoy the pump, ' +
      'and can recover from intense sessions. Less suitable for strength-sport athletes.',
    frequency: 4,
    daysPerWeek: [1, 2, 4, 6],
    cycleLengthWeeks: 5,
    deloadWeek: 5,
    deloadWeightFactor: 0.6,
    deloadSets: 2,
    difficulty: 'advanced',
    lowerBackFriendly: false,
    lowerBackNotes:
      'Original Arnold split includes heavy bent-over rows and barbell squats/deadlifts. ' +
      'Lower-back-friendly adaptation: replace bent-over rows with chest-supported rows or cable rows; ' +
      'replace conventional deadlifts with Romanian deadlifts or leg press; ' +
      'seated presses instead of standing overhead press.',
    weeklyVolumeSummary: {
      chest: { sets: 16, target: '12-20', status: 'optimal' },
      back: { sets: 16, target: '12-20', status: 'optimal' },
      shoulders: { sets: 12, target: '10-16', status: 'optimal' },
      biceps: { sets: 12, target: '8-14', status: 'high' },
      triceps: { sets: 12, target: '8-14', status: 'high' },
      quads: { sets: 10, target: '12-20', status: 'moderate' },
      hamstrings: { sets: 8, target: '10-16', status: 'moderate' },
      calves: { sets: 6, target: '8-16', status: 'moderate' }
    },
    pros: [
      'Training chest and back together creates maximum pump and time efficiency',
      'Very high arm volume -- excellent for arm hypertrophy',
      'Classic bodybuilding structure with proven aesthetic results',
      'Supersets between opposing muscle groups allow more volume in less time'
    ],
    cons: [
      'High overall volume -- requires excellent recovery and nutrition',
      'Less strength-focused -- not ideal for strength athletes',
      'Legs only get 1 dedicated day in 4-day version',
      'Original version not lower-back-friendly without modifications'
    ],
    equipment: ['Dumbbells (up to 70 lbs)', 'Barbell + plates', 'Cable machine', 'Adjustable bench', 'Pull-up bar'],
    tags: ['hypertrophy', 'bodybuilding', 'arnold', '4-day', 'advanced', 'chest-back']
  },

  // ── 5. Full Body -- 3-4 days ────────────────────────────────────────────────
  {
    id: 'full-body-4day',
    name: 'Full Body -- 4-Day',
    shortName: 'Full Body',
    description:
      'Each session trains all major muscle groups with 1-2 compound movements and 1 isolation ' +
      'per group. Volume per muscle per session is low (2-3 working sets), but frequency is high ' +
      '(3-4×/week). Sessions rotate A and B patterns to vary movement selection and avoid staleness. ' +
      'Excellent for maintaining muscle during a caloric deficit or for lifters with limited time per session.',
    goal: 'Muscle maintenance during cut / general fitness / re-sensitisation after a specialisation block',
    bestFor:
      'Advanced lifters in a cutting phase, time-constrained lifters (45 min sessions), ' +
      'or anyone transitioning between higher-volume blocks.',
    frequency: 4,
    daysPerWeek: [1, 2, 4, 6],
    cycleLengthWeeks: 5,
    deloadWeek: 5,
    deloadWeightFactor: 0.6,
    deloadSets: 2,
    difficulty: 'beginner-advanced',
    lowerBackFriendly: true,
    lowerBackNotes:
      'Hip-hinge patterns use Romanian deadlifts and cable pull-throughs only. ' +
      'Squatting patterns use goblet squats or Bulgarian split squats. ' +
      'All pressing done seated or with back support when possible.',
    weeklyVolumeSummary: {
      chest: { sets: 10, target: '10-20', status: 'maintenance' },
      back: { sets: 10, target: '10-20', status: 'maintenance' },
      shoulders: { sets: 8, target: '8-16', status: 'maintenance' },
      biceps: { sets: 6, target: '6-12', status: 'maintenance' },
      triceps: { sets: 6, target: '6-12', status: 'maintenance' },
      quads: { sets: 8, target: '8-16', status: 'maintenance' },
      hamstrings: { sets: 6, target: '6-12', status: 'maintenance' },
      glutes: { sets: 6, target: '6-12', status: 'maintenance' }
    },
    pros: [
      'High frequency keeps muscle protein synthesis elevated throughout the week',
      'Short sessions (40-50 min) -- sustainable for busy schedules',
      'Good for cuts: preserves muscle with lower volume and higher frequency',
      'Easy to scale down further on deload or injury weeks'
    ],
    cons: [
      'Per-session volume too low to drive maximal hypertrophy in advanced lifters',
      'Less specialisation -- hard to prioritise a lagging muscle group',
      'Sessions can feel repetitive due to full-body nature every time'
    ],
    equipment: ['Dumbbells (up to 70 lbs)', 'Barbell + plates', 'Cable machine', 'Adjustable bench', 'Pull-up bar'],
    tags: ['full-body', 'cut', 'maintenance', '4-day', 'beginner', 'intermediate', 'advanced']
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 -- PROGRAM DAYS (one array per program)
// ═══════════════════════════════════════════════════════════════════════════════

// ── Program 1: 4-Day Hypertrophy (Chest Focus) ──────────────────────────────
// Already implemented in workoutData.js -- kept here as the canonical DB record.

export const chestFocus4DayDays = [
  {
    id: 'chest-focus-4day:day1',
    programId: 'chest-focus-4day',
    dayIndex: 1,
    name: 'Chest + Triceps',
    subtitle: 'Heavy Day',
    dayOfWeek: 'Monday',
    focusMuscles: ['chest', 'triceps'],
    repRange: '6-10 (strength-hypertrophy)',
    intensityTechniques: ['rest-pause', 'drop-set'],
    targetSets: 16,
    targetDurationMin: 35,
    hasPeloton: true,
    pelotonNote: 'Power Zone 30 min → 2 min rest → begin lifting',
    exerciseIds: [
      'incline-db-press',
      'flat-barbell-bench',
      'cable-fly',
      'cable-pushdown',
      'overhead-db-tricep-ext'
    ]
  },
  {
    id: 'chest-focus-4day:day2',
    programId: 'chest-focus-4day',
    dayIndex: 2,
    name: 'Back + Biceps',
    subtitle: 'V-Taper Focus',
    dayOfWeek: 'Tuesday',
    focusMuscles: ['lats', 'mid-back', 'rear-delts', 'biceps'],
    repRange: '8-12',
    intensityTechniques: ['drop-set'],
    targetSets: 16,
    targetDurationMin: 37,
    hasPeloton: false,
    warmupNote: '2 min arm circles + band pull-aparts',
    exerciseIds: [
      'cable-lat-pulldown-wide',
      'seated-cable-row',
      'single-arm-db-row',
      'cable-face-pull',
      'barbell-curl',
      'incline-db-curl'
    ]
  },
  {
    id: 'chest-focus-4day:day3',
    programId: 'chest-focus-4day',
    dayIndex: 3,
    name: 'Shoulders + Arms',
    subtitle: '',
    dayOfWeek: 'Thursday',
    focusMuscles: ['front-delts', 'side-delts', 'rear-delts', 'biceps', 'triceps', 'abs'],
    repRange: '8-15',
    intensityTechniques: ['rest-pause', 'drop-set', 'superset'],
    targetSets: 16,
    targetDurationMin: 32,
    hasPeloton: true,
    pelotonNote: 'Power Zone 30 min → 2 min rest → begin lifting',
    exerciseIds: [
      'seated-db-shoulder-press',
      'cable-lateral-raise',
      'cable-face-pull',
      'db-hammer-curl',
      'overhead-cable-tricep-ext',
      'cable-crunch'
    ]
  },
  {
    id: 'chest-focus-4day:day4',
    programId: 'chest-focus-4day',
    dayIndex: 4,
    name: 'Chest + Back',
    subtitle: 'Volume / Hypertrophy Day',
    dayOfWeek: 'Saturday',
    focusMuscles: ['chest', 'lats', 'mid-back', 'abs', 'obliques'],
    repRange: '10-20 (volume)',
    intensityTechniques: ['superset', 'drop-set'],
    targetSets: 18,
    targetDurationMin: 30,
    hasPeloton: false,
    warmupNote: '2 min light cable flies + pull-aparts',
    exerciseIds: [
      'flat-db-press',
      'seated-cable-row',
      'incline-db-press',
      'cable-lat-pulldown-wide',
      'low-to-high-cable-fly',
      'hanging-knee-raise',
      'cable-woodchop'
    ]
  }
];

// ── Program 2: PPL 4-Day ─────────────────────────────────────────────────────

export const ppl4DayDays = [
  {
    id: 'ppl-4day:push-a',
    programId: 'ppl-4day',
    dayIndex: 1,
    name: 'Push A',
    subtitle: 'Chest + Shoulders + Triceps (Strength Focus)',
    dayOfWeek: 'Monday',
    focusMuscles: ['chest', 'front-delts', 'side-delts', 'triceps'],
    repRange: '5-8 (strength emphasis)',
    intensityTechniques: ['progressive-overload'],
    targetSets: 15,
    targetDurationMin: 50,
    notes:
      'Week A opener. Heavy compound first, then accessory volume. ' +
      'Push A prioritises flat barbell press and heavy overhead press.',
    exerciseIds: [
      'flat-barbell-bench',
      'seated-db-shoulder-press',
      'incline-db-press',
      'cable-lateral-raise',
      'cable-pushdown',
      'overhead-db-tricep-ext'
    ],
    exerciseNotes: {
      'flat-barbell-bench': '4×5 @ RPE 8 -- add 2.5 lbs each session',
      'seated-db-shoulder-press': '3×6-8 @ RPE 8',
      'incline-db-press': '3×8-10',
      'cable-lateral-raise': '3×12-15',
      'cable-pushdown': '3×10-12',
      'overhead-db-tricep-ext': '2×10-12'
    }
  },
  {
    id: 'ppl-4day:pull-a',
    programId: 'ppl-4day',
    dayIndex: 2,
    name: 'Pull A',
    subtitle: 'Back + Biceps (Strength Focus)',
    dayOfWeek: 'Tuesday',
    focusMuscles: ['lats', 'mid-back', 'rear-delts', 'biceps', 'brachialis'],
    repRange: '5-8 (strength emphasis)',
    intensityTechniques: ['progressive-overload'],
    targetSets: 15,
    targetDurationMin: 50,
    notes:
      'Heavy weighted pull-ups anchor this session. Cable lat pulldown as secondary lat builder. ' +
      'Seated cable row protects the lower back while building mid-back thickness.',
    exerciseIds: [
      'weighted-pull-up',
      'seated-cable-row',
      'cable-lat-pulldown-wide',
      'single-arm-db-row',
      'cable-face-pull',
      'barbell-curl',
      'incline-db-curl'
    ],
    exerciseNotes: {
      'weighted-pull-up': '4×4-6 @ RPE 8 -- use dumbbell between feet or belt if available',
      'seated-cable-row': '3×6-8 heavy',
      'cable-lat-pulldown-wide': '3×8-10',
      'single-arm-db-row': '3×8-10 per side',
      'cable-face-pull': '2×15-20',
      'barbell-curl': '3×6-8 heavy',
      'incline-db-curl': '2×10-12'
    }
  },
  {
    id: 'ppl-4day:legs',
    programId: 'ppl-4day',
    dayIndex: 3,
    name: 'Legs',
    subtitle: 'Quads + Hamstrings + Glutes + Calves',
    dayOfWeek: 'Thursday',
    focusMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
    repRange: '6-15 (mixed)',
    intensityTechniques: ['progressive-overload', 'superset'],
    targetSets: 18,
    targetDurationMin: 55,
    notes:
      'Lower-back-friendly leg day. Goblet squats or Bulgarian split squats replace barbell back squats. ' +
      'Romanian deadlifts replace conventional deadlifts -- hip hinge with neutral spine throughout.',
    exerciseIds: [
      'goblet-squat',
      'bulgarian-split-squat',
      'romanian-deadlift',
      'cable-pull-through',
      'nordic-hamstring-curl',
      'standing-calf-raise',
      'cable-woodchop'
    ],
    exerciseNotes: {
      'goblet-squat': '4×8-10 -- heaviest DB available, controlled descent',
      'bulgarian-split-squat': '3×10-12 per leg @ RPE 8',
      'romanian-deadlift': '3×8-10 -- hinge at hips, slight knee bend, neutral spine',
      'cable-pull-through': '3×12-15 -- glute driver, keeps spine neutral',
      'nordic-hamstring-curl': '3×6-8 -- eccentric focus if unable to do full concentric',
      'standing-calf-raise': '4×15-20',
      'cable-woodchop': '2×12-15 per side'
    }
  },
  {
    id: 'ppl-4day:push-b',
    programId: 'ppl-4day',
    dayIndex: 4,
    name: 'Push B',
    subtitle: 'Chest + Shoulders + Triceps (Hypertrophy Focus)',
    dayOfWeek: 'Saturday',
    focusMuscles: ['chest', 'front-delts', 'side-delts', 'triceps'],
    repRange: '10-15 (hypertrophy emphasis)',
    intensityTechniques: ['drop-set', 'superset', 'rest-pause'],
    targetSets: 16,
    targetDurationMin: 45,
    notes:
      'Push B flips the rep range -- higher reps, more volume, more isolation. ' +
      'Incline press takes top billing to balance upper chest development.',
    exerciseIds: [
      'incline-db-press',
      'cable-fly',
      'db-lateral-raise',
      'cable-lateral-raise',
      'cable-face-pull',
      'overhead-cable-tricep-ext',
      'cable-pushdown'
    ],
    exerciseNotes: {
      'incline-db-press': '3×10-12 @ RPE 8',
      'cable-fly': '3×12-15 + drop set on last set',
      'db-lateral-raise': '3×12-15',
      'cable-lateral-raise': '2×15-20 -- superset with db lateral raise',
      'cable-face-pull': '3×15-20',
      'overhead-cable-tricep-ext': '3×12-15',
      'cable-pushdown': '2×12-15 + drop set'
    }
  }
];

// Week 2 of PPL rotation (Pull B takes day slot 1 next week)
export const ppl4DayWeek2Days = [
  {
    id: 'ppl-4day:pull-b',
    programId: 'ppl-4day',
    dayIndex: 5,
    name: 'Pull B',
    subtitle: 'Back + Biceps (Hypertrophy Focus)',
    dayOfWeek: 'Monday (Week 2)',
    focusMuscles: ['lats', 'mid-back', 'rear-delts', 'biceps'],
    repRange: '10-15 (hypertrophy emphasis)',
    intensityTechniques: ['drop-set', 'superset'],
    targetSets: 16,
    targetDurationMin: 45,
    notes:
      'Pull B mirror of Pull A -- higher reps, more isolation, superset-friendly. ' +
      'Single-arm rows and cable work take centre stage.',
    exerciseIds: [
      'cable-lat-pulldown-wide',
      'single-arm-db-row',
      'seated-cable-row',
      'cable-face-pull',
      'incline-db-curl',
      'cable-curl',
      'db-hammer-curl'
    ],
    exerciseNotes: {
      'cable-lat-pulldown-wide': '3×10-12',
      'single-arm-db-row': '3×12-15 per side',
      'seated-cable-row': '3×12-15',
      'cable-face-pull': '3×15-20',
      'incline-db-curl': '3×10-12 -- lengthened position priority',
      'cable-curl': '2×12-15 + drop set',
      'db-hammer-curl': '2×12-15'
    }
  }
];

// ── Program 3: Upper / Lower 4-Day ───────────────────────────────────────────

export const upperLower4DayDays = [
  {
    id: 'upper-lower-4day:upper-a',
    programId: 'upper-lower-4day',
    dayIndex: 1,
    name: 'Upper A',
    subtitle: 'Strength Focus -- Heavy Compounds',
    dayOfWeek: 'Monday',
    focusMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
    repRange: '3-6 (strength)',
    intensityTechniques: ['progressive-overload'],
    targetSets: 14,
    targetDurationMin: 55,
    notes:
      'Prioritise adding weight each session. Low reps, long rest (2-3 min between sets). ' +
      'RPE 8-9 on top sets. This is your heavy day -- leave the gym feeling strong, not destroyed.',
    exerciseIds: [
      'flat-barbell-bench',
      'weighted-pull-up',
      'seated-db-shoulder-press',
      'seated-cable-row',
      'barbell-curl',
      'overhead-db-tricep-ext'
    ],
    exerciseNotes: {
      'flat-barbell-bench': '5×3-5 @ RPE 8-9 -- add 2.5 lbs when all sets completed',
      'weighted-pull-up': '4×4-6 -- add weight when all sets completed',
      'seated-db-shoulder-press': '4×4-6 @ RPE 8',
      'seated-cable-row': '4×5-6 heavy',
      'barbell-curl': '3×5-6 heavy',
      'overhead-db-tricep-ext': '3×6-8'
    }
  },
  {
    id: 'upper-lower-4day:lower-a',
    programId: 'upper-lower-4day',
    dayIndex: 2,
    name: 'Lower A',
    subtitle: 'Strength Focus -- Hip Hinge + Quad Drive (Lower Back Friendly)',
    dayOfWeek: 'Tuesday',
    focusMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
    repRange: '4-6 (strength)',
    intensityTechniques: ['progressive-overload'],
    targetSets: 14,
    targetDurationMin: 55,
    notes:
      'No conventional deadlifts or heavy barbell squats. Romanian deadlifts replace conventional. ' +
      'Goblet squats or Bulgarian split squats replace barbell back squats. ' +
      'Focus on load progression and movement quality.',
    exerciseIds: [
      'goblet-squat',
      'romanian-deadlift',
      'bulgarian-split-squat',
      'cable-pull-through',
      'standing-calf-raise',
      'ab-wheel-rollout'
    ],
    exerciseNotes: {
      'goblet-squat': '4×5-6 -- heaviest DB available, tempo 3/1/1',
      'romanian-deadlift': '4×5-6 @ RPE 8 -- hinge emphasis, neutral spine',
      'bulgarian-split-squat': '3×6-8 per leg -- front foot elevated 4 in.',
      'cable-pull-through': '3×8-10 -- glute activation, safe for lower back',
      'standing-calf-raise': '4×6-8 -- heavy, full ROM',
      'ab-wheel-rollout': '3×8-10 -- anti-extension core'
    }
  },
  {
    id: 'upper-lower-4day:upper-b',
    programId: 'upper-lower-4day',
    dayIndex: 3,
    name: 'Upper B',
    subtitle: 'Hypertrophy Focus -- Volume + Isolation',
    dayOfWeek: 'Thursday',
    focusMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
    repRange: '8-15 (hypertrophy)',
    intensityTechniques: ['drop-set', 'superset', 'rest-pause'],
    targetSets: 18,
    targetDurationMin: 50,
    notes:
      'Higher reps, shorter rest, more isolation work. ' +
      'Supersets between opposing muscle groups (chest/back, biceps/triceps) compress session time. ' +
      'Focus on the muscle contraction, not just moving weight.',
    exerciseIds: [
      'incline-db-press',
      'cable-lat-pulldown-wide',
      'cable-fly',
      'single-arm-db-row',
      'cable-lateral-raise',
      'cable-face-pull',
      'incline-db-curl',
      'cable-pushdown'
    ],
    exerciseNotes: {
      'incline-db-press': '3×10-12 superset with cable-lat-pulldown-wide',
      'cable-lat-pulldown-wide': '3×10-12 superset with incline-db-press',
      'cable-fly': '3×12-15 + drop set',
      'single-arm-db-row': '3×12-15 per side',
      'cable-lateral-raise': '4×12-15 + drop set on last set',
      'cable-face-pull': '3×15-20',
      'incline-db-curl': '3×10-12 superset with cable-pushdown',
      'cable-pushdown': '3×10-12 superset with incline-db-curl'
    }
  },
  {
    id: 'upper-lower-4day:lower-b',
    programId: 'upper-lower-4day',
    dayIndex: 4,
    name: 'Lower B',
    subtitle: 'Hypertrophy Focus -- Volume + Unilateral (Lower Back Friendly)',
    dayOfWeek: 'Saturday',
    focusMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'],
    repRange: '10-15 (hypertrophy)',
    intensityTechniques: ['superset', 'drop-set'],
    targetSets: 18,
    targetDurationMin: 50,
    notes:
      'Higher rep ranges, more unilateral work, superset-friendly pairings. ' +
      'Romanian deadlifts stay -- just lighter and with more reps. ' +
      'Cable pull-throughs and Nordic curls protect hamstrings and glutes without spinal loading.',
    exerciseIds: [
      'bulgarian-split-squat',
      'romanian-deadlift',
      'cable-pull-through',
      'nordic-hamstring-curl',
      'goblet-squat',
      'standing-calf-raise',
      'hanging-knee-raise',
      'cable-woodchop'
    ],
    exerciseNotes: {
      'bulgarian-split-squat': '3×12-15 per leg',
      'romanian-deadlift': '3×12-15 -- lighter than Lower A, tempo 3/1/1',
      'cable-pull-through': '3×15-20 -- high rep glute finisher',
      'nordic-hamstring-curl': '3×8-10 -- eccentric-focused',
      'goblet-squat': '3×15-20 -- pump set, short rest 60 sec',
      'standing-calf-raise': '4×15-20',
      'hanging-knee-raise': '3×12-15',
      'cable-woodchop': '2×12-15 per side'
    }
  }
];

// ── Program 4: Arnold Split -- 4-Day ─────────────────────────────────────────

export const arnold4DayDays = [
  {
    id: 'arnold-4day:chest-back-a',
    programId: 'arnold-4day',
    dayIndex: 1,
    name: 'Chest + Back A',
    subtitle: 'Compound Heavy -- Opposing Supersets',
    dayOfWeek: 'Monday',
    focusMuscles: ['chest', 'lats', 'mid-back', 'rear-delts'],
    repRange: '6-10',
    intensityTechniques: ['superset', 'drop-set'],
    targetSets: 18,
    targetDurationMin: 55,
    notes:
      'Train chest and back in alternating supersets. The pump from opposing groups is legendary. ' +
      'Press → row → press → row. Rest 90 sec between supersets.',
    exerciseIds: [
      'flat-barbell-bench',
      'seated-cable-row',
      'incline-db-press',
      'cable-lat-pulldown-wide',
      'cable-fly',
      'single-arm-db-row',
      'cable-face-pull'
    ],
    exerciseNotes: {
      'flat-barbell-bench': '4×6-8 superset with seated-cable-row',
      'seated-cable-row': '4×6-8 superset with flat-barbell-bench',
      'incline-db-press': '3×8-10 superset with cable-lat-pulldown-wide',
      'cable-lat-pulldown-wide': '3×8-10 superset with incline-db-press',
      'cable-fly': '3×12-15 -- finisher',
      'single-arm-db-row': '3×10-12 per side',
      'cable-face-pull': '2×15-20'
    }
  },
  {
    id: 'arnold-4day:shoulders-arms-a',
    programId: 'arnold-4day',
    dayIndex: 2,
    name: 'Shoulders + Arms A',
    subtitle: 'Heavy Press + Arm Volume',
    dayOfWeek: 'Tuesday',
    focusMuscles: ['front-delts', 'side-delts', 'rear-delts', 'biceps', 'triceps'],
    repRange: '6-12',
    intensityTechniques: ['superset', 'drop-set', 'rest-pause'],
    targetSets: 20,
    targetDurationMin: 55,
    notes:
      'Classic Arnold structure: shoulder compound first, then alternate bicep/tricep supersets. ' +
      'High arm volume is the hallmark of this split -- expect a significant arm pump.',
    exerciseIds: [
      'seated-db-shoulder-press',
      'cable-lateral-raise',
      'cable-face-pull',
      'barbell-curl',
      'overhead-db-tricep-ext',
      'incline-db-curl',
      'cable-pushdown',
      'db-hammer-curl',
      'overhead-cable-tricep-ext'
    ],
    exerciseNotes: {
      'seated-db-shoulder-press': '4×6-8',
      'cable-lateral-raise': '3×12-15',
      'cable-face-pull': '3×15-20',
      'barbell-curl': '3×8-10 superset with overhead-db-tricep-ext',
      'overhead-db-tricep-ext': '3×10-12 superset with barbell-curl',
      'incline-db-curl': '2×10-12 superset with cable-pushdown',
      'cable-pushdown': '2×10-12 superset with incline-db-curl',
      'db-hammer-curl': '2×12-15 superset with overhead-cable-tricep-ext',
      'overhead-cable-tricep-ext': '2×12-15 superset with db-hammer-curl'
    }
  },
  {
    id: 'arnold-4day:legs',
    programId: 'arnold-4day',
    dayIndex: 3,
    name: 'Legs',
    subtitle: 'Quads + Hamstrings + Glutes + Calves (Lower Back Friendly)',
    dayOfWeek: 'Thursday',
    focusMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
    repRange: '8-15',
    intensityTechniques: ['superset', 'progressive-overload'],
    targetSets: 18,
    targetDurationMin: 50,
    notes:
      'Original Arnold used heavy squats and deadlifts. Lower-back-friendly adaptation: ' +
      'goblet squats, Bulgarian split squats, Romanian deadlifts, cable pull-throughs.',
    exerciseIds: [
      'goblet-squat',
      'bulgarian-split-squat',
      'romanian-deadlift',
      'cable-pull-through',
      'nordic-hamstring-curl',
      'standing-calf-raise',
      'ab-wheel-rollout'
    ],
    exerciseNotes: {
      'goblet-squat': '4×8-10',
      'bulgarian-split-squat': '3×10-12 per leg',
      'romanian-deadlift': '3×10-12',
      'cable-pull-through': '3×12-15',
      'nordic-hamstring-curl': '3×6-10',
      'standing-calf-raise': '4×15-20',
      'ab-wheel-rollout': '3×8-12'
    }
  },
  {
    id: 'arnold-4day:chest-back-b',
    programId: 'arnold-4day',
    dayIndex: 4,
    name: 'Chest + Back B',
    subtitle: 'Hypertrophy / Volume -- Higher Reps',
    dayOfWeek: 'Saturday',
    focusMuscles: ['chest', 'lats', 'mid-back', 'rear-delts'],
    repRange: '10-15 (volume)',
    intensityTechniques: ['superset', 'drop-set'],
    targetSets: 18,
    targetDurationMin: 45,
    notes:
      'B session flips to higher reps for metabolic stimulus. All supersets. ' +
      'Incline press becomes the primary chest compound -- upper chest focus.',
    exerciseIds: [
      'incline-db-press',
      'single-arm-db-row',
      'cable-fly',
      'cable-lat-pulldown-wide',
      'low-to-high-cable-fly',
      'seated-cable-row',
      'cable-face-pull'
    ],
    exerciseNotes: {
      'incline-db-press': '3×10-12 superset with single-arm-db-row',
      'single-arm-db-row': '3×12-15 per side superset with incline-db-press',
      'cable-fly': '3×12-15 superset with cable-lat-pulldown-wide',
      'cable-lat-pulldown-wide': '3×12-15 superset with cable-fly',
      'low-to-high-cable-fly': '2×15-20 + drop set',
      'seated-cable-row': '3×12-15',
      'cable-face-pull': '2×15-20'
    }
  }
];

// ── Program 5: Full Body 4-Day ───────────────────────────────────────────────

export const fullBody4DayDays = [
  {
    id: 'full-body-4day:day-a',
    programId: 'full-body-4day',
    dayIndex: 1,
    name: 'Full Body A',
    subtitle: 'Compound Focus',
    dayOfWeek: 'Monday',
    focusMuscles: ['chest', 'back', 'quads', 'hamstrings', 'shoulders', 'biceps', 'triceps'],
    repRange: '6-10',
    intensityTechniques: ['progressive-overload'],
    targetSets: 14,
    targetDurationMin: 45,
    notes: 'Compound-first structure. Hit every major group with one primary movement.',
    exerciseIds: [
      'flat-barbell-bench',
      'weighted-pull-up',
      'goblet-squat',
      'romanian-deadlift',
      'seated-db-shoulder-press',
      'barbell-curl',
      'cable-pushdown'
    ],
    exerciseNotes: {
      'flat-barbell-bench': '3×6-8',
      'weighted-pull-up': '3×5-7',
      'goblet-squat': '3×8-10',
      'romanian-deadlift': '3×8-10',
      'seated-db-shoulder-press': '3×8-10',
      'barbell-curl': '2×8-10',
      'cable-pushdown': '2×10-12'
    }
  },
  {
    id: 'full-body-4day:day-b',
    programId: 'full-body-4day',
    dayIndex: 2,
    name: 'Full Body B',
    subtitle: 'Hypertrophy / Isolation',
    dayOfWeek: 'Tuesday',
    focusMuscles: ['chest', 'back', 'quads', 'hamstrings', 'shoulders', 'biceps', 'triceps', 'calves'],
    repRange: '10-15',
    intensityTechniques: ['superset'],
    targetSets: 14,
    targetDurationMin: 45,
    notes: 'B session shifts to isolation and moderate weight. Supersets to save time.',
    exerciseIds: [
      'incline-db-press',
      'cable-lat-pulldown-wide',
      'bulgarian-split-squat',
      'cable-pull-through',
      'cable-lateral-raise',
      'incline-db-curl',
      'overhead-cable-tricep-ext',
      'standing-calf-raise'
    ],
    exerciseNotes: {
      'incline-db-press': '3×10-12 superset with cable-lat-pulldown-wide',
      'cable-lat-pulldown-wide': '3×10-12 superset with incline-db-press',
      'bulgarian-split-squat': '3×12 per leg',
      'cable-pull-through': '3×12-15',
      'cable-lateral-raise': '3×12-15',
      'incline-db-curl': '2×10-12',
      'overhead-cable-tricep-ext': '2×10-12',
      'standing-calf-raise': '3×15-20'
    }
  },
  {
    id: 'full-body-4day:day-c',
    programId: 'full-body-4day',
    dayIndex: 3,
    name: 'Full Body C',
    subtitle: 'Strength + Power Bias',
    dayOfWeek: 'Thursday',
    focusMuscles: ['chest', 'back', 'quads', 'hamstrings', 'shoulders', 'biceps', 'triceps'],
    repRange: '4-8',
    intensityTechniques: ['progressive-overload'],
    targetSets: 14,
    targetDurationMin: 45,
    notes: 'Heaviest session of the week. Rotate compound movements from Day A to avoid stagnation.',
    exerciseIds: [
      'incline-db-press',
      'weighted-pull-up',
      'goblet-squat',
      'romanian-deadlift',
      'seated-db-shoulder-press',
      'barbell-curl',
      'overhead-db-tricep-ext'
    ],
    exerciseNotes: {
      'incline-db-press': '4×5-6',
      'weighted-pull-up': '4×4-6',
      'goblet-squat': '4×6-8',
      'romanian-deadlift': '4×5-6',
      'seated-db-shoulder-press': '3×6-8',
      'barbell-curl': '3×5-6',
      'overhead-db-tricep-ext': '3×6-8'
    }
  },
  {
    id: 'full-body-4day:day-d',
    programId: 'full-body-4day',
    dayIndex: 4,
    name: 'Full Body D',
    subtitle: 'Volume / Metabolic Finisher',
    dayOfWeek: 'Saturday',
    focusMuscles: ['chest', 'back', 'quads', 'hamstrings', 'shoulders', 'biceps', 'triceps', 'abs', 'calves'],
    repRange: '12-20',
    intensityTechniques: ['superset', 'circuit'],
    targetSets: 14,
    targetDurationMin: 40,
    notes:
      'Highest rep day -- metabolic, pump-focused, supersets throughout. ' +
      'Good day to reduce weight and focus on mind-muscle connection.',
    exerciseIds: [
      'cable-fly',
      'seated-cable-row',
      'goblet-squat',
      'cable-pull-through',
      'cable-lateral-raise',
      'incline-db-curl',
      'cable-pushdown',
      'hanging-knee-raise',
      'standing-calf-raise'
    ],
    exerciseNotes: {
      'cable-fly': '3×15-20 superset with seated-cable-row',
      'seated-cable-row': '3×15-20 superset with cable-fly',
      'goblet-squat': '3×15-20',
      'cable-pull-through': '3×15-20',
      'cable-lateral-raise': '3×15-20',
      'incline-db-curl': '2×15 superset with cable-pushdown',
      'cable-pushdown': '2×15 superset with incline-db-curl',
      'hanging-knee-raise': '3×15-20',
      'standing-calf-raise': '3×20-25'
    }
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 -- EXERCISE DATABASE (40-50 exercises)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Equipment available: Dumbbells (up to 70 lbs), cables, barbell + plates,
// pull-up bar, adjustable bench. No machines assumed (apartment gym).
//
// lowerBackRisk: 'low' | 'medium' | 'high'
// difficulty: 'beginner' | 'intermediate' | 'advanced'
// movementPattern: 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'isolation' | 'core'
// ─────────────────────────────────────────────────────────────────────────────

export const exercises = [

  // ═══════════════════ CHEST ═══════════════════════════════════════════════════

  {
    id: 'flat-barbell-bench',
    name: 'Flat Barbell Bench Press',
    primaryMuscles: ['chest-sternal', 'anterior-deltoid', 'triceps'],
    secondaryMuscles: ['serratus-anterior', 'rotator-cuff'],
    equipment: ['barbell', 'plates', 'bench'],
    movementPattern: 'push',
    lowerBackRisk: 'low',
    difficulty: 'intermediate',
    commonSubstitutions: ['flat-db-press', 'cable-fly', 'push-up'],
    proTips: [
      'Grip ~1.5× shoulder width -- wider stresses the pecs more, narrower shifts load to triceps.',
      'Control the eccentric: 3-second descent maximises mechanical tension and hypertrophy.',
      'Retract and depress scapulae before unracking; maintain this arch throughout.'
    ],
    scienceTip:
      'Schoenfeld (2010) demonstrated that slower eccentric tempos (3-4 sec) produce significantly ' +
      'greater hypertrophy than ballistic lifting by increasing time under tension and mechanical damage.'
  },

  {
    id: 'incline-db-press',
    name: 'Incline Dumbbell Press',
    primaryMuscles: ['chest-clavicular', 'anterior-deltoid', 'triceps'],
    secondaryMuscles: ['serratus-anterior'],
    equipment: ['dumbbells', 'adjustable-bench'],
    movementPattern: 'push',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    benchAngle: '30°',
    commonSubstitutions: ['incline-barbell-press', 'cable-fly-high-to-low', 'incline-push-up'],
    proTips: [
      '30° angle hits the clavicular (upper) chest head optimally -- avoid going above 45° which shifts load to anterior delts.',
      'Let the dumbbells travel below chest level for maximum pec stretch on each rep.',
      'Rotate wrists slightly inward at the top (neutral grip finish) to increase pec contraction.'
    ],
    scienceTip:
      'Incline DB press allows 20-30% greater range of motion than barbell incline, ' +
      'directly aligning with stretch-mediated hypertrophy research (McMahon et al. 2021).'
  },

  {
    id: 'flat-db-press',
    name: 'Flat Dumbbell Press',
    primaryMuscles: ['chest-sternal', 'anterior-deltoid', 'triceps'],
    secondaryMuscles: ['serratus-anterior'],
    equipment: ['dumbbells', 'bench'],
    movementPattern: 'push',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['flat-barbell-bench', 'push-up', 'cable-fly'],
    proTips: [
      'Allow greater ROM than barbell -- let dumbbells sink below chest level.',
      'Press at a slight inward angle (arcing path) to increase pec activation.',
      'Squeeze at the top as if trying to crush the dumbbells together.'
    ],
    scienceTip:
      'Dumbbells produce higher pectoralis major activation in the stretched position compared to barbell ' +
      'due to unrestricted wrist and shoulder movement (Saeterbakken & Fimland, 2013).'
  },

  {
    id: 'cable-fly',
    name: 'Cable Fly (Mid-Height)',
    primaryMuscles: ['chest-sternal', 'chest-clavicular'],
    secondaryMuscles: ['anterior-deltoid'],
    equipment: ['cable-machine'],
    movementPattern: 'isolation',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['db-fly', 'pec-deck', 'incline-db-press'],
    proTips: [
      'Step slightly forward -- this creates a deeper pec stretch at the starting position.',
      'Slight elbow bend throughout; do NOT straighten arms (isolates pec, removes tricep).',
      'Squeeze hands together and hold 1 second at peak contraction for maximum pec activation.'
    ],
    scienceTip:
      'Cables maintain constant tension through the full ROM, unlike dumbbells where tension drops at peak ' +
      'contraction. Studies show 93-98% of bench press pec activation with better stretch stimulus (Calatayud et al. 2015).'
  },

  {
    id: 'low-to-high-cable-fly',
    name: 'Low-to-High Cable Fly',
    primaryMuscles: ['chest-clavicular'],
    secondaryMuscles: ['anterior-deltoid', 'serratus-anterior'],
    equipment: ['cable-machine'],
    movementPattern: 'isolation',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['incline-db-press', 'cable-fly', 'incline-db-fly'],
    proTips: [
      'Set the cable to the lowest pulley position.',
      `Arc upward and inward -- the movement angle matches the clavicular head's fibre direction.`,
      'Touch fingertips at the top rather than crossing -- excessive crossing shifts load to anterior delt.'
    ],
    scienceTip:
      'Fibre direction of the clavicular pec head runs inferiorly to superiorly. ' +
      'Low-to-high cable fly aligns resistance with this direction, maximising upper chest recruitment.'
  },

  // ═══════════════════ BACK ════════════════════════════════════════════════════

  {
    id: 'weighted-pull-up',
    name: 'Weighted Pull-Up',
    primaryMuscles: ['latissimus-dorsi', 'biceps', 'teres-major'],
    secondaryMuscles: ['rhomboids', 'rear-deltoid', 'core'],
    equipment: ['pull-up-bar', 'dumbbells'],
    movementPattern: 'pull',
    lowerBackRisk: 'low',
    difficulty: 'advanced',
    commonSubstitutions: ['cable-lat-pulldown-wide', 'assisted-pull-up', 'inverted-row'],
    proTips: [
      'Use a dumbbell held between feet or ankles when body weight becomes too easy (>8 reps).',
      'Full hang at the bottom -- do not cut range of motion to chase reps.',
      'Pull elbows DOWN and BACK toward hips (not just up) for maximal lat engagement.'
    ],
    scienceTip:
      'Pull-ups produce the highest lat EMG activation of any upper body pull movement ' +
      '(Andersen et al. 2014), exceeding cable pulldowns and bent-over rows.'
  },

  {
    id: 'cable-lat-pulldown-wide',
    name: 'Cable Lat Pulldown (Wide Grip)',
    primaryMuscles: ['latissimus-dorsi', 'teres-major'],
    secondaryMuscles: ['biceps', 'rhomboids', 'posterior-deltoid'],
    equipment: ['cable-machine'],
    movementPattern: 'pull',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['weighted-pull-up', 'neutral-grip-pulldown', 'inverted-row'],
    proTips: [
      'Pull to upper chest -- not behind neck (behind-neck pulldowns stress the cervical spine).',
      'Imagine putting your elbows into your back pockets -- cues lat contraction.',
      'Allow a full stretch at the top: shoulder blades rising lets the lats lengthen maximally.'
    ],
    scienceTip:
      'Wide grip lat pulldowns preferentially recruit the lower lats due to humerus adduction mechanics, ' +
      'contributing more to the V-taper silhouette (Lusk et al. 2010).'
  },

  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    primaryMuscles: ['rhomboids', 'mid-trapezius', 'latissimus-dorsi'],
    secondaryMuscles: ['biceps', 'posterior-deltoid', 'erector-spinae'],
    equipment: ['cable-machine'],
    movementPattern: 'pull',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    lowerBackNote: 'Seated position with supported torso eliminates lumbar shear forces vs bent-over rows.',
    commonSubstitutions: ['single-arm-db-row', 'chest-supported-row', 'bent-over-barbell-row'],
    proTips: [
      'Slight forward lean at the start (stretch position) -- then pull and sit tall.',
      'Pull the handle to the lower abdomen, NOT the chest -- keeps lats engaged throughout.',
      'Pause at peak contraction with shoulder blades fully retracted before releasing.'
    ],
    scienceTip:
      'Seated rows produce comparable mid-back activation to bent-over rows with significantly less ' +
      'lumbar compressive force, making them the superior choice for lower back health (McGill, 2007).'
  },

  {
    id: 'single-arm-db-row',
    name: 'Single-Arm Dumbbell Row',
    primaryMuscles: ['latissimus-dorsi', 'rhomboids', 'teres-major'],
    secondaryMuscles: ['biceps', 'posterior-deltoid', 'core'],
    equipment: ['dumbbells', 'bench'],
    movementPattern: 'pull',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    lowerBackNote: 'Contralateral support from bench braces the lumbar spine -- very safe for lower back issues.',
    commonSubstitutions: ['seated-cable-row', 'cable-lat-pulldown-wide', 'chest-supported-row'],
    proTips: [
      'Pull the dumbbell toward your hip, not your chest -- this is the lat path.',
      'Allow a full arm extension at the bottom for complete lat stretch.',
      'Keep the working-side shoulder pulled down and back throughout -- prevent shrug at top.'
    ],
    scienceTip:
      'Unilateral rows allow greater range of motion and slightly higher lat activation than bilateral ' +
      'variations due to reduced contralateral interference (Fenwick et al. 2009).'
  },

  {
    id: 'cable-face-pull',
    name: 'Cable Face Pull',
    primaryMuscles: ['rear-deltoid', 'rotator-cuff', 'mid-trapezius'],
    secondaryMuscles: ['rhomboids', 'biceps'],
    equipment: ['cable-machine'],
    movementPattern: 'pull',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['band-pull-apart', 'db-rear-delt-fly', 'reverse-pec-deck'],
    proTips: [
      'Use a rope attachment, set cable at forehead height.',
      'Pull to forehead level and externally rotate at the end -- thumbs point backward.',
      'This movement is as important for shoulder health as any pressing exercise -- never skip it.'
    ],
    scienceTip:
      'Face pulls directly target the infraspinatus and teres minor (rotator cuff), strengthening ' +
      'external rotation -- the most commonly neglected movement pattern in pressing-heavy programs.'
  },

  {
    id: 'cable-pull-through',
    name: 'Cable Pull-Through',
    primaryMuscles: ['glutes', 'hamstrings'],
    secondaryMuscles: ['erector-spinae', 'core'],
    equipment: ['cable-machine'],
    movementPattern: 'hinge',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    lowerBackNote:
      'Anteroposterior resistance (cable pulls backward) rather than axial compression -- ' +
      'dramatically reduces lumbar load vs Romanian deadlifts.',
    commonSubstitutions: ['romanian-deadlift', 'hip-thrust', 'kettlebell-swing'],
    proTips: [
      'Set cable at floor level. Stand facing away, rope between legs.',
      'Hinge at hips (not squat), drive hips forward to stand -- feel the glutes fire.',
      'Keep spine neutral throughout -- this is a glute exercise, not a back exercise.'
    ],
    scienceTip:
      'Cable pull-throughs produce glute activation comparable to barbell hip thrusts ' +
      'while imposing near-zero spinal compressive load (Contreras et al. 2015).'
  },

  // ═══════════════════ SHOULDERS ══════════════════════════════════════════════

  {
    id: 'seated-db-shoulder-press',
    name: 'Seated Dumbbell Shoulder Press',
    primaryMuscles: ['anterior-deltoid', 'medial-deltoid', 'triceps'],
    secondaryMuscles: ['upper-trapezius', 'serratus-anterior'],
    equipment: ['dumbbells', 'adjustable-bench'],
    movementPattern: 'push',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    lowerBackNote: 'Seated with back support eliminates the spinal loading of standing overhead press.',
    commonSubstitutions: ['barbell-overhead-press', 'arnold-press', 'cable-overhead-press'],
    proTips: [
      'Set the bench to 80-90° for back support -- removes lower back strain from standing press.',
      'Full ROM: elbows at ear level at bottom, arms nearly fully extended at top.',
      'Neutral grip or slight pronation -- avoid fully pronated grip which internally rotates the shoulder joint.'
    ],
    scienceTip:
      'Seated shoulder press produces similar deltoid activation to standing but with significantly ' +
      'reduced erector spinae demand, making it the preferred choice for those with lumbar concerns.'
  },

  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    primaryMuscles: ['medial-deltoid'],
    secondaryMuscles: ['anterior-deltoid', 'supraspinatus', 'upper-trapezius'],
    equipment: ['cable-machine'],
    movementPattern: 'isolation',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['db-lateral-raise', 'plate-lateral-raise', 'machine-lateral-raise'],
    proTips: [
      'Stand perpendicular to the cable with the handle in the far hand -- constant tension at bottom.',
      'Raise to just above shoulder height with a slight forward lean and slight elbow bend.',
      'Pinky slightly higher than thumb at the top (internal rotation) -- maximises medial delt stimulation.'
    ],
    scienceTip:
      'Cables maintain tension through the full arc, unlike dumbbells which have near-zero tension at the ' +
      'bottom of the range. This lengthened-position loading is associated with superior hypertrophy outcomes ' +
      '(Pedrosa et al. 2023).'
  },

  {
    id: 'db-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    primaryMuscles: ['medial-deltoid'],
    secondaryMuscles: ['anterior-deltoid', 'upper-trapezius'],
    equipment: ['dumbbells'],
    movementPattern: 'isolation',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['cable-lateral-raise', 'plate-lateral-raise'],
    proTips: [
      'Slight forward lean (15-20°) shifts tension toward the medial delt.',
      'Avoid momentum -- use a weight you can control for all reps.',
      'Lead with the elbow, not the wrist -- keeps the focus on the delt.'
    ],
    scienceTip:
      'Dumbbell lateral raises have highest medial delt tension at the top of the range; ' +
      'pairing them with cable raises covers both ends of the strength curve.'
  },

  {
    id: 'db-rear-delt-fly',
    name: 'Dumbbell Rear Delt Fly',
    primaryMuscles: ['rear-deltoid'],
    secondaryMuscles: ['rhomboids', 'mid-trapezius'],
    equipment: ['dumbbells'],
    movementPattern: 'isolation',
    lowerBackRisk: 'medium',
    lowerBackNote: 'Perform seated (elbows on knees) to eliminate forward lean stress on the lower back.',
    difficulty: 'beginner',
    commonSubstitutions: ['cable-face-pull', 'band-pull-apart', 'reverse-pec-deck'],
    proTips: [
      'Sit on the edge of a bench and hinge forward until torso is parallel to the floor.',
      'Lead with the elbows, not the hands -- keeps rear delts isolated.',
      'Squeeze shoulder blades together at the top -- do not let upper traps take over.'
    ],
    scienceTip:
      'Rear deltoid training is critical for rotator cuff health and posture correction. ' +
      'Most lifters need 2× more rear delt volume than they currently perform.'
  },

  // ═══════════════════ BICEPS ══════════════════════════════════════════════════

  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    primaryMuscles: ['biceps-brachii'],
    secondaryMuscles: ['brachialis', 'brachioradialis'],
    equipment: ['barbell', 'plates'],
    movementPattern: 'isolation',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['ez-bar-curl', 'db-curl', 'cable-curl'],
    proTips: [
      'Shoulder-width grip -- neither too wide nor too close.',
      'Control the eccentric fully (3 seconds down) to maximise bicep hypertrophy.',
      'Brace the core and pin elbows to your sides -- no swinging for reps you cannot control.'
    ],
    scienceTip:
      'Barbell curls allow the highest load of any bicep exercise, which is the primary driver of ' +
      'strength adaptations. Pair with incline curls for complete long-head and short-head coverage.'
  },

  {
    id: 'incline-db-curl',
    name: 'Incline Dumbbell Curl',
    primaryMuscles: ['biceps-brachii-long-head'],
    secondaryMuscles: ['brachialis', 'brachioradialis'],
    equipment: ['dumbbells', 'adjustable-bench'],
    movementPattern: 'isolation',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    benchAngle: '45°',
    commonSubstitutions: ['cable-curl', 'db-curl', 'barbell-curl'],
    proTips: [
      'Set bench to 45°. Let arms hang fully behind the body -- this creates maximum long-head stretch.',
      'Supinate (rotate to palm-up) during the curl -- activates the full bicep head.',
      'Do not swing -- the incline position limits cheating naturally.'
    ],
    scienceTip:
      'Incline curls produce the greatest long-head stretch of any curl variation. ' +
      'Training the bicep in a lengthened position is associated with 50-70% greater hypertrophy ' +
      'vs. shortened-position training (Pedrosa et al. 2022).'
  },

  {
    id: 'db-hammer-curl',
    name: 'Dumbbell Hammer Curl',
    primaryMuscles: ['brachialis', 'brachioradialis'],
    secondaryMuscles: ['biceps-brachii'],
    equipment: ['dumbbells'],
    movementPattern: 'isolation',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['cable-rope-curl', 'cross-body-hammer-curl'],
    proTips: [
      'Neutral grip (thumbs up) throughout -- do not rotate the wrist.',
      'Brachialis sits under the bicep -- building it pushes the bicep up and creates arm width.',
      'Perform alternating reps with full elbow extension at the bottom.'
    ],
    scienceTip:
      'The brachialis is the strongest elbow flexor regardless of forearm rotation. ' +
      'It cannot be seen directly but training it "pushes" the bicep up, increasing arm peak and girth.'
  },

  {
    id: 'cable-curl',
    name: 'Cable Curl',
    primaryMuscles: ['biceps-brachii'],
    secondaryMuscles: ['brachialis', 'brachioradialis'],
    equipment: ['cable-machine'],
    movementPattern: 'isolation',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['barbell-curl', 'db-curl', 'incline-db-curl'],
    proTips: [
      'Set cable at floor level with a straight bar or rope attachment.',
      'Cables maintain constant tension through the full ROM unlike free weights.',
      'Great for drop sets -- quick stack adjustment with no equipment change.'
    ],
    scienceTip:
      'Constant tension from cables means the bicep is loaded at the lengthened position ' +
      '(unlike dumbbells which have near-zero load at the bottom of the range).'
  },

  // ═══════════════════ TRICEPS ══════════════════════════════════════════════════

  {
    id: 'cable-pushdown',
    name: 'Cable Tricep Pushdown',
    primaryMuscles: ['triceps-lateral-head', 'triceps-medial-head'],
    secondaryMuscles: ['triceps-long-head'],
    equipment: ['cable-machine'],
    movementPattern: 'isolation',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['db-kickback', 'skull-crusher', 'close-grip-bench-press'],
    proTips: [
      'Pin elbows to your sides throughout -- only the forearms move.',
      'Full lockout at the bottom -- tricep is fully contracted only at complete extension.',
      'Rope attachment allows wrists to spread apart at the bottom for greater lateral head activation.'
    ],
    scienceTip:
      'Pushdowns primarily target the lateral and medial heads. ' +
      'Pairing with overhead extensions ensures comprehensive tricep development across all three heads.'
  },

  {
    id: 'overhead-db-tricep-ext',
    name: 'Overhead Dumbbell Tricep Extension',
    primaryMuscles: ['triceps-long-head'],
    secondaryMuscles: ['triceps-lateral-head', 'triceps-medial-head'],
    equipment: ['dumbbells', 'bench'],
    movementPattern: 'isolation',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['overhead-cable-tricep-ext', 'ez-bar-skull-crusher', 'cable-pushdown'],
    proTips: [
      'Sit with back supported. Hold one dumbbell with both hands above the head.',
      'Lower slowly until triceps are fully stretched -- elbows stay pointed up.',
      'Press to full extension at the top without locking out aggressively.'
    ],
    scienceTip:
      'Overhead position places the long head in a fully stretched position. ' +
      'Maeo et al. (2022) showed ~40% greater long-head hypertrophy from overhead extensions ' +
      'compared to pushdown-only training over 12 weeks.'
  },

  {
    id: 'overhead-cable-tricep-ext',
    name: 'Overhead Cable Tricep Extension',
    primaryMuscles: ['triceps-long-head'],
    secondaryMuscles: ['triceps-lateral-head', 'triceps-medial-head'],
    equipment: ['cable-machine'],
    movementPattern: 'isolation',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['overhead-db-tricep-ext', 'skull-crusher', 'cable-pushdown'],
    proTips: [
      'Face away from the cable with the rope overhead.',
      'Hinge forward slightly to create a counter-lean for stability.',
      'Full stretch at the bottom -- cable allows greater ROM than dumbbell version.'
    ],
    scienceTip:
      'Cable version of overhead extension maintains constant tension through the stretched position, ' +
      'combining the benefits of overhead loading with constant cable tension.'
  },

  {
    id: 'close-grip-bench-press',
    name: 'Close-Grip Barbell Bench Press',
    primaryMuscles: ['triceps-all-heads', 'anterior-deltoid'],
    secondaryMuscles: ['chest-sternal'],
    equipment: ['barbell', 'plates', 'bench'],
    movementPattern: 'push',
    lowerBackRisk: 'low',
    difficulty: 'intermediate',
    commonSubstitutions: ['diamond-push-up', 'cable-pushdown', 'db-skull-crusher'],
    proTips: [
      'Grip slightly inside shoulder width -- hands at shoulder width is typically sufficient (narrower risks wrist pain).',
      'Keep elbows closer to body (45° flare) to emphasise triceps over chest.',
      'Same bar path as bench press -- lower to lower sternum, press straight up.'
    ],
    scienceTip:
      'Close-grip bench allows the highest overload of any tricep exercise. ' +
      'Research shows it produces greater strength gains than isolation movements due to compound loading.'
  },

  // ═══════════════════ LEGS -- QUADS ═══════════════════════════════════════════

  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'core', 'adductors'],
    equipment: ['dumbbells'],
    movementPattern: 'squat',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    lowerBackNote:
      'Load is held anterior (in front) rather than axially on the spine, reducing lumbar compression by >80% ' +
      'compared to back squat.',
    commonSubstitutions: ['front-squat', 'leg-press', 'box-squat'],
    proTips: [
      'Hold the dumbbell vertically at chest height (goblet position).',
      'Sit deep between your heels -- elbows push knees out at the bottom to improve hip mobility.',
      'Progress by using the heaviest dumbbell available and adding a tempo (3-second descent).'
    ],
    scienceTip:
      'Goblet squats produce equivalent quad activation to barbell back squats at submaximal loads ' +
      'while imposing dramatically lower spinal compressive forces (Gullett et al. 2009).'
  },

  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat (DB)',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'adductors', 'core'],
    equipment: ['dumbbells', 'bench'],
    movementPattern: 'squat',
    lowerBackRisk: 'low',
    difficulty: 'intermediate',
    lowerBackNote:
      'Unilateral loading allows lower total load per leg while achieving the same quad stimulus. ' +
      'Eliminates axial spinal loading entirely.',
    commonSubstitutions: ['goblet-squat', 'rear-foot-elevated-split-squat', 'lunges'],
    proTips: [
      'Rear foot elevated on bench, front foot 2-3 feet forward.',
      'Keep front shin near-vertical for quad dominance (or let it travel forward for more glute).',
      'Use dumbbells at your sides rather than a barbell on your back to protect the spine.'
    ],
    scienceTip:
      'Bulgarian split squats produce equivalent quad hypertrophy to bilateral squats with half the spinal ' +
      'compression. Athletes with lower back issues show significant quad and glute development without pain ' +
      'recurrence on this exercise (McCurdy et al. 2010).'
  },

  // ═══════════════════ LEGS -- HAMSTRINGS / GLUTES ═══════════════════════════

  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift (DB or Barbell)',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['erector-spinae', 'adductors', 'core'],
    equipment: ['barbell', 'plates', 'dumbbells'],
    movementPattern: 'hinge',
    lowerBackRisk: 'medium',
    lowerBackNote:
      'Significantly lower risk than conventional deadlift -- no rounding from the floor. ' +
      'Keep neutral spine throughout. Stop at mid-shin level, not floor.',
    difficulty: 'intermediate',
    commonSubstitutions: ['cable-pull-through', 'nordic-hamstring-curl', 'leg-curl'],
    proTips: [
      'Push hips back first, not down -- this is a hinge, not a squat.',
      'Stop when you feel a hamstring stretch (usually mid-shin level) -- do not chase the floor.',
      'Maintain a neutral spine with a proud chest throughout the entire set.'
    ],
    scienceTip:
      'RDLs train the hamstrings in a lengthened position, which research consistently associates with ' +
      'greater hypertrophy compared to leg curl (shortened-position) training (Maeo et al. 2021).'
  },

  {
    id: 'nordic-hamstring-curl',
    name: 'Nordic Hamstring Curl',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['glutes', 'calves', 'core'],
    equipment: ['pull-up-bar', 'bench', 'anchor'],
    movementPattern: 'hinge',
    lowerBackRisk: 'low',
    difficulty: 'advanced',
    commonSubstitutions: ['romanian-deadlift', 'lying-leg-curl', 'cable-pull-through'],
    proTips: [
      'Anchor feet under a bench or have a partner hold your ankles.',
      'Lower your body toward the floor as slowly as possible -- eccentric focus is the goal.',
      'Catch yourself with your hands when you cannot control the descent any longer.',
      'Begin with 3-5 slow eccentrics per set; build to full reps over weeks.'
    ],
    scienceTip:
      'Nordic hamstring curls reduce hamstring injury risk by 51% (Petersen et al. 2011). ' +
      'They also produce exceptional hamstring hypertrophy due to extreme lengthened-position loading.'
  },

  {
    id: 'hip-thrust',
    name: 'Barbell Hip Thrust',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'quadriceps', 'core'],
    equipment: ['barbell', 'plates', 'bench'],
    movementPattern: 'hinge',
    lowerBackRisk: 'low',
    difficulty: 'intermediate',
    lowerBackNote: 'Upper back on bench, hips in the air -- minimal lumbar shear. Safe for most lower back issues.',
    commonSubstitutions: ['cable-pull-through', 'glute-bridge', 'dumbbell-hip-thrust'],
    proTips: [
      'Upper back (not neck) on the bench, feet flat on floor, knees 90° at top.',
      'Drive hips to full extension -- squeeze glutes hard at the top for 1 second.',
      'Pad the barbell to protect the hip crests -- use a barbell pad or folded mat.'
    ],
    scienceTip:
      'Hip thrusts produce the highest gluteus maximus activation of any exercise (Contreras et al. 2015), ' +
      'exceeding squats and deadlifts by 25-40% EMG.'
  },

  // ═══════════════════ LEGS -- CALVES ═══════════════════════════════════════════

  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise (DB or Barbell)',
    primaryMuscles: ['gastrocnemius'],
    secondaryMuscles: ['soleus', 'tibialis-posterior'],
    equipment: ['dumbbells', 'barbell', 'step'],
    movementPattern: 'isolation',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['seated-calf-raise', 'leg-press-calf-raise', 'single-leg-calf-raise'],
    proTips: [
      'Perform on a raised surface (step or plate) for full ROM -- heel below step level at bottom.',
      'Hold the stretch at the bottom for 1 second -- calves respond to stretched position loading.',
      'High reps (15-25) tend to work better for calves due to high proportion of slow-twitch fibres.'
    ],
    scienceTip:
      'Gastrocnemius is a two-joint muscle (crosses knee and ankle). Standing calf raises with a straight ' +
      'knee maximise gastrocnemius recruitment, while seated raises (bent knee) shift load to the soleus.'
  },

  // ═══════════════════ CORE ════════════════════════════════════════════════════

  {
    id: 'cable-crunch',
    name: 'Cable Crunch (Kneeling)',
    primaryMuscles: ['rectus-abdominis'],
    secondaryMuscles: ['obliques'],
    equipment: ['cable-machine'],
    movementPattern: 'core',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['ab-wheel-rollout', 'decline-crunch', 'hanging-knee-raise'],
    proTips: [
      'Round your spine -- bring elbows toward knees. This is a crunch, not a hip flexion.',
      'Keep hips stationary -- only the spine should move.',
      'Cable allows progressive overload on abs, unlike bodyweight crunches.'
    ],
    scienceTip:
      'Weighted cable crunches produce the highest rectus abdominis activation of any crunch variation ' +
      'due to the ability to progressively overload the movement (Escamilla et al. 2010).'
  },

  {
    id: 'hanging-knee-raise',
    name: 'Hanging Knee Raise',
    primaryMuscles: ['rectus-abdominis', 'hip-flexors'],
    secondaryMuscles: ['obliques', 'forearms'],
    equipment: ['pull-up-bar'],
    movementPattern: 'core',
    lowerBackRisk: 'low',
    difficulty: 'intermediate',
    commonSubstitutions: ['lying-leg-raise', 'cable-crunch', 'captain-chair-knee-raise'],
    proTips: [
      'Pull your knees all the way to your chest -- do not stop at 90°.',
      'Control the descent -- slow lower prevents hip flexors from doing all the work.',
      'Progress to straight-leg raises when knee raises are easy (10+ reps with control).'
    ],
    scienceTip:
      'Hanging knee raises produce superior lower rectus abdominis activation compared to floor-based ' +
      'exercises due to the extended body position creating greater lengthened-position tension.'
  },

  {
    id: 'cable-woodchop',
    name: 'Cable Woodchop',
    primaryMuscles: ['obliques'],
    secondaryMuscles: ['rectus-abdominis', 'glutes', 'hip-flexors'],
    equipment: ['cable-machine'],
    movementPattern: 'core',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['landmine-rotation', 'russian-twist', 'pallof-press'],
    proTips: [
      'Rotate from the core, not just the arms -- generate force from the hips and obliques.',
      'Keep arms relatively straight -- this is a rotational, not a pull movement.',
      'Perform both high-to-low and low-to-high variations to hit all oblique fibres.'
    ],
    scienceTip:
      'Rotational cable movements (woodchops) train anti-rotation strength and oblique power -- ' +
      'functionally important for spinal stability and sport performance.'
  },

  {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    primaryMuscles: ['rectus-abdominis', 'core-deep-stabilisers'],
    secondaryMuscles: ['obliques', 'lats', 'hip-flexors', 'triceps'],
    equipment: ['ab-wheel'],
    movementPattern: 'core',
    lowerBackRisk: 'medium',
    lowerBackNote:
      'Start with short range of motion and build progressively. Do not allow lower back to sag. ' +
      'Stop if you feel lumbar compression -- modify to kneeling rollout.',
    difficulty: 'advanced',
    commonSubstitutions: ['cable-crunch', 'plank', 'hanging-knee-raise'],
    proTips: [
      'Start kneeling. Roll out only as far as you can maintain a posterior pelvic tilt.',
      'Think of pulling your belly button toward your spine throughout.',
      'Progress from partial rollouts to full rollouts over weeks.'
    ],
    scienceTip:
      'Ab wheel rollouts produce the highest overall core activation of any ab exercise, ' +
      'particularly deep stabilisers (transversus abdominis), making them highly effective for ' +
      'core strength with carryover to all compound lifts.'
  },

  {
    id: 'pallof-press',
    name: 'Pallof Press (Cable Anti-Rotation)',
    primaryMuscles: ['obliques', 'transversus-abdominis'],
    secondaryMuscles: ['rectus-abdominis', 'glutes'],
    equipment: ['cable-machine'],
    movementPattern: 'core',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['cable-woodchop', 'plank', 'side-plank'],
    proTips: [
      'Stand perpendicular to the cable. Press handle straight out, hold 2 seconds, return.',
      'Resist rotation -- the goal is to NOT rotate. This is an anti-rotation exercise.',
      'Progress by stepping further from the cable or increasing load, not by moving faster.'
    ],
    scienceTip:
      'Anti-rotation training (Pallof press) directly trains the obliques and deep core for spinal stability -- ' +
      'the movement pattern most protective against lower back injury under load.'
  },

  // ═══════════════════ COMPOUND FULL-BODY ══════════════════════════════════════

  {
    id: 'deadlift-conventional',
    name: 'Conventional Deadlift',
    primaryMuscles: ['hamstrings', 'glutes', 'erector-spinae'],
    secondaryMuscles: ['quadriceps', 'traps', 'lats', 'core', 'forearms'],
    equipment: ['barbell', 'plates'],
    movementPattern: 'hinge',
    lowerBackRisk: 'high',
    lowerBackNote:
      'HIGH RISK for lower back issues. Not recommended for this athlete. ' +
      'Substitute with Romanian deadlifts, cable pull-throughs, or hip thrusts.',
    difficulty: 'advanced',
    commonSubstitutions: ['romanian-deadlift', 'cable-pull-through', 'hip-thrust'],
    proTips: [
      'Hip-width stance, bar over mid-foot, neutral spine, big breath and brace before each rep.',
      'Push the floor away rather than pull the bar up -- shifts load to legs appropriately.',
      'Do not program this exercise if you have lower back issues -- see substitutions.'
    ],
    scienceTip:
      'Conventional deadlifts generate the highest lumbar compressive forces of any common gym exercise ' +
      '(>6× bodyweight at the L4/L5 disc). This is not inherently dangerous for healthy spines, ' +
      'but should be avoided by those with disc issues or lumbar pain.'
  },

  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'erector-spinae', 'core', 'adductors'],
    equipment: ['barbell', 'plates', 'squat-rack'],
    movementPattern: 'squat',
    lowerBackRisk: 'high',
    lowerBackNote:
      'High axial spinal loading. Not recommended for lower back issues. ' +
      'Substitute with goblet squat, Bulgarian split squat, or leg press.',
    difficulty: 'advanced',
    commonSubstitutions: ['goblet-squat', 'bulgarian-split-squat', 'front-squat'],
    proTips: [
      'This program uses goblet squats and Bulgarian split squats as primary substitutes.',
      'If you do train this, high-bar placement and an upright torso reduces lumbar shear.',
      'A squat rack / power rack is required for heavy loads -- not available in this gym setup.'
    ],
    scienceTip:
      'Back squats generate 6-8× bodyweight lumbar compressive forces. For lower back health, ' +
      'achieving equivalent quad stimulus with goblet squats or split squats is preferable.'
  },

  // ═══════════════════ PULL-UP VARIATIONS ══════════════════════════════════════

  {
    id: 'chin-up',
    name: 'Chin-Up (Supinated Grip)',
    primaryMuscles: ['biceps-brachii', 'latissimus-dorsi'],
    secondaryMuscles: ['teres-major', 'rhomboids', 'core'],
    equipment: ['pull-up-bar'],
    movementPattern: 'pull',
    lowerBackRisk: 'low',
    difficulty: 'intermediate',
    commonSubstitutions: ['cable-lat-pulldown-wide', 'weighted-pull-up', 'inverted-row'],
    proTips: [
      'Supinated (underhand) grip increases bicep involvement vs. pronated pull-up.',
      'Full hang at the bottom, chin clearly above bar at the top.',
      'Progress with a dumbbell held between ankles when body weight becomes easy.'
    ],
    scienceTip:
      'Chin-ups produce the highest bicep brachii activation of any pulling exercise, ' +
      'making them a compound alternative to direct bicep curls when time is limited.'
  },

  {
    id: 'inverted-row',
    name: 'Inverted Row (Bodyweight)',
    primaryMuscles: ['rhomboids', 'mid-trapezius', 'posterior-deltoid'],
    secondaryMuscles: ['biceps', 'latissimus-dorsi', 'core'],
    equipment: ['barbell', 'bench', 'pull-up-bar'],
    movementPattern: 'pull',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['seated-cable-row', 'single-arm-db-row', 'cable-lat-pulldown-wide'],
    proTips: [
      'Set a barbell in the rack at hip height. Hang below it with heels on the floor.',
      'Keep your body rigid (plank position) -- no hip sag.',
      'Elevate feet on a bench to increase difficulty.'
    ],
    scienceTip:
      'Inverted rows produce comparable rhomboid and mid-trap activation to seated cable rows, ' +
      'making them an excellent bodyweight option for mid-back development.'
  },

  // ═══════════════════ PUSH VARIATIONS ════════════════════════════════════════

  {
    id: 'dip',
    name: 'Weighted Dip',
    primaryMuscles: ['chest-sternal', 'triceps', 'anterior-deltoid'],
    secondaryMuscles: ['pectoralis-minor', 'serratus-anterior'],
    equipment: ['pull-up-bar', 'parallel-bars', 'dumbbells'],
    movementPattern: 'push',
    lowerBackRisk: 'low',
    difficulty: 'intermediate',
    commonSubstitutions: ['close-grip-bench-press', 'cable-pushdown', 'flat-db-press'],
    proTips: [
      'Forward lean (torso angled forward) increases chest emphasis; upright torso shifts to triceps.',
      'Full ROM: upper arms parallel to floor at the bottom -- do not stop short.',
      'Use a dumbbell between your feet or a dip belt to add weight when body weight is easy.'
    ],
    scienceTip:
      'Dips allow a high degree of chest activation in the lengthened position (bottom of the dip), ' +
      'combining compound tricep and chest loading in one movement.'
  },

  {
    id: 'push-up-weighted',
    name: 'Weighted Push-Up',
    primaryMuscles: ['chest-sternal', 'anterior-deltoid', 'triceps'],
    secondaryMuscles: ['serratus-anterior', 'core', 'rhomboids'],
    equipment: ['weight-plate', 'bands'],
    movementPattern: 'push',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['flat-barbell-bench', 'flat-db-press', 'dip'],
    proTips: [
      'Have a training partner place a plate on your upper back for load.',
      'Wide hand position (1.5× shoulder width) shifts emphasis to chest over triceps.',
      'Elevate feet on a bench to create an incline angle for upper chest emphasis.'
    ],
    scienceTip:
      'Weighted push-ups produce equivalent pec activation to barbell bench press when loads are matched, ' +
      'with the added benefit of training serratus anterior for shoulder stability (Calatayud et al. 2015).'
  },

  // ═══════════════════ FUNCTIONAL / CONDITIONING ══════════════════════════════

  {
    id: 'farmers-carry',
    name: "Farmer's Carry",
    primaryMuscles: ['traps', 'forearms', 'core'],
    secondaryMuscles: ['glutes', 'calves', 'erector-spinae'],
    equipment: ['dumbbells', 'barbell'],
    movementPattern: 'carry',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['suitcase-carry', 'overhead-carry', 'deadlift'],
    proTips: [
      'Stand tall, shoulders back and down, walk with controlled steps.',
      'Use the heaviest dumbbells you can control with good posture for 20-40 metres.',
      'Great finisher for any session -- builds grip, traps, and core stability simultaneously.'
    ],
    scienceTip:
      "Farmer's carries activate the entire lateral stabilising system of the spine, " +
      "training the very muscles most critical for lumbar stability without disc compression."
  },

  {
    id: 'suitcase-carry',
    name: 'Suitcase Carry (Unilateral)',
    primaryMuscles: ['obliques', 'core-deep-stabilisers', 'traps'],
    secondaryMuscles: ['glutes', 'forearms', 'lats'],
    equipment: ['dumbbells'],
    movementPattern: 'carry',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['farmers-carry', 'pallof-press', 'side-plank'],
    proTips: [
      'Carry a single dumbbell in one hand while resisting lateral lean.',
      'Contralateral oblique fires intensely to keep you upright.',
      'Keep hips level -- do not hike the hip on the loaded side.'
    ],
    scienceTip:
      'Unilateral loaded carries are among the most effective anti-lateral-flexion exercises, ' +
      'training the quadratus lumborum and obliques for real-world spinal stability.'
  },

  // ═══════════════════ BARBELL PRESSING ═══════════════════════════════════════

  {
    id: 'barbell-overhead-press',
    name: 'Barbell Overhead Press (Standing)',
    primaryMuscles: ['anterior-deltoid', 'medial-deltoid', 'triceps'],
    secondaryMuscles: ['upper-trapezius', 'serratus-anterior', 'core'],
    equipment: ['barbell', 'plates'],
    movementPattern: 'push',
    lowerBackRisk: 'medium',
    lowerBackNote:
      'Standing OHP loads the lumbar spine under axial compression. ' +
      'Prefer seated DB shoulder press for lower back safety.',
    difficulty: 'intermediate',
    commonSubstitutions: ['seated-db-shoulder-press', 'arnold-press', 'landmine-press'],
    proTips: [
      'Brace hard -- standing OHP requires total-body tension to protect the lumbar spine.',
      'Bar path should travel in front of the face, not out and around.',
      'Lean back slightly as the bar passes your head -- then vertically lock out overhead.'
    ],
    scienceTip:
      'Standing overhead press produces significantly higher erector spinae activation than seated, ' +
      'making it a true strength exercise but riskier for those with lumbar issues.'
  },

  {
    id: 'landmine-press',
    name: 'Landmine Press',
    primaryMuscles: ['anterior-deltoid', 'upper-chest-clavicular'],
    secondaryMuscles: ['triceps', 'serratus-anterior', 'core'],
    equipment: ['barbell', 'plates'],
    movementPattern: 'push',
    lowerBackRisk: 'low',
    difficulty: 'intermediate',
    lowerBackNote:
      'Arc motion reduces overhead stress. Load is lighter than barbell OHP. Safe for most lower back conditions.',
    commonSubstitutions: ['seated-db-shoulder-press', 'incline-db-press', 'cable-fly'],
    proTips: [
      'Anchor one end of the barbell in a corner or plate (landmine attachment).',
      'Press from shoulder level, following the arc upward and outward.',
      'Single-arm landmine press adds unilateral anti-rotation core demand.'
    ],
    scienceTip:
      'Landmine press provides a shoulder-friendly pressing arc that reduces impingement risk compared to ' +
      'vertical overhead pressing, making it an excellent substitute for athletes with shoulder issues.'
  },

  // ═══════════════════ BICEPS (additional) ════════════════════════════════════

  {
    id: 'cable-rope-curl',
    name: 'Cable Rope Curl',
    primaryMuscles: ['biceps-brachii', 'brachialis'],
    secondaryMuscles: ['brachioradialis'],
    equipment: ['cable-machine'],
    movementPattern: 'isolation',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['barbell-curl', 'db-hammer-curl', 'cable-curl'],
    proTips: [
      'Rope allows a natural wrist path -- slightly supinating at the top for full bicep contraction.',
      'Allow full elbow extension at the bottom -- do not cut the range of motion.',
      'Great finisher after heavier straight-bar or barbell curl work.'
    ],
    scienceTip:
      'The neutral-to-supinated wrist path of a rope curl activates both the brachialis ' +
      'and biceps brachii through their full functional range.'
  },

  // ═══════════════════ LEGS (additional) ═══════════════════════════════════════

  {
    id: 'reverse-lunge',
    name: 'Reverse Lunge (DB)',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'adductors', 'core'],
    equipment: ['dumbbells'],
    movementPattern: 'squat',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    lowerBackNote:
      'Reverse lunges are lower back safer than forward lunges -- the eccentric deceleration ' +
      'occurs at the hip, not the knee, reducing spinal shear forces.',
    commonSubstitutions: ['bulgarian-split-squat', 'goblet-squat', 'step-up'],
    proTips: [
      'Step backward, not forward -- this reduces the braking force through the knee.',
      'Keep the front shin vertical and the torso upright.',
      'Use dumbbells at your sides for balance and minimal spinal load.'
    ],
    scienceTip:
      'Reverse lunges produce near-identical quad and glute activation to forward lunges ' +
      'with 30% less knee joint stress and minimal lumbar demand.'
  },

  {
    id: 'step-up',
    name: 'Step-Up (DB)',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'adductors', 'core'],
    equipment: ['dumbbells', 'bench'],
    movementPattern: 'squat',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['bulgarian-split-squat', 'goblet-squat', 'reverse-lunge'],
    proTips: [
      'Step onto a bench (or step) with the entire foot -- heel should not hang off.',
      'Drive through the working heel, not the toes, to emphasise glutes.',
      'Keep the non-working leg only lightly touching the floor between reps.'
    ],
    scienceTip:
      'Step-ups produce unilateral quad and glute loading without bilateral compensation -- ' +
      'ensuring both legs are trained equally and identifying any strength asymmetries.'
  },

  {
    id: 'db-hip-thrust',
    name: 'Dumbbell Hip Thrust',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'quadriceps', 'core'],
    equipment: ['dumbbells', 'bench'],
    movementPattern: 'hinge',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['hip-thrust', 'cable-pull-through', 'glute-bridge'],
    proTips: [
      'Dumbbell version: hold one or two dumbbells in the hip crease.',
      'Upper back on bench, feet flat, knees 90° at the top position.',
      'Squeeze glutes hard at the top -- posterior pelvic tilt to maximise glute activation.'
    ],
    scienceTip:
      'Glute activation peaks at hip extension -- the top position of the hip thrust. ' +
      'Dumbbell hip thrusts allow progressive loading without barbell equipment.'
  },

  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise (DB)',
    primaryMuscles: ['soleus'],
    secondaryMuscles: ['gastrocnemius'],
    equipment: ['dumbbells', 'bench'],
    movementPattern: 'isolation',
    lowerBackRisk: 'low',
    difficulty: 'beginner',
    commonSubstitutions: ['standing-calf-raise', 'leg-press-calf-raise'],
    proTips: [
      'Sit on a bench, plate under feet for range of motion, dumbbell on your knees.',
      'Bent-knee position deactivates gastrocnemius and isolates the soleus.',
      'Soleus has high slow-twitch fibre content -- perform high reps (20-30) with a full stretch.'
    ],
    scienceTip:
      'Soleus is the larger of the two calf muscles by volume and is only fully isolated ' +
      'with the knee bent. Neglecting seated calf work means neglecting the majority of the calf.'
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 -- STORAGE KEY HELPERS (mirrors conventions in storage.js)
// ═══════════════════════════════════════════════════════════════════════════════

export const programKeys = {
  // program:<id> → program metadata
  program: (id) => `program:${id}`,
  // program:<id>:days → array of day objects
  programDays: (id) => `program:${id}:days`,
  // programs:index → array of all program ids
  programsIndex: () => 'programs:index',
  // exercises:<id> → single exercise object
  exercise: (id) => `exercises:${id}`,
  // exercises:index → array of all exercise ids
  exercisesIndex: () => 'exercises:index',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 -- SEED FUNCTION
// For use in a one-time seed script or an admin route.
// Usage: import { seedPrograms } from '$lib/programData'; await seedPrograms(kv);
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Seed all programs and exercises into the Redis KV store.
 * Safe to re-run -- overwrites existing keys with the same data.
 *
 * @param {import('./kv.js').kv} kv - the kv client from $lib/kv
 */
export async function seedPrograms(kv) {
  const ops = [];

  // 1. Write programs index
  const programIds = programs.map((p) => p.id);
  ops.push(kv.set(programKeys.programsIndex(), JSON.stringify(programIds)));

  // 2. Write each program metadata
  for (const program of programs) {
    ops.push(kv.set(programKeys.program(program.id), JSON.stringify(program)));
  }

  // 3. Write program days
  const allDayArrays = [
    { id: 'chest-focus-4day', days: chestFocus4DayDays },
    { id: 'ppl-4day', days: [...ppl4DayDays, ...ppl4DayWeek2Days] },
    { id: 'upper-lower-4day', days: upperLower4DayDays },
    { id: 'arnold-4day', days: arnold4DayDays },
    { id: 'full-body-4day', days: fullBody4DayDays },
  ];

  for (const { id, days } of allDayArrays) {
    ops.push(kv.set(programKeys.programDays(id), JSON.stringify(days)));
  }

  // 4. Write exercises index
  const exerciseIds = exercises.map((e) => e.id);
  ops.push(kv.set(programKeys.exercisesIndex(), JSON.stringify(exerciseIds)));

  // 5. Write each exercise
  for (const exercise of exercises) {
    ops.push(kv.set(programKeys.exercise(exercise.id), JSON.stringify(exercise)));
  }

  await Promise.all(ops);

  return {
    programs: programIds.length,
    dayArrays: allDayArrays.length,
    exercises: exerciseIds.length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 -- READ HELPERS (complement storage.js)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch all program metadata objects.
 * @param {object} kv
 * @returns {Promise<object[]>}
 */
export async function getAllPrograms(kv) {
  const raw = await kv.get(programKeys.programsIndex());
  if (!raw) return [];
  const ids = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const raws = await Promise.all(ids.map((id) => kv.get(programKeys.program(id))));
  return raws
    .filter(Boolean)
    .map((r) => (typeof r === 'string' ? JSON.parse(r) : r));
}

/**
 * Fetch a single program's metadata.
 * @param {object} kv
 * @param {string} programId
 * @returns {Promise<object | null>}
 */
export async function getProgram(kv, programId) {
  const raw = await kv.get(programKeys.program(programId));
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

/**
 * Fetch all days for a program.
 * @param {object} kv
 * @param {string} programId
 * @returns {Promise<object[]>}
 */
export async function getProgramDays(kv, programId) {
  const raw = await kv.get(programKeys.programDays(programId));
  if (!raw) return [];
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

/**
 * Fetch all exercises.
 * @param {object} kv
 * @returns {Promise<object[]>}
 */
export async function getAllExercises(kv) {
  const raw = await kv.get(programKeys.exercisesIndex());
  if (!raw) return [];
  const ids = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const raws = await Promise.all(ids.map((id) => kv.get(programKeys.exercise(id))));
  return raws
    .filter(Boolean)
    .map((r) => (typeof r === 'string' ? JSON.parse(r) : r));
}

/**
 * Fetch a single exercise by id.
 * @param {object} kv
 * @param {string} exerciseId
 * @returns {Promise<object | null>}
 */
export async function getExercise(kv, exerciseId) {
  const raw = await kv.get(programKeys.exercise(exerciseId));
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

/**
 * Fetch exercises filtered by muscle group.
 * @param {object} kv
 * @param {string} muscleGroup - e.g. 'chest', 'quads', 'biceps'
 * @returns {Promise<object[]>}
 */
export async function getExercisesByMuscle(kv, muscleGroup) {
  const all = await getAllExercises(kv);
  return all.filter(
    (e) =>
      e.primaryMuscles?.some((m) => m.includes(muscleGroup)) ||
      e.secondaryMuscles?.some((m) => m.includes(muscleGroup))
  );
}

/**
 * Fetch exercises filtered by lower back risk level.
 * @param {object} kv
 * @param {'low' | 'medium' | 'high'} riskLevel
 * @returns {Promise<object[]>}
 */
export async function getExercisesByLowerBackRisk(kv, riskLevel) {
  const all = await getAllExercises(kv);
  return all.filter((e) => e.lowerBackRisk === riskLevel);
}
