// Server-only module
// Claude AI integration for workout plan generation.
// Uses Sonnet 4.6 with structured outputs + prompt caching.

import { env } from '$env/dynamic/private';
import { VOLUME_LANDMARKS, calculate1RM } from './intensityCalc.js';

const MODEL = 'claude-sonnet-4-6';
const API_URL = 'https://api.anthropic.com/v1/messages';

// ─── System Prompt (4096+ tokens for prompt caching on Haiku) ───────────────

function buildVolumeLandmarksText() {
  return Object.entries(VOLUME_LANDMARKS)
    .map(([muscle, v]) => `  ${muscle}: MEV ${v.mev}, MAV ${v.mav[0]}-${v.mav[1]}, MRV ${v.mrv} sets/week`)
    .join('\n');
}

export const SYSTEM_PROMPT = `You are an evidence-based exercise program designer. You create personalized workout programs grounded in peer-reviewed research. You ALWAYS output valid JSON matching the provided schema.

## RESEARCH-BASED RULES (you must follow all of these)

### Volume Dose-Response
- Target 10-20 direct weekly sets per muscle group for trained lifters (Schoenfeld 2017, Baz-Valle 2022).
- Per-session limit: 6-10 hard sets per muscle group before diminishing returns with 2+ min rest (Krieger, Pelland 2026).
- Volume landmarks by muscle group (Israetel/RP):
${buildVolumeLandmarksText()}

### Frequency
- Train each muscle group at least 2x/week to distribute volume across sessions (Schoenfeld 2016).
- When volume is equated, frequency itself has negligible impact — the benefit is avoiding per-session diminishing returns (Schoenfeld 2019, Pelland 2026).

### Periodization (Daily Undulating — DUP)
- Use DUP within each week (Williams 2017 meta-analysis: DUP shows greater 1RM gains than linear for trained individuals).
- Heavy day: 5 reps at RPE 9. Moderate day: 8 reps at RPE 8. Hypertrophy day: 12 reps at RPE 7.5.
- Progress RPE slightly week-over-week within the mesocycle (Week 1 baseline → Week 4 push).
- DUP primarily benefits strength; hypertrophy is driven by progressive volume regardless of periodization model (Grgic 2017).

### Deload
- Week 5 of each 5-week mesocycle is a deload week: 60% of normal volume, 60% intensity (RPE 6-7).
- Deloading restores mTOR signaling responsiveness after chronic training (Ogasawara 2013, Jacko 2022).
- Deload sets: 2 per exercise, lighter weight, focus on form and recovery.

### Exercise Selection
- Prioritize stretch-mediated (lengthened-position) exercises — they produce equal or superior hypertrophy (Wolf 2023, Pedrosa 2022).
- Vary angles for regional hypertrophy within muscles. Incline press at 30 degrees targets the clavicular (upper) chest; above 45 degrees anterior deltoid dominates (Rodriguez-Ridao 2020, Chavez 2020).
- Rotate exercises between weeks to overcome the repeated bout effect and enhance regional adaptations (Kassiano 2022).
- Prioritize compound movements first, isolation second.
- Machines and cables have equivalent hypertrophy to free weights with better stimulus-to-fatigue ratio (Saeterbakken 2023). Use them later in sessions when fatigued.

### Time-Efficient Techniques
- Drop sets on final sets: 50-70% time savings with equivalent hypertrophy (Coleman 2022, Sodal 2023). One drop set with 2-3 drops replaces 2-3 traditional sets.
- Agonist-antagonist supersets: 36% session time reduction, equivalent hypertrophy, more total reps (Zhang 2025, Burke 2024). Pair opposing muscles (chest+back, biceps+triceps).
- Rest-pause on compound final sets: hit failure, rest 15-20 sec, continue to failure. 30-50% time savings (Prestes 2019, Enes 2021).
- Apply these techniques to the FINAL set of each exercise, not all sets. Earlier sets should be straight sets with proper rest.

### Concurrent Training (Cardio + Weights)
- Cycling or low-impact cardio before upper-body weights has negligible interference with hypertrophy (Schumann 2022 mega-analysis, 43 studies).
- Running produces more interference than cycling due to eccentric muscle damage (Wilson 2012).
- Ending with resistance training preserves mTOR activation (Ogasawara 2014).
- Concurrent training reduces more fat mass than resistance alone while preserving lean mass (JISSN 2025 meta-analysis).

### Equipment Constraint (CRITICAL)
- ONLY prescribe exercises that the user's available equipment supports.
- NEVER include an exercise requiring equipment the user does not have.
- If the user has limited equipment, substitute with bodyweight or available-equipment alternatives.

### Rep Prescriptions (CRITICAL)
- Always prescribe exact integer rep targets, NEVER ranges.
- WRONG: "reps": "8-10" or "reps": "8-10"
- CORRECT: "reps": 8 or "reps": 10
- The RPE system handles intensity calibration — the rep target is a specific number to aim for.

### Physical Therapy & Mobility
- If the user requests PT/mobility work, include 2-3 mobility exercises as warmup or cooldown.
- Target the specific areas the user mentions (shoulders, lower back, knees, hips, wrists).
- Keep PT exercises low intensity (RPE 3-5) with higher reps (15-20).
- Common PT exercises: band pull-aparts, face pulls, dead hangs, cat-cow, hip 90/90, ankle circles, wrist circles, bird-dogs, clamshells.

### Cardio Programming
- If the user wants cardio integrated, include it according to their preference:
  - "Before lifting": 15-30 min moderate cardio as warmup. Include in the day's exercise list as the first entry.
  - "After lifting": 15-30 min cardio as cooldown. Include as the last entry.
  - "Separate days": Create dedicated cardio-only days within the weekly plan.
- Specify cardio type if the user has a preference. Default to the type with least interference (cycling > rowing > running).

## EXERCISE DATABASE BY EQUIPMENT

### Full Gym (all equipment available)
Chest: Flat barbell bench press, incline dumbbell press (30 deg), cable fly, pec deck, decline barbell press, dumbbell fly, machine chest press
Back: Lat pulldown (wide/neutral grip), cable row (seated), barbell row, dumbbell row, T-bar row, face pull, straight-arm pulldown, pull-up
Shoulders: Overhead press (barbell/dumbbell), cable lateral raise, reverse pec deck, Arnold press, machine shoulder press, upright row
Biceps: Barbell curl, dumbbell curl, preacher curl, cable curl, hammer curl, incline dumbbell curl, concentration curl
Triceps: Cable pushdown (rope/bar), overhead dumbbell extension, skull crushers, close-grip bench press, dips (tricep focus), cable overhead extension
Legs: Back squat, front squat, leg press, Romanian deadlift, leg curl, leg extension, Bulgarian split squat, hip thrust, calf raise (seated/standing), goblet squat
Core: Cable woodchop, hanging leg raise, ab wheel rollout, Pallof press, plank variations, cable crunch

### Home Dumbbells (dumbbells + bench + pull-up bar)
Chest: Dumbbell bench press (flat/incline), dumbbell fly, push-up variations (weighted, decline, diamond)
Back: Dumbbell row, pull-up/chin-up, renegade row, chest-supported dumbbell row
Shoulders: Dumbbell overhead press, lateral raise, reverse fly, Arnold press
Biceps: Dumbbell curl, hammer curl, incline curl, concentration curl
Triceps: Overhead dumbbell extension, dumbbell kickback, close-grip push-up, diamond push-up
Legs: Goblet squat, Romanian deadlift (dumbbell), Bulgarian split squat, lunges, step-up, hip thrust (dumbbell), calf raise (dumbbell)
Core: Weighted plank, dumbbell woodchop, hanging leg raise (pull-up bar), Russian twist

### Bodyweight Only (pull-up bar optional)
Chest: Push-up variations (standard, decline, diamond, wide, archer, pike)
Back: Pull-up, chin-up, inverted row (table or bar), Superman hold
Shoulders: Pike push-up, handstand push-up (wall), lateral raise (band if available)
Biceps: Chin-up (supinated grip), isometric curl (towel)
Triceps: Diamond push-up, bench dip, tricep push-up
Legs: Pistol squat, Bulgarian split squat, jump squat, wall sit, Nordic curl, single-leg hip thrust, calf raise
Core: Plank, hollow body hold, leg raise, mountain climber, dead bug, bird-dog

## HOW TO BUILD A PROGRAM

1. Determine the split based on days/week:
   - 3 days: Full body A/B/C or Upper/Lower/Full
   - 4 days: Upper/Lower x2 or Push/Pull x2
   - 5 days: Upper/Lower/Push/Pull/Full or PPL + Upper/Lower
   - 6 days: Push/Pull/Legs x2

2. Allocate volume per muscle group using the volume landmarks. Prioritize user's focus muscles with extra volume (closer to MAV high). Non-focus muscles get MEV to MAV low.

3. Apply DUP: vary rep targets across training days for the same muscle group. Day A might be 5 reps (strength), Day B might be 12 reps (hypertrophy).

4. Select exercises matching the user's equipment. Prioritize compounds first, isolation second. Rotate exercise selection between weeks.

5. For weeks 1-4: progressively increase RPE (Week 1: RPE 7-8, Week 4: RPE 8-9.5). Week 5 is deload.

6. If the user has injuries or limitations, avoid exercises that stress those areas. Provide safe alternatives.

7. Honor the user's session duration constraint. If time is limited, use more drop sets and supersets to compress volume.

8. Include the user's free-form preferences verbatim — these override defaults when they conflict.
9. Keep all text fields short — plain, direct language. No filler words.`;

// ─── Plan JSON Schema for Structured Outputs ────────────────────────────────

const EXERCISE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Exercise name' },
    equipment: { type: 'string', description: 'Equipment needed' },
    muscleGroup: { type: 'string', description: 'Primary muscle group targeted' },
    sets: { type: 'integer', description: 'Number of sets' },
    reps: { type: 'integer', description: 'Exact rep target (integer, NOT a range)' },
    rpe: { type: 'number', description: 'Target RPE (6-10)' },
    rest: { type: 'integer', description: 'Rest between sets in seconds' },
    cue: { type: 'string', description: 'Form cue — 1 short sentence' },
    tip: { type: 'string', description: 'Key tip — 1 short sentence' },
    technique: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
      description: 'Advanced technique on final set: "drop-set", "rest-pause", "superset", or null'
    },
    techniqueNote: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
      description: 'Brief technique instruction, max 10 words'
    },
    supersetWith: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
      description: 'Name of exercise to superset with, or null'
    },
    isCardio: {
      type: 'boolean',
      description: 'True if this is a cardio entry (warmup/cooldown)'
    },
    isMobility: {
      type: 'boolean',
      description: 'True if this is a PT/mobility exercise'
    }
  },
  required: ['name', 'equipment', 'muscleGroup', 'sets', 'reps', 'rpe', 'rest', 'cue', 'tip', 'technique', 'techniqueNote', 'supersetWith', 'isCardio', 'isMobility'],
  additionalProperties: false
};

const DAY_SCHEMA = {
  type: 'object',
  properties: {
    dayNumber: { type: 'integer', description: 'Day number within the week (1-based)' },
    name: { type: 'string', description: 'Day name (e.g., "Upper Body - Push")' },
    focus: { type: 'string', description: 'Muscle groups targeted (e.g., "Chest + Shoulders + Triceps")' },
    targetDuration: { type: 'integer', description: 'Estimated session duration in minutes' },
    exercises: {
      type: 'array',
      items: EXERCISE_SCHEMA,
      description: 'Ordered list of exercises for this day'
    }
  },
  required: ['dayNumber', 'name', 'focus', 'targetDuration', 'exercises'],
  additionalProperties: false
};

const WEEK_SCHEMA = {
  type: 'object',
  properties: {
    weekNumber: { type: 'integer', description: 'Week number in the mesocycle (1-5)' },
    theme: { type: 'string', description: 'Week theme (e.g., "Accumulation", "Intensification", "Deload")' },
    isDeload: { type: 'boolean', description: 'Whether this is a deload week' },
    days: {
      type: 'array',
      items: DAY_SCHEMA,
      description: 'Training days for this week'
    }
  },
  required: ['weekNumber', 'theme', 'isDeload', 'days'],
  additionalProperties: false
};

export const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    programName: { type: 'string', description: 'Name of the program' },
    programDescription: { type: 'string', description: 'Brief description of the program approach' },
    totalWeeks: { type: 'integer', description: 'Total weeks in the mesocycle (typically 5)' },
    daysPerWeek: { type: 'integer', description: 'Training days per week' },
    weeks: {
      type: 'array',
      items: WEEK_SCHEMA,
      description: 'All weeks in the mesocycle'
    }
  },
  required: ['programName', 'programDescription', 'totalWeeks', 'daysPerWeek', 'weeks'],
  additionalProperties: false
};

// ─── Progressive Generation Schemas ─────────────────────────────────────────

const DAY_OVERVIEW_SCHEMA = {
  type: 'object',
  properties: {
    dayNumber: { type: 'integer', description: 'Day number within the week (1-based)' },
    name: { type: 'string', description: 'Day name (e.g., "Upper Body - Push")' },
    focus: { type: 'string', description: 'Muscle groups targeted' },
    targetDuration: { type: 'integer', description: 'Estimated session duration in minutes' }
  },
  required: ['dayNumber', 'name', 'focus', 'targetDuration'],
  additionalProperties: false
};

const WEEK_OVERVIEW_SCHEMA = {
  type: 'object',
  properties: {
    weekNumber: { type: 'integer', description: 'Week number in the mesocycle (1-based)' },
    theme: { type: 'string', description: 'Week theme (e.g., "Accumulation", "Intensification")' },
    isDeload: { type: 'boolean', description: 'Whether this is planned as a deload week' },
    focusNote: { type: 'string', description: 'One sentence: what changes this week vs previous' },
    days: {
      type: 'array',
      items: DAY_OVERVIEW_SCHEMA,
      description: 'Day splits for this week (names + focus, no exercises)'
    }
  },
  required: ['weekNumber', 'theme', 'isDeload', 'focusNote', 'days'],
  additionalProperties: false
};

export const SKELETON_SCHEMA = {
  type: 'object',
  properties: {
    programName: { type: 'string', description: 'Name of the program' },
    programDescription: { type: 'string', description: '2–3 sentence overview of the program approach' },
    totalWeeks: { type: 'integer', description: 'Planned weeks in the mesocycle (typically 4-7, deload is autoregulated)' },
    daysPerWeek: { type: 'integer', description: 'Training days per week' },
    weekOverviews: {
      type: 'array',
      items: WEEK_OVERVIEW_SCHEMA,
      description: 'High-level structure for all weeks — themes, day splits, focus areas. No exercises.'
    }
  },
  required: ['programName', 'programDescription', 'totalWeeks', 'daysPerWeek', 'weekOverviews'],
  additionalProperties: false
};

const REMAINING_DAYS_SCHEMA = {
  type: 'object',
  properties: {
    days: {
      type: 'array',
      items: DAY_SCHEMA,
      description: 'Remaining days for the week (all days except Day 1, which was already generated)'
    }
  },
  required: ['days'],
  additionalProperties: false
};

// ─── Build user message from profile + history ──────────────────────────────

function buildUserMessage(profile, history) {
  const parts = [];

  parts.push(`Generate a ${profile.totalWeeks || 5}-week workout program for this user:`);

  // Body stats — helps calibrate intensity and volume
  if (profile.age) parts.push(`- Age: ${profile.age}`);
  if (profile.bodyWeight) parts.push(`- Body weight: ${profile.bodyWeight} lbs`);
  if (profile.bodyFat) parts.push(`- Body fat: ~${profile.bodyFat}%`);
  if (profile.trainingAge) {
    const trainingAgeLabels = {
      'none': 'Complete beginner (never trained)',
      'under1': 'Under 1 year of training',
      '1to3': '1-3 years of consistent training',
      '3to5': '3-5 years of training (experienced)',
      '5plus': '5+ years of training (veteran)'
    };
    parts.push(`- Training history: ${trainingAgeLabels[profile.trainingAge] || profile.trainingAge}`);
  }

  parts.push(`- Equipment: ${profile.equipment?.join(', ') || 'Full gym'}`);
  parts.push(`- Goal: ${profile.goal || 'Build muscle'}`);
  parts.push(`- Days per week: ${profile.daysPerWeek || 4}`);
  parts.push(`- Experience level: ${profile.experience || 'Intermediate'}`);

  if (profile.sessionDuration) {
    parts.push(`- Session duration: ${profile.sessionDuration} minutes`);
  }
  if (profile.focusMuscles?.length) {
    parts.push(`- Muscle group focus (allocate extra volume): ${profile.focusMuscles.join(', ')}`);
  }
  if (profile.cardio && profile.cardio !== 'none') {
    parts.push(`- Cardio: ${profile.cardio}${profile.cardioType ? ` (${profile.cardioType})` : ''}${profile.cardioDuration ? `, ${profile.cardioDuration} min` : ''}`);
  }
  if (profile.mobility?.length) {
    parts.push(`- Include PT/mobility for: ${profile.mobility.join(', ')}`);
  }
  if (profile.injuries) {
    parts.push(`- Injuries/limitations (AVOID exercises that aggravate these): ${profile.injuries}`);
  }
  if (profile.freeformNotes) {
    parts.push(`- Additional preferences: ${profile.freeformNotes}`);
  }

  // Performance history for regeneration
  if (history) {
    parts.push('\n## RECENT PERFORMANCE DATA (use this to adapt the new program)');

    if (history.averageRPE) {
      parts.push(`- Average RPE across sessions: ${history.averageRPE}`);
    }
    if (history.painExercises?.length) {
      parts.push(`- Exercises causing pain (DO NOT include): ${history.painExercises.join(', ')}`);
    }
    if (history.tooEasyExercises?.length) {
      parts.push(`- Exercises reported as too easy (increase difficulty or swap): ${history.tooEasyExercises.join(', ')}`);
    }
    if (history.tooHardExercises?.length) {
      parts.push(`- Exercises reported as too hard (decrease difficulty or swap): ${history.tooHardExercises.join(', ')}`);
    }
    if (history.completionRate !== undefined) {
      parts.push(`- Session completion rate: ${Math.round(history.completionRate * 100)}%`);
    }
    if (history.summary) {
      parts.push(`- Performance summary: ${history.summary}`);
    }
  }

  return parts.join('\n');
}

function buildDayMessage(profile, currentDay, history) {
  const parts = [];

  parts.push(`Regenerate ONLY Day ${currentDay.dayNumber} (${currentDay.name}) of the user's program.`);
  parts.push(`Keep the same day name, focus, and duration. Choose DIFFERENT exercises than these:`);

  for (const ex of currentDay.exercises) {
    parts.push(`  - ${ex.name} (${ex.muscleGroup})`);
  }

  parts.push(`\nUser profile:`);
  parts.push(`- Equipment: ${profile.equipment?.join(', ') || 'Full gym'}`);
  parts.push(`- Goal: ${profile.goal || 'Build muscle'}`);
  parts.push(`- Experience: ${profile.experience || 'Intermediate'}`);

  if (profile.injuries) {
    parts.push(`- Injuries/limitations: ${profile.injuries}`);
  }

  if (history?.painExercises?.length) {
    parts.push(`- DO NOT include: ${history.painExercises.join(', ')}`);
  }

  parts.push(`\nReturn a single day object (not a full program). Match the day schema exactly.`);

  return parts.join('\n');
}

// ─── Progressive Generation Prompt Builders ─────────────────────────────────

function buildProfileBlock(profile) {
  const parts = [];
  if (profile.age) parts.push(`- Age: ${profile.age}`);
  if (profile.bodyWeight) parts.push(`- Body weight: ${profile.bodyWeight} lbs`);
  if (profile.bodyFat) parts.push(`- Body fat: ~${profile.bodyFat}%`);
  if (profile.trainingAge) {
    const labels = {
      'none': 'Complete beginner', 'under1': 'Under 1 year',
      '1to3': '1-3 years', '3to5': '3-5 years', '5plus': '5+ years'
    };
    parts.push(`- Training history: ${labels[profile.trainingAge] || profile.trainingAge}`);
  }
  parts.push(`- Equipment: ${profile.equipment?.join(', ') || 'Full gym'}`);
  parts.push(`- Goal: ${profile.goal || 'Build muscle'}`);
  parts.push(`- Days per week: ${profile.daysPerWeek || 4}`);
  if (profile.sessionDuration) parts.push(`- Session duration: ${profile.sessionDuration} min`);
  if (profile.focusMuscles?.length) parts.push(`- Focus muscles (extra volume): ${profile.focusMuscles.join(', ')}`);
  if (profile.cardio && profile.cardio !== 'none') {
    parts.push(`- Cardio: ${profile.cardio}${profile.cardioType ? ` (${profile.cardioType})` : ''}`);
  }
  if (profile.mobility) parts.push(`- Include PT/mobility work`);
  if (profile.injuries) parts.push(`- Injuries/limitations: ${profile.injuries}`);
  if (profile.freeformNotes) parts.push(`- Additional preferences: ${profile.freeformNotes}`);
  return parts.join('\n');
}

function buildSkeletonMessage(profile) {
  return `Design a program SKELETON (structure only, NO exercises) for this user:

${buildProfileBlock(profile)}

Return:
- A program name and description
- ${profile.daysPerWeek || 4} training days per week
- 5 week overviews with themes, day splits (names + focus areas), and progression notes
- Week 1 should be an INTRODUCTORY/CALIBRATION week (conservative RPE 6-7, baseline volume at MEV)
- Weeks 2-4 progressively increase intensity and volume
- Week 5 is a tentative deload (actual deload timing will be autoregulated based on fatigue data)

Do NOT include any exercises. Only the program structure and weekly themes.`;
}

function buildTestDayMessage(profile, skeleton) {
  const week1 = skeleton.weekOverviews?.[0];
  const day1 = week1?.days?.[0];

  return `Generate Day 1 exercises for this user's INTRODUCTORY/CALIBRATION session.

## PROGRAM CONTEXT
Program: ${skeleton.programName} — ${skeleton.programDescription}
This is Week 1 (${week1?.theme || 'Introduction'}), Day 1: ${day1?.name || 'Training Day'} — ${day1?.focus || 'Full Body'}
Target duration: ${day1?.targetDuration || profile.sessionDuration || 60} minutes

## CALIBRATION RULES
- This is the user's FIRST session — keep RPE conservative (6-7 max, NEVER above 7)
- Volume at MEV (minimum effective volume) — 2-3 sets per exercise
- Include a mix of compound and isolation movements to assess strength across muscle groups
- The user's performance data from this session will calibrate the rest of their program
- Choose exercises that establish clear weight baselines for future sessions

## USER PROFILE
${buildProfileBlock(profile)}

Return a single day object with dayNumber: 1.`;
}

function buildRemainingDaysMessage(profile, skeleton, day1Results) {
  const week1 = skeleton.weekOverviews?.[0];
  const remainingDays = week1?.days?.slice(1) || [];

  const parts = [`Generate the remaining ${remainingDays.length} days of Week 1 (intro/calibration week).`];

  parts.push(`\n## PROGRAM CONTEXT`);
  parts.push(`Program: ${skeleton.programName}`);
  parts.push(`Week 1: ${week1?.theme || 'Introduction'} — conservative RPE 6-7, volume at MEV`);

  parts.push(`\n## DAY STRUCTURE (generate exercises for each)`);
  for (const d of remainingDays) {
    parts.push(`- Day ${d.dayNumber}: ${d.name} — ${d.focus} (~${d.targetDuration} min)`);
  }

  parts.push(`\n## DAY 1 PERFORMANCE DATA (calibrate from this)`);
  if (day1Results) {
    if (day1Results.exercises?.length) {
      parts.push(`Exercises completed:`);
      for (const ex of day1Results.exercises) {
        const bestSet = ex.actual?.reduce((best, s) =>
          (s.weight > (best?.weight || 0)) ? s : best, null);
        const est1RM = bestSet ? calculate1RM(bestSet.weight, bestSet.reps) : null;
        const avgRPE = ex.actual?.length
          ? (ex.actual.reduce((sum, s) => sum + (s.rpe || 0), 0) / ex.actual.length).toFixed(1)
          : 'N/A';
        parts.push(`  - ${ex.name} (${ex.muscleGroup}): best set ${bestSet?.weight || '?'}lbs × ${bestSet?.reps || '?'}, avg RPE ${avgRPE}${est1RM ? `, est 1RM: ${est1RM}lbs` : ''}${ex.feedback !== 'good' ? ` [${ex.feedback}]` : ''}`);
      }
    }
    if (day1Results.painExercises?.length) {
      parts.push(`\nExercises causing PAIN (DO NOT include these or similar movements): ${day1Results.painExercises.join(', ')}`);
    }
    if (day1Results.rpeGap) {
      parts.push(`RPE calibration: prescribed vs actual gap = ${day1Results.rpeGap > 0 ? '+' : ''}${day1Results.rpeGap.toFixed(1)} (${day1Results.rpeGap > 0.5 ? 'plan was too hard' : day1Results.rpeGap < -0.5 ? 'plan was too easy' : 'well calibrated'})`);
    }
    if (day1Results.actualDuration && day1Results.targetDuration) {
      const ratio = day1Results.actualDuration / day1Results.targetDuration;
      parts.push(`Session duration: ${day1Results.actualDuration} min (target was ${day1Results.targetDuration} min)${ratio > 1.2 ? ' — REDUCE exercises to fit time' : ratio < 0.8 ? ' — can add exercises' : ''}`);
    }
  }

  parts.push(`\n## CALIBRATION RULES (still intro week)`);
  parts.push(`- Keep RPE 6-7 (conservative, establishing baselines)`);
  parts.push(`- Volume at MEV (2-3 sets per exercise)`);
  parts.push(`- Use Day 1 weights as reference for related muscle groups`);
  parts.push(`- Avoid exercises that caused pain in Day 1`);

  parts.push(`\n## USER PROFILE`);
  parts.push(buildProfileBlock(profile));

  return parts.join('\n');
}

function buildWeekMessage(profile, weekNumber, skeleton, history, prevWeekExercises) {
  const weekOverview = skeleton.weekOverviews?.find(w => w.weekNumber === weekNumber);
  const parts = [];

  parts.push(`Generate Week ${weekNumber} exercises for this user's program.`);

  parts.push(`\n## PROGRAM CONTEXT`);
  parts.push(`Program: ${skeleton.programName} — ${skeleton.programDescription}`);
  parts.push(`Week ${weekNumber} of ${skeleton.totalWeeks}: "${weekOverview?.theme || 'Training'}" (${weekOverview?.focusNote || ''})`);

  if (history?.deloadRecommended) {
    parts.push(`\n⚠️ DELOAD RECOMMENDED based on fatigue indicators:`);
    for (const reason of (history.deloadReasons || [])) {
      parts.push(`  - ${reason}`);
    }
    parts.push(`Generate a DELOAD week: 60% volume, RPE 6-7, 2 sets per exercise.`);
  }

  parts.push(`\n## THIS WEEK'S STRUCTURE`);
  for (const d of (weekOverview?.days || [])) {
    parts.push(`- Day ${d.dayNumber}: ${d.name} — ${d.focus} (~${d.targetDuration} min)`);
  }

  if (prevWeekExercises?.length) {
    parts.push(`\n## PREVIOUS WEEK'S EXERCISES (rotate/vary from these)`);
    for (const day of prevWeekExercises) {
      const names = day.exercises?.map(e => e.name).join(', ') || 'none';
      parts.push(`Day ${day.dayNumber}: ${names}`);
    }
  }

  if (history) {
    parts.push(`\n## PERFORMANCE DATA FROM PREVIOUS WEEKS`);

    if (history.averageRPE) parts.push(`- Average RPE: ${history.averageRPE}`);
    if (history.rpeGap) parts.push(`- RPE calibration gap: ${history.rpeGap > 0 ? '+' : ''}${history.rpeGap.toFixed(1)} (${history.rpeGap > 0.5 ? 'reduce intensity' : history.rpeGap < -0.5 ? 'increase intensity' : 'well calibrated'})`);

    if (history.painExercises?.length) parts.push(`- PAIN exercises (EXCLUDE): ${history.painExercises.join(', ')}`);
    if (history.tooEasyExercises?.length) parts.push(`- Too easy (increase difficulty): ${history.tooEasyExercises.join(', ')}`);
    if (history.tooHardExercises?.length) parts.push(`- Too hard (decrease difficulty): ${history.tooHardExercises.join(', ')}`);

    if (history.effectiveSetsPerMuscle) {
      parts.push(`- Effective sets per muscle group (last week):`);
      for (const [muscle, sets] of Object.entries(history.effectiveSetsPerMuscle)) {
        const landmark = VOLUME_LANDMARKS[muscle.toLowerCase()];
        const zone = landmark
          ? sets < landmark.mev ? 'BELOW MEV' : sets > landmark.mrv ? 'ABOVE MRV' : sets > landmark.mav[1] ? 'near MRV' : 'in MAV'
          : '';
        parts.push(`    ${muscle}: ${sets.toFixed(1)} sets ${zone}`);
      }
    }

    if (history.strengthTrends?.length) {
      parts.push(`- Strength trends:`);
      for (const t of history.strengthTrends) {
        parts.push(`    ${t.exercise}: est 1RM ${t.trend} (${t.current}lbs)`);
      }
    }

    if (history.rpeDrift !== undefined) {
      parts.push(`- Session RPE drift: ${history.rpeDrift.toFixed(1)} (${history.rpeDrift > 1.5 ? 'HIGH — consider reducing volume' : 'normal'})`);
    }

    if (history.completionRate !== undefined) {
      parts.push(`- Completion rate: ${Math.round(history.completionRate * 100)}%${history.completionRate < 0.8 ? ' — LOW, reduce volume or exercises' : ''}`);
    }

    if (history.readinessAvg !== undefined) {
      parts.push(`- Avg readiness: ${history.readinessAvg.toFixed(1)}/5 (${history.readinessAvg < 2.5 ? 'LOW — user is fatigued' : 'adequate'})`);
    }

    if (history.sessionDurationRatio) {
      parts.push(`- Session duration accuracy: ${Math.round(history.sessionDurationRatio * 100)}% of target${history.sessionDurationRatio > 1.2 ? ' — reduce exercises' : history.sessionDurationRatio < 0.8 ? ' — can add exercises' : ''}`);
    }

    if (history.summary) parts.push(`- Summary: ${history.summary}`);

    // Overload lever guidance
    parts.push(`\n## OVERLOAD STRATEGY FOR WEEK ${weekNumber}`);
    if (weekNumber <= 2) {
      parts.push(`Priority: REPS — fill out rep targets before adding weight. Keep RPE 7-8.`);
    } else if (weekNumber <= 3) {
      parts.push(`Priority: LOAD — increase weight on exercises where reps are consistently hit. RPE 8-8.5.`);
    } else if (weekNumber <= 4) {
      parts.push(`Priority: VOLUME + TECHNIQUES — add sets where recovery allows. Use drop sets/rest-pause on final sets. RPE 8.5-9.5.`);
    } else {
      parts.push(`Priority: MAINTAIN — this is late in the mesocycle. Watch for fatigue signals.`);
    }
  }

  parts.push(`\n## USER PROFILE`);
  parts.push(buildProfileBlock(profile));

  return parts.join('\n');
}

// ─── API Call ────────────────────────────────────────────────────────────────

async function callClaude(userMessage, schema, maxTokens = 16000) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable.');
  }

  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [
      { role: 'user', content: userMessage }
    ],
    output_config: {
      format: {
        type: 'json_schema',
        schema
      }
    }
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();

  // Check stop_reason for truncation or refusal
  if (result.stop_reason === 'max_tokens') {
    console.error(`[callClaude] Response truncated (max_tokens=${maxTokens}). Increase token limit.`);
    throw new Error('AI response was too long and got cut off. Please try again.');
  }

  if (result.stop_reason === 'refusal') {
    console.error('[callClaude] Claude refused the request.');
    throw new Error('AI could not generate a plan for this request.');
  }

  // Extract JSON from the text content block
  const textBlock = result.content?.find((b) => b.type === 'text');
  if (!textBlock?.text) {
    throw new Error('No text content in Claude response');
  }

  try {
    return JSON.parse(textBlock.text);
  } catch (parseErr) {
    console.error('[callClaude] JSON parse failed:', parseErr.message, 'Response length:', textBlock.text.length, 'stop_reason:', result.stop_reason);
    throw new Error('AI returned invalid data. Please try again.');
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate a full multi-week workout plan.
 * @param {object} profile - User profile from onboarding config
 * @param {object} [history] - Aggregated workout history for regeneration
 * @returns {Promise<object>} The plan JSON matching PLAN_SCHEMA
 */
export async function generatePlan(profile, history = null) {
  const message = buildUserMessage(profile, history);
  const plan = await callClaude(message, PLAN_SCHEMA);
  const validation = validatePlan(plan);
  if (!validation.valid) {
    console.warn('Plan validation warnings:', validation.errors);
  }
  return plan;
}

/**
 * Regenerate a single day's exercises.
 * @param {object} profile - User profile
 * @param {object} currentDay - The current day object to replace
 * @param {object} [history] - Aggregated workout history
 * @returns {Promise<object>} A single day object matching DAY_SCHEMA
 */
export async function generateDay(profile, currentDay, history = null) {
  const message = buildDayMessage(profile, currentDay, history);
  return callClaude(message, DAY_SCHEMA, 4096);
}

// ─── Progressive Generation Functions ───────────────────────────────────────

/**
 * Generate the program skeleton (structure only, no exercises).
 * @param {object} profile - User profile from onboarding
 * @returns {Promise<object>} Skeleton matching SKELETON_SCHEMA
 */
export async function generateSkeleton(profile) {
  const message = buildSkeletonMessage(profile);
  return callClaude(message, SKELETON_SCHEMA, 2048);
}

/**
 * Generate Day 1 (calibration/test day) exercises.
 * @param {object} profile - User profile
 * @param {object} skeleton - Program skeleton
 * @returns {Promise<object>} Day object matching DAY_SCHEMA
 */
export async function generateTestDay(profile, skeleton) {
  const message = buildTestDayMessage(profile, skeleton);
  return callClaude(message, DAY_SCHEMA, 2048);
}

/**
 * Generate remaining days of Week 1 after Day 1 completion.
 * @param {object} profile - User profile
 * @param {object} skeleton - Program skeleton
 * @param {object} day1Results - Day 1 workout data with actual performance
 * @returns {Promise<object>} Object with days[] matching REMAINING_DAYS_SCHEMA
 */
export async function generateRemainingDays(profile, skeleton, day1Results) {
  const message = buildRemainingDaysMessage(profile, skeleton, day1Results);
  return callClaude(message, REMAINING_DAYS_SCHEMA, 8192);
}

/**
 * Generate a single week's exercises, calibrated from history.
 * @param {object} profile - User profile
 * @param {number} weekNumber - Which week to generate
 * @param {object} skeleton - Program skeleton
 * @param {object} history - Expanded history summary
 * @param {object[]} [prevWeekExercises] - Previous week's days (for exercise rotation)
 * @returns {Promise<object>} Week object matching WEEK_SCHEMA
 */
export async function generateWeek(profile, weekNumber, skeleton, history, prevWeekExercises = null) {
  const message = buildWeekMessage(profile, weekNumber, skeleton, history, prevWeekExercises);
  return callClaude(message, WEEK_SCHEMA, 8192);
}

/**
 * Validate a plan object structurally.
 * Structured outputs should guarantee this, but belt-and-suspenders.
 * @param {object} plan
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePlan(plan) {
  const errors = [];

  if (!plan.weeks || !Array.isArray(plan.weeks)) {
    errors.push('Missing or invalid "weeks" array');
    return { valid: false, errors };
  }

  for (const week of plan.weeks) {
    if (!week.days || !Array.isArray(week.days)) {
      errors.push(`Week ${week.weekNumber}: missing "days" array`);
      continue;
    }
    for (const day of week.days) {
      if (!day.exercises || !Array.isArray(day.exercises)) {
        errors.push(`Week ${week.weekNumber} Day ${day.dayNumber}: missing "exercises" array`);
        continue;
      }
      for (const ex of day.exercises) {
        if (!ex.name) errors.push(`Week ${week.weekNumber} Day ${day.dayNumber}: exercise missing "name"`);
        if (typeof ex.reps !== 'number') {
          errors.push(`Week ${week.weekNumber} Day ${day.dayNumber} ${ex.name}: "reps" must be integer, got ${typeof ex.reps}`);
        }
        if (typeof ex.sets !== 'number') {
          errors.push(`Week ${week.weekNumber} Day ${day.dayNumber} ${ex.name}: "sets" must be integer, got ${typeof ex.sets}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Build a performance history summary from workout logs.
 * Enhanced with 10 derived metrics for progressive calibration.
 * @param {object[]} workoutLogs - Array of saved workout log objects
 * @returns {object} Aggregated history for feeding to Claude
 */
export function buildHistorySummary(workoutLogs) {
  if (!workoutLogs?.length) return null;

  const allRPEs = [];
  const exerciseFeedback = {};
  const rpeGaps = []; // prescribed vs actual
  const exerciseHistory = {}; // { name: [{ date, weight, reps, rpe, est1RM }] }
  const muscleGroupSets = {}; // { muscle: effectiveSets }
  const sessionDurations = [];
  const readinessScores = [];
  const sessionRPEDrifts = [];
  const dayCompletionMap = {}; // { dayNumber: count }

  for (const log of workoutLogs) {
    // Readiness data
    if (log.readiness) {
      const avg = (
        (log.readiness.sleep || 3) +
        (log.readiness.stress ? (6 - log.readiness.stress) : 3) + // invert stress: high stress = low readiness
        (log.readiness.soreness ? (6 - log.readiness.soreness) : 3) + // invert soreness
        (log.readiness.energy || 3)
      ) / 4;
      readinessScores.push(avg);
    }

    // Session duration
    if (log.startedAt && log.completedAt) {
      const duration = (new Date(log.completedAt) - new Date(log.startedAt)) / 60000;
      if (duration > 0 && duration < 300) sessionDurations.push(duration);
    }

    // Day adherence
    if (log.dayNumber) {
      dayCompletionMap[log.dayNumber] = (dayCompletionMap[log.dayNumber] || 0) + 1;
    }

    // Per-exercise tracking
    const sessionFirstRPEs = [];
    const sessionLastRPEs = [];

    for (let exIdx = 0; exIdx < (log.exercises || []).length; exIdx++) {
      const ex = log.exercises[exIdx];

      for (const set of (ex.actual || [])) {
        if (set.rpe) allRPEs.push(set.rpe);

        // RPE gap: actual vs prescribed
        if (set.rpe && ex.prescribed?.rpe) {
          rpeGaps.push(set.rpe - ex.prescribed.rpe);
        }
      }

      // Effective sets per muscle group (weighted by RPE proximity to failure)
      const muscle = (ex.muscleGroup || '').toLowerCase().split(',')[0].trim();
      if (muscle) {
        if (!muscleGroupSets[muscle]) muscleGroupSets[muscle] = 0;
        for (const set of (ex.actual || [])) {
          if (!set.completed) continue;
          const rpe = set.rpe || 7;
          // Weight by proximity to failure: RPE 10=1.0, 9=1.0, 8=1.0, 7=0.75, 6=0.5, <=5=0.25
          const weight = rpe >= 8 ? 1.0 : rpe >= 7 ? 0.75 : rpe >= 6 ? 0.5 : 0.25;
          muscleGroupSets[muscle] += weight;
        }
      }

      // Exercise-level feedback
      if (ex.feedback && ex.feedback !== 'good') {
        if (!exerciseFeedback[ex.name]) exerciseFeedback[ex.name] = [];
        exerciseFeedback[ex.name].push(ex.feedback);
      }

      // Track exercise history for strength trends and 1RM
      const bestSet = (ex.actual || []).reduce((best, s) =>
        (s.completed && s.weight > (best?.weight || 0)) ? s : best, null);
      if (bestSet && bestSet.weight > 0) {
        if (!exerciseHistory[ex.name]) exerciseHistory[ex.name] = [];
        exerciseHistory[ex.name].push({
          date: log.date,
          weight: bestSet.weight,
          reps: bestSet.reps,
          rpe: bestSet.rpe,
          est1RM: calculate1RM(bestSet.weight, bestSet.reps)
        });
      }

      // RPE drift tracking (first vs last exercise in session)
      const exAvgRPE = ex.actual?.length
        ? ex.actual.reduce((s, set) => s + (set.rpe || 0), 0) / ex.actual.length
        : null;
      if (exAvgRPE !== null) {
        if (exIdx < 2) sessionFirstRPEs.push(exAvgRPE);
        if (exIdx >= (log.exercises.length - 2)) sessionLastRPEs.push(exAvgRPE);
      }
    }

    // Session RPE drift
    if (sessionFirstRPEs.length && sessionLastRPEs.length) {
      const firstAvg = sessionFirstRPEs.reduce((a, b) => a + b, 0) / sessionFirstRPEs.length;
      const lastAvg = sessionLastRPEs.reduce((a, b) => a + b, 0) / sessionLastRPEs.length;
      sessionRPEDrifts.push(lastAvg - firstAvg);
    }
  }

  // Basic aggregations
  const painExercises = [];
  const tooEasyExercises = [];
  const tooHardExercises = [];

  for (const [name, feedbacks] of Object.entries(exerciseFeedback)) {
    if (feedbacks.filter((f) => f === 'pain').length >= 1) painExercises.push(name);
    if (feedbacks.filter((f) => f === 'too_easy').length >= 2) tooEasyExercises.push(name);
    if (feedbacks.filter((f) => f === 'too_hard').length >= 2) tooHardExercises.push(name);
  }

  const completedSessions = workoutLogs.filter((l) => l.completedAt).length;
  const completionRate = workoutLogs.length > 0 ? completedSessions / workoutLogs.length : 1;

  // Strength trends (for exercises with 2+ sessions of data)
  const strengthTrends = [];
  for (const [name, history] of Object.entries(exerciseHistory)) {
    if (history.length >= 2) {
      const sorted = history.sort((a, b) => a.date.localeCompare(b.date));
      const recent = sorted[sorted.length - 1];
      const prev = sorted[sorted.length - 2];
      const diff = recent.est1RM - prev.est1RM;
      const trend = diff > 2 ? 'increasing' : diff < -2 ? 'declining' : 'stable';
      strengthTrends.push({ exercise: name, trend, current: recent.est1RM, change: diff });
    }
  }

  // RPE gap
  const rpeGap = rpeGaps.length > 0
    ? rpeGaps.reduce((a, b) => a + b, 0) / rpeGaps.length
    : null;

  // RPE drift
  const rpeDrift = sessionRPEDrifts.length > 0
    ? sessionRPEDrifts.reduce((a, b) => a + b, 0) / sessionRPEDrifts.length
    : undefined;

  // Session duration ratio (average actual / typical target of 60 min)
  const avgDuration = sessionDurations.length > 0
    ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
    : null;

  // Readiness average
  const readinessAvg = readinessScores.length > 0
    ? readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length
    : undefined;

  // Effective sets per muscle group (normalize to per-week by dividing by weeks of data)
  const weeksOfData = Math.max(1, Math.ceil(workoutLogs.length / 3)); // rough estimate
  const effectiveSetsPerMuscle = {};
  for (const [muscle, sets] of Object.entries(muscleGroupSets)) {
    effectiveSetsPerMuscle[muscle] = sets / weeksOfData;
  }

  return {
    averageRPE: allRPEs.length > 0 ? (allRPEs.reduce((a, b) => a + b, 0) / allRPEs.length).toFixed(1) : null,
    rpeGap,
    painExercises,
    tooEasyExercises,
    tooHardExercises,
    completionRate,
    effectiveSetsPerMuscle,
    strengthTrends,
    rpeDrift,
    readinessAvg,
    sessionDurationRatio: avgDuration ? avgDuration / 60 : null,
    summary: `${workoutLogs.length} sessions, ${completedSessions} completed.${avgDuration ? ` Avg duration: ${Math.round(avgDuration)} min.` : ''}${readinessAvg !== undefined ? ` Avg readiness: ${readinessAvg.toFixed(1)}/5.` : ''}`
  };
}

/**
 * Summarize Day 1 results for remaining-days generation.
 * @param {object} day1Workout - The saved workout log from Day 1
 * @returns {object} Processed Day 1 data for the AI prompt
 */
export function summarizeDay1Results(day1Workout) {
  if (!day1Workout?.exercises?.length) return null;

  const exercises = day1Workout.exercises.map(ex => {
    const bestSet = (ex.actual || []).reduce((best, s) =>
      (s.completed && s.weight > (best?.weight || 0)) ? s : best, null);
    return {
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      actual: ex.actual,
      feedback: ex.feedback,
      prescribed: ex.prescribed,
      est1RM: bestSet ? calculate1RM(bestSet.weight, bestSet.reps) : null
    };
  });

  const painExercises = exercises.filter(e => e.feedback === 'pain').map(e => e.name);

  // RPE gap
  const gaps = [];
  for (const ex of exercises) {
    for (const set of (ex.actual || [])) {
      if (set.rpe && ex.prescribed?.rpe) {
        gaps.push(set.rpe - ex.prescribed.rpe);
      }
    }
  }
  const rpeGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;

  // Duration
  let actualDuration = null;
  if (day1Workout.startedAt && day1Workout.completedAt) {
    actualDuration = Math.round((new Date(day1Workout.completedAt) - new Date(day1Workout.startedAt)) / 60000);
  }

  return {
    exercises,
    painExercises,
    rpeGap,
    actualDuration,
    targetDuration: 60 // default
  };
}
