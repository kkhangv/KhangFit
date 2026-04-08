// ─── Intensity Calculation Module ────────────────────────────────────────────
//
// Pure JS module for strength training calculations:
//   - 1RM estimation (multiple formulas)
//   - %1RM training zones
//   - RPE-to-%1RM conversion (Tuchscherer / RTS table)
//   - Volume landmarks (Israetel / RP)
//   - Working weight calculator
//   - Periodization helpers
//
// No app-specific imports — usable standalone.
// ─────────────────────────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — 1RM CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Estimate one-rep max from a weight and rep count.
 *
 * @param {number} weight   - Weight lifted
 * @param {number} reps     - Repetitions completed (must be >= 1)
 * @param {'auto'|'epley'|'brzycki'|'lombardi'|'oconner'} formula
 *   'auto' uses Brzycki for reps <= 6, Epley for 7-12, and caps at 12 reps
 *   for accuracy. Beyond 12 reps, estimates become unreliable.
 * @returns {number} Estimated 1RM rounded to nearest 0.5
 */
export function calculate1RM(weight, reps, formula = 'auto') {
  if (reps < 1) return 0;
  if (reps === 1) return weight;

  let estimated;

  switch (formula) {
    case 'brzycki':
      estimated = weight * (36 / (37 - reps));
      break;

    case 'epley':
      estimated = weight * (1 + reps / 30);
      break;

    case 'lombardi':
      estimated = weight * Math.pow(reps, 0.10);
      break;

    case 'oconner':
      estimated = weight * (1 + reps * 0.025);
      break;

    case 'auto':
    default:
      if (reps <= 6) {
        // Brzycki is more accurate at low rep ranges
        estimated = weight * (36 / (37 - reps));
      } else {
        // Epley is more accurate at moderate rep ranges (7-12)
        estimated = weight * (1 + reps / 30);
      }
      break;
  }

  // Round to nearest 0.5
  return Math.round(estimated * 2) / 2;
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — %1RM TRAINING ZONES
// ═══════════════════════════════════════════════════════════════════════════════

export const TRAINING_ZONES = {
  absolute_strength:    { min: 0.93, max: 1.00, reps: '1-2',        description: 'Neural efficiency, max strength' },
  strength:             { min: 0.85, max: 0.92, reps: '2-4',        description: 'Strength + some hypertrophy' },
  strength_hypertrophy: { min: 0.75, max: 0.84, reps: '5-8',        description: 'Mixed: strength + muscle growth' },
  hypertrophy:          { min: 0.67, max: 0.75, reps: '8-12',       description: 'Primary hypertrophy stimulus' },
  hypertrophy_endurance:{ min: 0.60, max: 0.67, reps: '12-15',      description: 'Hypertrophy + endurance overlap' },
  endurance:            { min: 0.50, max: 0.60, reps: '15-20',      description: 'Endurance, metabolic stress' },
  power:                { min: 0.30, max: 0.60, reps: '1-5 (fast)', description: 'Rate of force development' },
};

/**
 * Determine which training zone a given %1RM falls into.
 * Power zone is excluded from automatic detection since it overlaps
 * with other zones and depends on movement velocity, not just load.
 *
 * @param {number} percent1RM - Value between 0 and 1 (e.g. 0.85 = 85%)
 * @returns {string|null} Zone key or null if out of range
 */
export function getTrainingZone(percent1RM) {
  // Check non-overlapping zones from highest to lowest
  if (percent1RM >= 0.93) return 'absolute_strength';
  if (percent1RM >= 0.85) return 'strength';
  if (percent1RM >= 0.75) return 'strength_hypertrophy';
  if (percent1RM >= 0.67) return 'hypertrophy';
  if (percent1RM >= 0.60) return 'hypertrophy_endurance';
  if (percent1RM >= 0.50) return 'endurance';
  if (percent1RM >= 0.30) return 'power';
  return null;
}

/**
 * Convert a %1RM to an estimated rep count using the inverse Epley formula.
 * Epley: weight = 1RM * (1 + reps/30)  =>  reps = 30 * (1/percent - 1)
 *
 * @param {number} percent - Fraction of 1RM (e.g. 0.75)
 * @returns {number} Estimated reps (floored, minimum 1)
 */
export function percentToReps(percent) {
  if (percent >= 1) return 1;
  if (percent <= 0) return 0;
  const reps = 30 * (1 / percent - 1);
  return Math.max(1, Math.floor(reps));
}

/**
 * Convert a rep count to an estimated %1RM using the Epley formula.
 * Epley: 1RM = weight * (1 + reps/30)  =>  percent = 1 / (1 + reps/30)
 *
 * @param {number} reps - Number of repetitions
 * @returns {number} Estimated %1RM as a decimal (e.g. 0.75)
 */
export function repsToPercent(reps) {
  if (reps <= 0) return 1;
  if (reps === 1) return 1;
  return Math.round((1 / (1 + reps / 30)) * 1000) / 1000;
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — RPE TO %1RM CONVERSION TABLE (Tuchscherer / RTS)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Each key is a rep count (1-10).
 * Each value maps RPE (6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10) to a %1RM decimal.
 *
 * Based on Mike Tuchscherer's Reactive Training Systems table.
 */
export const RPE_TABLE = {
  1:  { 6: 0.78, 6.5: 0.795, 7: 0.81, 7.5: 0.83,  8: 0.85, 8.5: 0.885, 9: 0.92, 9.5: 0.96, 10: 1.00 },
  2:  { 6: 0.75, 6.5: 0.77,  7: 0.79, 7.5: 0.81,  8: 0.83, 8.5: 0.855, 9: 0.88, 9.5: 0.91, 10: 0.94 },
  3:  { 6: 0.72, 6.5: 0.74,  7: 0.76, 7.5: 0.785, 8: 0.81, 8.5: 0.83,  9: 0.85, 9.5: 0.88, 10: 0.91 },
  4:  { 6: 0.69, 6.5: 0.71,  7: 0.73, 7.5: 0.755, 8: 0.78, 8.5: 0.80,  9: 0.82, 9.5: 0.85, 10: 0.88 },
  5:  { 6: 0.67, 6.5: 0.69,  7: 0.71, 7.5: 0.73,  8: 0.75, 8.5: 0.775, 9: 0.80, 9.5: 0.825,10: 0.85 },
  6:  { 6: 0.65, 6.5: 0.665, 7: 0.68, 7.5: 0.705, 8: 0.73, 8.5: 0.75,  9: 0.77, 9.5: 0.80, 10: 0.83 },
  7:  { 6: 0.62, 6.5: 0.64,  7: 0.66, 7.5: 0.68,  8: 0.70, 8.5: 0.72,  9: 0.74, 9.5: 0.77, 10: 0.80 },
  8:  { 6: 0.60, 6.5: 0.615, 7: 0.63, 7.5: 0.655, 8: 0.68, 8.5: 0.70,  9: 0.72, 9.5: 0.745,10: 0.77 },
  9:  { 6: 0.58, 6.5: 0.595, 7: 0.61, 7.5: 0.63,  8: 0.65, 8.5: 0.67,  9: 0.69, 9.5: 0.715,10: 0.74 },
  10: { 6: 0.56, 6.5: 0.575, 7: 0.59, 7.5: 0.61,  8: 0.63, 8.5: 0.65,  9: 0.67, 9.5: 0.69, 10: 0.71 },
};

/**
 * Look up the %1RM for a given rep count and RPE.
 * Interpolates linearly for half-RPE values not in the table.
 *
 * @param {number} reps - Rep count (1-10)
 * @param {number} rpe  - RPE value (6-10, supports 0.5 increments)
 * @returns {number|null} %1RM as decimal, or null if out of range
 */
export function rpeToPercent1RM(reps, rpe) {
  const clampedReps = Math.min(10, Math.max(1, Math.round(reps)));
  const clampedRPE = Math.min(10, Math.max(6, rpe));

  const row = RPE_TABLE[clampedReps];
  if (!row) return null;

  // Direct lookup
  if (row[clampedRPE] !== undefined) {
    return row[clampedRPE];
  }

  // Linear interpolation for values between table entries
  const lowerRPE = Math.floor(clampedRPE * 2) / 2;
  const upperRPE = Math.ceil(clampedRPE * 2) / 2;

  if (row[lowerRPE] !== undefined && row[upperRPE] !== undefined) {
    const fraction = (clampedRPE - lowerRPE) / (upperRPE - lowerRPE || 1);
    return row[lowerRPE] + fraction * (row[upperRPE] - row[lowerRPE]);
  }

  return null;
}

/**
 * Estimate 1RM from a set performed at a known RPE.
 * Uses the RPE table to find what %1RM the set represents,
 * then back-calculates the true 1RM.
 *
 * @param {number} weight - Weight used
 * @param {number} reps   - Reps performed
 * @param {number} rpe    - RPE rating (6-10)
 * @returns {number|null} Estimated 1RM rounded to nearest 0.5, or null
 */
export function estimate1RMFromRPE(weight, reps, rpe) {
  const percent = rpeToPercent1RM(reps, rpe);
  if (!percent || percent <= 0) return null;

  const estimated = weight / percent;
  return Math.round(estimated * 2) / 2;
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — VOLUME LANDMARKS (Israetel / RP)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Weekly set volume landmarks per muscle group.
 *   mev = Minimum Effective Volume (sets/week to start growing)
 *   mav = Maximum Adaptive Volume range [low, high] (optimal growth zone)
 *   mrv = Maximum Recoverable Volume (beyond this, recovery breaks down)
 *
 * Based on Dr. Mike Israetel's Renaissance Periodization guidelines.
 */
export const VOLUME_LANDMARKS = {
  chest:      { mev: 8,  mav: [12, 20], mrv: 22 },
  back:       { mev: 10, mav: [14, 22], mrv: 25 },
  shoulders:  { mev: 8,  mav: [16, 22], mrv: 26 },
  biceps:     { mev: 8,  mav: [14, 20], mrv: 26 },
  triceps:    { mev: 6,  mav: [10, 14], mrv: 20 },
  quads:      { mev: 8,  mav: [12, 18], mrv: 20 },
  hamstrings: { mev: 6,  mav: [10, 16], mrv: 20 },
  glutes:     { mev: 0,  mav: [4, 12],  mrv: 16 },
  calves:     { mev: 8,  mav: [12, 16], mrv: 20 },
  abs:        { mev: 0,  mav: [16, 20], mrv: 25 },
};

/**
 * Calculate a volume target (sets/week) for a muscle group in a mesocycle.
 *
 * Uses a linear ramp from MEV (week 1) towards MRV over the course of
 * the mesocycle, staying within MAV for most weeks. Deload weeks drop
 * to 50% of MEV.
 *
 * @param {string} muscleGroup - Key from VOLUME_LANDMARKS
 * @param {number} weekNumber  - Current week in the mesocycle (1-based)
 * @param {boolean} isDeload   - Whether this is a deload week
 * @param {number} totalWeeks  - Total weeks in mesocycle before deload (default 4)
 * @returns {number|null} Recommended sets/week, or null if unknown muscle group
 */
export function calcVolumeTarget(muscleGroup, weekNumber, isDeload, totalWeeks = 4) {
  const landmark = VOLUME_LANDMARKS[muscleGroup];
  if (!landmark) return null;

  if (isDeload) {
    // Deload: roughly half of MEV, minimum 2 sets if MEV > 0
    return landmark.mev > 0 ? Math.max(2, Math.round(landmark.mev * 0.5)) : 0;
  }

  const { mev, mav, mrv } = landmark;
  const [mavLow, mavHigh] = mav;

  // Linear progression from MEV toward MRV over the mesocycle
  // Week 1 = MEV, final week = MAV high (approaching MRV but not exceeding)
  const progress = Math.min(1, (weekNumber - 1) / (totalWeeks - 1 || 1));
  const target = mev + progress * (mavHigh - mev);

  // Clamp: never below MEV, never above MRV
  return Math.round(Math.min(mrv, Math.max(mev, target)));
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — WORKING WEIGHT CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate a working weight for a given 1RM, target rep count, and target RPE.
 *
 * @param {number} max1RM     - The lifter's estimated or tested 1RM
 * @param {number} targetReps - Desired reps per set
 * @param {number} targetRPE  - Desired RPE (6-10)
 * @returns {number} Working weight rounded to nearest 2.5 (standard plate increment)
 */
export function calcWorkingWeight(max1RM, targetReps, targetRPE) {
  const percent = rpeToPercent1RM(targetReps, targetRPE);
  if (!percent) {
    // Fallback: use Epley-based percentage
    const epleyPercent = repsToPercent(targetReps);
    return Math.round((max1RM * epleyPercent) / 2.5) * 2.5;
  }
  return Math.round((max1RM * percent) / 2.5) * 2.5;
}

/**
 * Relative strength ratios for common exercises compared to bench press.
 * These are approximate population averages for intermediate male lifters.
 * Used by scaleWeightsFromBench to estimate working weights across exercises.
 */
const BENCH_RATIOS = {
  'bench-press':        1.00,
  'flat-bench-press':   1.00,
  'incline-bench':      0.75,
  'incline-db-press':   0.40,  // per dumbbell
  'decline-bench':      1.05,
  'db-bench-press':     0.42,  // per dumbbell
  'overhead-press':     0.65,
  'seated-ohp':         0.60,
  'db-shoulder-press':  0.33,  // per dumbbell
  'squat':              1.25,
  'back-squat':         1.25,
  'front-squat':        1.00,
  'deadlift':           1.50,
  'sumo-deadlift':      1.45,
  'romanian-deadlift':  0.85,
  'barbell-row':        0.85,
  'pendlay-row':        0.80,
  'db-row':             0.35,  // per dumbbell
  'lat-pulldown':       0.70,
  'pull-up':            0.80,  // bodyweight-relative, approximate
  'barbell-curl':       0.40,
  'db-curl':            0.18,  // per dumbbell
  'tricep-dip':         1.05,  // bodyweight-relative
  'skull-crusher':      0.45,
  'leg-press':          1.75,
  'leg-curl':           0.45,
  'leg-extension':      0.50,
  'calf-raise':         1.10,
  'lateral-raise':      0.12,  // per dumbbell
  'face-pull':          0.35,
};

/**
 * Scale working weights for a list of exercises based on the user's max bench press.
 *
 * @param {number} maxBench - User's bench press 1RM
 * @param {Array<{id: string, targetReps?: number, targetRPE?: number}>} exercises
 *   Array of exercise objects. Each needs at minimum an `id` that matches a key
 *   in BENCH_RATIOS. Optional targetReps (default 8) and targetRPE (default 8).
 * @returns {Object<string, {estimated1RM: number, workingWeight: number, ratio: number}>}
 */
export function scaleWeightsFromBench(maxBench, exercises) {
  const result = {};

  for (const exercise of exercises) {
    const ratio = BENCH_RATIOS[exercise.id];
    if (ratio === undefined) continue;

    const estimated1RM = Math.round(maxBench * ratio * 2) / 2;
    const targetReps = exercise.targetReps || 8;
    const targetRPE = exercise.targetRPE || 8;
    const workingWeight = calcWorkingWeight(estimated1RM, targetReps, targetRPE);

    result[exercise.id] = {
      estimated1RM,
      workingWeight,
      ratio,
    };
  }

  return result;
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — PERIODIZATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Periodization model definitions.
 *
 * Each model contains:
 *   name        - Human-readable name
 *   description - Brief explanation
 *   weeks       - Array of week descriptors with intensity zones per day type
 *   deloadEvery - Number of hard weeks before a deload
 */
export const PERIODIZATION_MODELS = {
  linear: {
    name: 'Linear Periodization',
    description: 'Progressive intensity increase week over week with volume reduction. Classic approach for novice/intermediate lifters.',
    deloadEvery: 4,
    weeks: [
      { week: 1, intensity: 'hypertrophy',           volume: 'high',   rpe: 7,   description: 'Accumulation — high volume, moderate load' },
      { week: 2, intensity: 'hypertrophy',           volume: 'high',   rpe: 7.5, description: 'Accumulation — slight load increase' },
      { week: 3, intensity: 'strength_hypertrophy',  volume: 'medium', rpe: 8,   description: 'Transmutation — heavier loads, less volume' },
      { week: 4, intensity: 'strength',              volume: 'low',    rpe: 8.5, description: 'Realisation — peak intensity, minimal volume' },
    ],
  },

  dup: {
    name: 'Daily Undulating Periodization (DUP)',
    description: 'Varies intensity and volume within each week. Each training day targets a different stimulus. Superior for intermediate+ lifters.',
    deloadEvery: 4,
    dayTypes: {
      heavy:    { intensity: 'strength',              reps: '3-5',  rpe: 8.5, description: 'Max strength focus' },
      moderate: { intensity: 'strength_hypertrophy',  reps: '6-8',  rpe: 8,   description: 'Strength-hypertrophy blend' },
      light:    { intensity: 'hypertrophy',           reps: '10-12',rpe: 7.5, description: 'Hypertrophy / pump work' },
      power:    { intensity: 'power',                 reps: '3-5',  rpe: 7,   description: 'Explosive / speed work' },
    },
    weeks: [
      { week: 1, rpeModifier: 0,    description: 'Baseline week' },
      { week: 2, rpeModifier: 0.25, description: 'Slight RPE bump' },
      { week: 3, rpeModifier: 0.5,  description: 'Push week — approaching limits' },
      { week: 4, rpeModifier: 0,    description: 'Deload — reduce volume 40%' },
    ],
  },

  wup: {
    name: 'Weekly Undulating Periodization (WUP)',
    description: 'Each week focuses on a different training quality. Rotates through accumulation, intensification, and peaking phases.',
    deloadEvery: 4,
    weeks: [
      { week: 1, intensity: 'hypertrophy',           volume: 'high',   rpe: 7,   description: 'Accumulation — high volume hypertrophy' },
      { week: 2, intensity: 'strength_hypertrophy',  volume: 'medium', rpe: 8,   description: 'Intensification — moderate volume, heavier loads' },
      { week: 3, intensity: 'strength',              volume: 'low',    rpe: 9,   description: 'Realisation — low volume, heavy loads' },
      { week: 4, intensity: 'hypertrophy',           volume: 'low',    rpe: 6,   description: 'Deload — recovery week' },
    ],
  },

  block: {
    name: 'Block Periodization',
    description: 'Multi-week blocks each targeting a single quality. Accumulation (hypertrophy) -> Transmutation (strength) -> Realisation (peaking). Best for advanced lifters and competition prep.',
    deloadEvery: 3,
    blocks: [
      {
        name: 'Accumulation',
        weeks: 3,
        intensity: 'hypertrophy',
        volume: 'high',
        rpe: { start: 7, end: 8 },
        description: 'Build work capacity and muscle mass',
      },
      {
        name: 'Transmutation',
        weeks: 3,
        intensity: 'strength_hypertrophy',
        volume: 'medium',
        rpe: { start: 8, end: 9 },
        description: 'Convert size to strength',
      },
      {
        name: 'Realisation',
        weeks: 2,
        intensity: 'strength',
        volume: 'low',
        rpe: { start: 9, end: 10 },
        description: 'Peak strength expression',
      },
    ],
  },
};

/**
 * Get the target intensity zone for a given periodization model, week, and day type.
 *
 * @param {'linear'|'dup'|'wup'|'block'} model - Periodization model key
 * @param {number} weekNumber - Current week in the program (1-based)
 * @param {'heavy'|'moderate'|'light'|'power'|null} dayType
 *   Only used for DUP. Pass null for other models.
 * @returns {{
 *   zone: string,
 *   rpe: number,
 *   volume: string,
 *   description: string,
 *   isDeload: boolean
 * }|null}
 */
export function getWeeklyIntensity(model, weekNumber, dayType = null) {
  const config = PERIODIZATION_MODELS[model];
  if (!config) return null;

  if (model === 'linear' || model === 'wup') {
    const cycleWeek = ((weekNumber - 1) % config.weeks.length) + 1;
    const weekData = config.weeks.find(w => w.week === cycleWeek);
    if (!weekData) return null;

    const isDeload = cycleWeek === config.weeks.length;
    return {
      zone: weekData.intensity,
      rpe: weekData.rpe,
      volume: weekData.volume,
      description: weekData.description,
      isDeload,
    };
  }

  if (model === 'dup') {
    const cycleWeek = ((weekNumber - 1) % config.weeks.length) + 1;
    const weekMod = config.weeks.find(w => w.week === cycleWeek);
    const isDeload = cycleWeek === config.weeks.length;

    const dt = dayType || 'moderate';
    const dayConfig = config.dayTypes[dt];
    if (!dayConfig || !weekMod) return null;

    const adjustedRPE = isDeload
      ? Math.max(6, dayConfig.rpe - 1.5)
      : Math.min(10, dayConfig.rpe + weekMod.rpeModifier);

    return {
      zone: dayConfig.intensity,
      rpe: adjustedRPE,
      volume: isDeload ? 'low' : 'moderate',
      description: `${dayConfig.description} | ${weekMod.description}`,
      isDeload,
    };
  }

  if (model === 'block') {
    const blocks = config.blocks;
    let cumulativeWeeks = 0;

    for (const block of blocks) {
      if (weekNumber <= cumulativeWeeks + block.weeks) {
        const blockWeek = weekNumber - cumulativeWeeks;
        const progress = (blockWeek - 1) / (block.weeks - 1 || 1);
        const rpe = block.rpe.start + progress * (block.rpe.end - block.rpe.start);

        // Deload after every N weeks within a block
        const isDeload = blockWeek % (config.deloadEvery + 1) === 0;

        return {
          zone: block.intensity,
          rpe: isDeload ? Math.max(6, rpe - 2) : Math.round(rpe * 2) / 2,
          volume: isDeload ? 'low' : block.volume,
          description: `${block.name}: ${block.description}`,
          isDeload,
        };
      }
      cumulativeWeeks += block.weeks;
    }

    // Past the end of all blocks — wrap around
    return getWeeklyIntensity(model, ((weekNumber - 1) % cumulativeWeeks) + 1, dayType);
  }

  return null;
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — AUTOREGULATED DELOAD TRIGGERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Evaluate whether a deload is recommended based on accumulated fatigue indicators.
 * Returns { shouldDeload: boolean, reasons: string[] }
 *
 * @param {object} historySummary - Enhanced history summary from buildHistorySummary()
 * @param {number} currentWeekNumber - Which week we're about to generate
 * @returns {{ shouldDeload: boolean, reasons: string[] }}
 */
export function evaluateDeloadTriggers(historySummary, currentWeekNumber) {
  if (!historySummary) return { shouldDeload: false, reasons: [] };

  const reasons = [];

  // 1. Strength decline: est 1RM dropping on 2+ exercises
  const decliningExercises = (historySummary.strengthTrends || [])
    .filter(t => t.trend === 'declining');
  if (decliningExercises.length >= 2) {
    reasons.push(`Strength declining on ${decliningExercises.length} exercises: ${decliningExercises.map(e => e.exercise).join(', ')}`);
  }

  // 2. RPE trending up without load increase
  if (historySummary.rpeGap !== null && historySummary.rpeGap > 1.0) {
    reasons.push(`RPE running ${historySummary.rpeGap.toFixed(1)} points above prescribed — fatigue accumulation`);
  }

  // 3. Completion rate dropping
  if (historySummary.completionRate < 0.8) {
    reasons.push(`Session completion rate at ${Math.round(historySummary.completionRate * 100)}% — below 80% threshold`);
  }

  // 4. Readiness scores declining
  if (historySummary.readinessAvg !== undefined && historySummary.readinessAvg < 2.5) {
    reasons.push(`Average readiness ${historySummary.readinessAvg.toFixed(1)}/5 — below recovery threshold`);
  }

  // 5. RPE drift increasing (intra-session fatigue)
  if (historySummary.rpeDrift !== undefined && historySummary.rpeDrift > 2.0) {
    reasons.push(`High intra-session RPE drift (${historySummary.rpeDrift.toFixed(1)}) — volume may exceed recovery capacity`);
  }

  // Need at least 2 indicators for a strong deload recommendation,
  // or 1 indicator if we're past week 4 (late in mesocycle)
  const threshold = currentWeekNumber >= 5 ? 1 : 2;
  const shouldDeload = reasons.length >= threshold;

  return { shouldDeload, reasons };
}
