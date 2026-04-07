// Server-only module
// Claude AI integration for workout plan generation.
// Uses Haiku 4.5 with structured outputs + prompt caching.

import { env } from '$env/dynamic/private';
import { VOLUME_LANDMARKS } from './intensityCalc.js';

const MODEL = 'claude-haiku-4-5-20251001';
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

8. Include the user's free-form preferences verbatim — these override defaults when they conflict.`;

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
    cue: { type: 'string', description: 'Form cue for the lifter' },
    tip: { type: 'string', description: 'Research-backed tip or context' },
    technique: {
      type: ['string', 'null'],
      description: 'Advanced technique on final set: "drop-set", "rest-pause", "superset", or null'
    },
    techniqueNote: {
      type: ['string', 'null'],
      description: 'Details for the technique (e.g., "Reduce weight 25%, continue to failure")'
    },
    supersetWith: {
      type: ['string', 'null'],
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
  required: ['name', 'equipment', 'muscleGroup', 'sets', 'reps', 'rpe', 'rest', 'cue', 'tip']
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
  required: ['dayNumber', 'name', 'focus', 'targetDuration', 'exercises']
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
  required: ['weekNumber', 'theme', 'isDeload', 'days']
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

// ─── API Call ────────────────────────────────────────────────────────────────

async function callClaude(userMessage, schema, maxTokens = 8192) {
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

  // Extract JSON from the text content block
  const textBlock = result.content?.find((b) => b.type === 'text');
  if (!textBlock?.text) {
    throw new Error('No text content in Claude response');
  }

  return JSON.parse(textBlock.text);
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
 * @param {object[]} workoutLogs - Array of saved workout log objects
 * @returns {object} Aggregated history for feeding to Claude
 */
export function buildHistorySummary(workoutLogs) {
  if (!workoutLogs?.length) return null;

  const allRPEs = [];
  const exerciseFeedback = {};

  for (const log of workoutLogs) {
    for (const ex of (log.exercises || [])) {
      // Collect actual RPEs
      for (const set of (ex.actual || [])) {
        if (set.rpe) allRPEs.push(set.rpe);
      }
      // Collect exercise-level feedback
      if (ex.feedback && ex.feedback !== 'good') {
        if (!exerciseFeedback[ex.name]) exerciseFeedback[ex.name] = [];
        exerciseFeedback[ex.name].push(ex.feedback);
      }
    }
  }

  const painExercises = [];
  const tooEasyExercises = [];
  const tooHardExercises = [];

  for (const [name, feedbacks] of Object.entries(exerciseFeedback)) {
    const painCount = feedbacks.filter((f) => f === 'pain').length;
    const easyCount = feedbacks.filter((f) => f === 'too_easy').length;
    const hardCount = feedbacks.filter((f) => f === 'too_hard').length;

    if (painCount >= 1) painExercises.push(name);
    if (easyCount >= 2) tooEasyExercises.push(name);
    if (hardCount >= 2) tooHardExercises.push(name);
  }

  const completedSessions = workoutLogs.filter((l) => l.completedAt).length;
  const completionRate = workoutLogs.length > 0 ? completedSessions / workoutLogs.length : 1;

  return {
    averageRPE: allRPEs.length > 0 ? (allRPEs.reduce((a, b) => a + b, 0) / allRPEs.length).toFixed(1) : null,
    painExercises,
    tooEasyExercises,
    tooHardExercises,
    completionRate,
    summary: `${workoutLogs.length} sessions over last 4 weeks, ${completedSessions} completed.`
  };
}
