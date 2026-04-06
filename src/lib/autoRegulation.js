/**
 * autoRegulation.js
 * Auto-regulation algorithms for the workout tracker.
 *
 * All functions are pure (no side effects) and work with the same log/session
 * shapes already used by storage.js and overload.js, extended with a small
 * number of new fields described inline.
 *
 * Extended session shape (superset of what storage already persists):
 * {
 *   date: string,                    // YYYY-MM-DD
 *   weekNumber: number,              // 1-5 (5 = deload)
 *   dayId: string,                   // 'day1' | 'day2' | 'day3' | 'day4'
 *   sessionRPE: number,              // 1-10  overall session RPE (post-workout)
 *   sorenessRating: number,          // 1-5   soreness the next morning
 *   completionRate: number,          // 0-1   fraction of planned sets completed
 *   cardioSessions: Array<{          // cardio done this week (populated at save time)
 *     modality: 'cycling' | 'running' | 'rowing' | 'other',
 *     intensityZone: 1|2|3|4|5,     // power zone / HR zone
 *     durationMin: number
 *   }>,
 *   exercises: Array<{
 *     exerciseId: string,
 *     sets: Array<{
 *       setNum: number,
 *       plannedWeight: number,
 *       plannedReps: string,         // rep range string e.g. "8-10"
 *       plannedRPE: number,
 *       actualWeight: number,
 *       actualReps: number | 'failure',
 *       actualRPE: number,
 *       completed: boolean
 *     }>,
 *     userFeedback: 'tooEasy' | 'perfect' | 'tooHard' | null
 *   }>
 * }
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const DELOAD_WEEK = 5;

// Fatigue scoring weights (must sum to 1.0)
const FATIGUE_WEIGHTS = {
  sessionRPE:       0.30,
  soreness:         0.25,
  completionRate:   0.20,   // inverted: missed sets → higher fatigue
  consecutiveDays:  0.15,
  deloadRecency:    0.10
};

// Progressive overload
const BARBELL_INCREMENT_LBS  = 5;
const DB_INCREMENT_LBS       = 2.5;
const MIN_DATA_POINTS        = 2;   // sessions needed before making a recommendation

// Volume auto-adjustment (sets per muscle group per week)
const MEV = {
  chest:     10,
  back:      10,
  sideDelts:  6,
  rearDelts:  4,
  biceps:     6,
  triceps:    6,
  abs:        4
};
const MAV = {
  chest:     20,
  back:      20,
  sideDelts: 14,
  rearDelts:  8,
  biceps:    14,
  triceps:   14,
  abs:       10
};

// Deload thresholds
const DELOAD_FATIGUE_THRESHOLD   = 70;   // fatigue score 0-100
const DELOAD_PERFORMANCE_DECLINE = 0.10; // 10% drop in average set weight
const DELOAD_TIME_WEEKS          = 5;    // force deload every N weeks regardless

// Trend detection (sessions)
const TREND_WINDOW = 6;

// Cardio fatigue mapping (contribution to weekly fatigue score 0-100)
// zone × duration → fatigue points (normalised to 30 min baseline)
const CARDIO_ZONE_FATIGUE_PER_MIN = [
  0,    // zone 0 (unused)
  0.2,  // zone 1 – active recovery
  0.4,  // zone 2 – aerobic base
  0.8,  // zone 3 – tempo
  1.4,  // zone 4 – threshold
  2.0   // zone 5 – VO2 max
];

// ─── 1. Readiness / Fatigue Score ────────────────────────────────────────────

/**
 * Calculate a fatigue score (0–100, higher = more fatigued) from recent
 * training history.
 *
 * @param {{
 *   recentSessions: Array<object>,   // last 7 days of sessions, newest first
 *   lastDeloadDate: string | null,   // YYYY-MM-DD or null
 * }} input
 * @returns {{
 *   score: number,           // 0-100
 *   readiness: number,       // 100 - score (0-100, higher = more ready)
 *   label: 'fresh' | 'normal' | 'fatigued' | 'overtrained',
 *   breakdown: object        // individual component scores for UI display
 * }}
 *
 * Algorithm:
 *   1. RPE component  = clamp((latestSessionRPE - 5) / 5, 0, 1) × 100
 *      RPE 5 = baseline; RPE 10 = max fatigue (maps to 100).
 *
 *   2. Soreness component = (sorenessRating - 1) / 4 × 100
 *      Rating 1 = no soreness (0); rating 5 = extremely sore (100).
 *
 *   3. Completion component = (1 - completionRate) × 100
 *      0% missed = 0 fatigue; 100% missed = 100 fatigue.
 *
 *   4. Consecutive days component = clamp(consecutiveDays / 6, 0, 1) × 100
 *      0 consecutive days = 0; 6+ = 100 (cap; 4 days typical training week).
 *
 *   5. Deload recency component = clamp(1 - weeksSinceDeload / 5, 0, 1) × 100
 *      0 weeks since deload = 0 fatigue; 5+ weeks = 100 (time since last rest).
 *
 *   Weighted sum of the five components using FATIGUE_WEIGHTS.
 */
export function calcFatigueScore({ recentSessions = [], lastDeloadDate = null }) {
  // --- component 1: session RPE ---
  const latestSession = recentSessions[0] ?? null;
  const rawRPE = latestSession?.sessionRPE ?? 5; // default to neutral if no data
  const rpeComponent = clamp((rawRPE - 5) / 5, 0, 1) * 100;

  // --- component 2: soreness ---
  const rawSoreness = latestSession?.sorenessRating ?? 1;
  const sorenessComponent = ((rawSoreness - 1) / 4) * 100;

  // --- component 3: completion rate (inverted) ---
  const rawCompletion = latestSession?.completionRate ?? 1;
  const completionComponent = (1 - clamp(rawCompletion, 0, 1)) * 100;

  // --- component 4: consecutive training days ---
  const consecutiveDays = countConsecutiveTrainingDays(recentSessions);
  const consecutiveComponent = clamp(consecutiveDays / 6, 0, 1) * 100;

  // --- component 5: deload recency ---
  const weeksSinceDeload = lastDeloadDate
    ? Math.floor(daysBetween(lastDeloadDate, today()) / 7)
    : DELOAD_TIME_WEEKS; // assume max if never deloaded
  const deloadComponent = clamp(1 - weeksSinceDeload / DELOAD_TIME_WEEKS, 0, 1) * 100;

  const score = Math.round(
    rpeComponent       * FATIGUE_WEIGHTS.sessionRPE     +
    sorenessComponent  * FATIGUE_WEIGHTS.soreness        +
    completionComponent* FATIGUE_WEIGHTS.completionRate  +
    consecutiveComponent * FATIGUE_WEIGHTS.consecutiveDays +
    deloadComponent    * FATIGUE_WEIGHTS.deloadRecency
  );

  const readiness = 100 - score;
  const label =
    score >= 80 ? 'overtrained' :
    score >= 60 ? 'fatigued' :
    score >= 35 ? 'normal' :
    'fresh';

  return {
    score,
    readiness,
    label,
    breakdown: {
      rpeComponent:          Math.round(rpeComponent),
      sorenessComponent:     Math.round(sorenessComponent),
      completionComponent:   Math.round(completionComponent),
      consecutiveComponent:  Math.round(consecutiveComponent),
      deloadComponent:       Math.round(deloadComponent)
    }
  };
}


// ─── 2. Progressive Overload Auto-Algorithm ──────────────────────────────────

/**
 * Decide weight adjustments for an exercise based on multiple recent sessions.
 * Extends the simpler getOverloadRecommendation in overload.js with RPE data
 * and a minimum data-point requirement.
 *
 * @param {{
 *   exerciseId: string,
 *   equipmentType: 'barbell' | 'dumbbell' | 'cable' | 'bodyweight',
 *   prevSessions: Array<{             // newest first, same shape as overload.js
 *     sets: Array<{
 *       plannedWeight: number,
 *       plannedReps: string,
 *       plannedRPE: number,
 *       actualWeight: number,
 *       actualReps: number | 'failure',
 *       actualRPE: number,
 *       completed: boolean
 *     }>,
 *     userFeedback: 'tooEasy' | 'perfect' | 'tooHard' | null
 *   }>,
 *   currentWeek: number               // 1-5
 * }} input
 *
 * @returns {{
 *   action: 'increase' | 'decrease' | 'keep' | 'deload' | 'insufficient_data',
 *   deltaLbs: number,                 // positive = increase, negative = decrease
 *   confidence: 'high' | 'medium' | 'low',
 *   reason: string
 * }}
 *
 * Decision tree (evaluated top to bottom; first match wins):
 *   A. Deload week → always 'deload'
 *   B. Fewer than MIN_DATA_POINTS sessions → 'insufficient_data'
 *   C. Most-recent feedback = 'tooHard' → decrease by 1 increment
 *   D. Last 2 sessions both 'tooEasy' → increase by 1 increment
 *   E. Last session actualRPE > plannedRPE + 2 (avg across sets) → decrease
 *   F. Last session actualRPE < plannedRPE - 2 (avg across sets) → increase
 *   G. Last 2 sessions: all sets hit rep range ceiling AND completion = 100% → increase
 *   H. Last session: any set missed the rep range floor → keep
 *   I. Default → keep
 */
export function getProgressionRecommendation({ exerciseId, equipmentType, prevSessions, currentWeek }) {
  const increment = equipmentType === 'barbell' ? BARBELL_INCREMENT_LBS : DB_INCREMENT_LBS;

  // A. Deload week
  if (currentWeek === DELOAD_WEEK) {
    return { action: 'deload', deltaLbs: 0, confidence: 'high', reason: 'Deload week — use 60% of normal weight.' };
  }

  // B. Not enough data
  if (!prevSessions || prevSessions.length < MIN_DATA_POINTS) {
    return {
      action: 'insufficient_data',
      deltaLbs: 0,
      confidence: 'low',
      reason: `Need at least ${MIN_DATA_POINTS} sessions before making a recommendation.`
    };
  }

  const latest  = prevSessions[0];
  const prev    = prevSessions[1];

  // C. Explicit "too hard" feedback
  if (latest.userFeedback === 'tooHard') {
    return {
      action: 'decrease',
      deltaLbs: -increment,
      confidence: 'high',
      reason: `Marked too hard last session — drop ${increment} lbs.`
    };
  }

  // D. Two consecutive "too easy" sessions
  if (latest.userFeedback === 'tooEasy' && prev?.userFeedback === 'tooEasy') {
    return {
      action: 'increase',
      deltaLbs: increment,
      confidence: 'high',
      reason: `Felt too easy in the last 2 sessions — add ${increment} lbs.`
    };
  }

  // E. RPE overrun: actual RPE is 2+ above planned on average
  const latestRPEDelta = avgRPEDelta(latest.sets);
  if (latestRPEDelta >= 2) {
    return {
      action: 'decrease',
      deltaLbs: -increment,
      confidence: 'medium',
      reason: `Avg RPE was ${latestRPEDelta.toFixed(1)} points above target — reduce weight to keep form.`
    };
  }

  // F. RPE under-run: actual RPE is 2+ below planned on average
  if (latestRPEDelta <= -2) {
    return {
      action: 'increase',
      deltaLbs: increment,
      confidence: 'medium',
      reason: `Avg RPE was ${Math.abs(latestRPEDelta).toFixed(1)} points below target — weight is too easy.`
    };
  }

  // G. Two sessions hitting rep ceiling + full completion
  const latestAllHitCeiling = allSetsHitCeiling(latest.sets);
  const prevAllHitCeiling   = prev ? allSetsHitCeiling(prev.sets) : false;
  const latestFullCompletion = (latest.completionRate ?? completionRateFromSets(latest.sets)) >= 1;

  if (latestAllHitCeiling && prevAllHitCeiling && latestFullCompletion) {
    return {
      action: 'increase',
      deltaLbs: increment,
      confidence: 'high',
      reason: `Hit the top of the rep range in the last 2 sessions with full completion — add ${increment} lbs.`
    };
  }

  // H. Missed rep floor last session
  if (anySetMissedFloor(latest.sets)) {
    return {
      action: 'keep',
      deltaLbs: 0,
      confidence: 'medium',
      reason: 'One or more sets missed the rep range floor — consolidate at this weight.'
    };
  }

  // I. Default
  return {
    action: 'keep',
    deltaLbs: 0,
    confidence: 'low',
    reason: 'Still progressing within the rep range — maintain current weight.'
  };
}


// ─── 3. Volume Auto-Adjustment ───────────────────────────────────────────────

/**
 * Calculate how many sets per muscle group to target this week.
 *
 * Volume ramps from MEV → MAV over 4 weeks (weeks 1-4), then resets on deload.
 *
 * @param {{
 *   muscleGroup: keyof typeof MEV,
 *   currentWeek: number,              // 1-5
 *   weeklyHistory: Array<{            // last 4 weekly summaries, newest first
 *     avgRPE: number,
 *     completionRate: number,
 *     missedSessions: number,
 *     setsCompleted: number
 *   }>
 * }} input
 * @returns {{
 *   targetSets: number,
 *   action: 'ramp' | 'maintain' | 'reduce' | 'deload',
 *   reason: string
 * }}
 *
 * Ramp formula:
 *   progressFraction = (week - 1) / 3    (0 at week 1, 1.0 at week 4)
 *   targetSets = MEV + round(progressFraction × (MAV - MEV))
 *
 * Reduction triggers (any one → reduce by 2 sets, floor at MEV):
 *   - avgRPE of last session > 9.0
 *   - completionRate of last week < 0.85
 *   - 2+ missed sessions in the last week
 *
 * Deload week: targetSets = MEV × 0.5 (rounded up)
 */
export function calcVolumeTarget({ muscleGroup, currentWeek, weeklyHistory = [] }) {
  const mev = MEV[muscleGroup] ?? 8;
  const mav = MAV[muscleGroup] ?? 16;

  // Deload week
  if (currentWeek === DELOAD_WEEK) {
    return {
      targetSets: Math.ceil(mev * 0.5),
      action: 'deload',
      reason: 'Deload week — drop to 50% of MEV.'
    };
  }

  // Check reduction triggers from last week
  const lastWeek = weeklyHistory[0];
  if (lastWeek) {
    const triggerHighRPE    = (lastWeek.avgRPE ?? 0) > 9.0;
    const triggerLowCompl   = (lastWeek.completionRate ?? 1) < 0.85;
    const triggerMissed     = (lastWeek.missedSessions ?? 0) >= 2;

    if (triggerHighRPE || triggerLowCompl || triggerMissed) {
      const reducedSets = Math.max(mev, (lastWeek.setsCompleted ?? mev) - 2);
      const reason = [
        triggerHighRPE  ? 'avg RPE > 9.0' : null,
        triggerLowCompl ? 'completion < 85%' : null,
        triggerMissed   ? '2+ missed sessions' : null
      ].filter(Boolean).join(', ');
      return { targetSets: reducedSets, action: 'reduce', reason: `Volume reduced due to: ${reason}.` };
    }
  }

  // Normal ramp: week 1 → MEV, week 4 → MAV
  const weekClamped = clamp(currentWeek, 1, 4);
  const progressFraction = (weekClamped - 1) / 3;
  const targetSets = Math.round(mev + progressFraction * (mav - mev));

  return {
    targetSets,
    action: currentWeek === 1 ? 'maintain' : 'ramp',
    reason: `Week ${currentWeek} ramp: ${targetSets} sets (MEV ${mev} → MAV ${mav}).`
  };
}


// ─── 4. Intensity Auto-Regulation (in-session RPE) ───────────────────────────

/**
 * Given the actual RPE of the first set, suggest a weight adjustment for
 * remaining sets in the same exercise, and record the modifier to carry forward.
 *
 * @param {{
 *   set1ActualRPE: number,
 *   set1PlannedRPE: number,
 *   set1Weight: number,
 *   equipmentType: 'barbell' | 'dumbbell' | 'cable' | 'bodyweight'
 * }} input
 * @returns {{
 *   adjustmentLbs: number,   // +/- to apply to remaining sets (0 = keep)
 *   carryToNextSession: number, // lbs modifier to remember for next session
 *   reason: string
 * }}
 *
 * Rules:
 *   rpeDelta = actualRPE - plannedRPE
 *
 *   rpeDelta >= +2  → reduce remaining sets by 1 increment
 *                     carryToNextSession = -1 increment
 *   rpeDelta <= -2  → increase remaining sets by 1 increment
 *                     carryToNextSession = +1 increment
 *   |rpeDelta| < 2  → no change; carryToNextSession = 0
 *
 * The carryToNextSession value should be stored in the session log and read
 * by getProgressionRecommendation() when building the next session's plan.
 */
export function inSessionRPEAdjustment({ set1ActualRPE, set1PlannedRPE, set1Weight, equipmentType }) {
  const increment = equipmentType === 'barbell' ? BARBELL_INCREMENT_LBS : DB_INCREMENT_LBS;
  const rpeDelta = set1ActualRPE - set1PlannedRPE;

  if (rpeDelta >= 2) {
    return {
      adjustmentLbs: -increment,
      carryToNextSession: -increment,
      reason: `Set 1 RPE ${set1ActualRPE} vs planned ${set1PlannedRPE} (+${rpeDelta}) — backing off ${increment} lbs for remaining sets.`
    };
  }

  if (rpeDelta <= -2) {
    return {
      adjustmentLbs: increment,
      carryToNextSession: increment,
      reason: `Set 1 RPE ${set1ActualRPE} vs planned ${set1PlannedRPE} (${rpeDelta}) — adding ${increment} lbs to remaining sets.`
    };
  }

  return {
    adjustmentLbs: 0,
    carryToNextSession: 0,
    reason: `Set 1 RPE ${set1ActualRPE} within 2 points of planned ${set1PlannedRPE} — no adjustment needed.`
  };
}


// ─── 5. Trend Analysis ───────────────────────────────────────────────────────

/**
 * Analyse the last TREND_WINDOW sessions for a single exercise and detect
 * performance patterns.
 *
 * @param {Array<{
 *   date: string,
 *   sets: Array<{
 *     actualWeight: number,
 *     actualRPE: number,
 *     actualReps: number | 'failure',
 *     completed: boolean
 *   }>
 * }>} sessions   newest first
 *
 * @returns {{
 *   plateau: boolean,
 *   overreaching: boolean,
 *   underTraining: boolean,
 *   recentPR: boolean,
 *   prWeight: number | null,
 *   trend: 'improving' | 'plateau' | 'declining',
 *   details: string
 * }}
 *
 * Algorithms:
 *
 *   Plateau:
 *     avgWeight per session. If max(avgWeight over last 4 sessions) -
 *     min(avgWeight over last 4 sessions) < 1 increment AND at least 2 weeks
 *     have elapsed → plateau = true.
 *
 *   Overreaching:
 *     If avgRPE in the most-recent 3 sessions is higher than avgRPE in the
 *     3 sessions before that — by 1.0+ point — despite avgWeight not increasing
 *     by more than 1 increment → overreaching = true.
 *
 *   Under-training:
 *     avgRPE across the last 3 sessions is consistently < 6 → underTraining = true.
 *
 *   PR:
 *     maxWeight in the most-recent session > maxWeight in any prior session
 *     in the window → recentPR = true.
 */
export function analyseExerciseTrend(sessions) {
  const empty = { plateau: false, overreaching: false, underTraining: false, recentPR: false, prWeight: null, trend: 'plateau', details: 'Insufficient data.' };

  if (!sessions || sessions.length < 3) return empty;

  const window = sessions.slice(0, TREND_WINDOW);

  // Per-session averages (weight and RPE) — completed sets only
  const sessionStats = window.map((s) => {
    const completedSets = (s.sets ?? []).filter((set) => set.completed !== false && typeof set.actualWeight === 'number');
    if (completedSets.length === 0) return { avgWeight: 0, avgRPE: 0, maxWeight: 0 };
    const avgWeight = avg(completedSets.map((set) => set.actualWeight));
    const avgRPE    = avg(completedSets.filter((set) => typeof set.actualRPE === 'number').map((set) => set.actualRPE));
    const maxWeight = Math.max(...completedSets.map((set) => set.actualWeight));
    return { avgWeight, avgRPE, maxWeight };
  });

  // --- Plateau ---
  let plateau = false;
  if (sessionStats.length >= 4) {
    const last4Weights = sessionStats.slice(0, 4).map((s) => s.avgWeight);
    const weightRange = Math.max(...last4Weights) - Math.min(...last4Weights);
    const weeksElapsed = daysBetween(window[3]?.date, window[0]?.date) / 7;
    plateau = weightRange < BARBELL_INCREMENT_LBS && weeksElapsed >= 2;
  }

  // --- Overreaching ---
  let overreaching = false;
  if (sessionStats.length >= 6) {
    const recentRPE = avg(sessionStats.slice(0, 3).map((s) => s.avgRPE));
    const olderRPE  = avg(sessionStats.slice(3, 6).map((s) => s.avgRPE));
    const recentWeight = avg(sessionStats.slice(0, 3).map((s) => s.avgWeight));
    const olderWeight  = avg(sessionStats.slice(3, 6).map((s) => s.avgWeight));
    const weightGain = recentWeight - olderWeight;
    overreaching = (recentRPE - olderRPE) >= 1.0 && weightGain <= BARBELL_INCREMENT_LBS;
  }

  // --- Under-training ---
  const recentAvgRPE = avg(sessionStats.slice(0, 3).map((s) => s.avgRPE));
  const underTraining = recentAvgRPE < 6 && sessionStats.slice(0, 3).every((s) => s.avgRPE < 6);

  // --- PR check ---
  const latestMaxWeight = sessionStats[0]?.maxWeight ?? 0;
  const prevMaxWeight   = sessionStats.length > 1 ? Math.max(...sessionStats.slice(1).map((s) => s.maxWeight)) : 0;
  const recentPR  = latestMaxWeight > prevMaxWeight && prevMaxWeight > 0;
  const prWeight  = recentPR ? latestMaxWeight : null;

  // --- Overall trend ---
  const trend = recentPR || (!plateau && sessionStats[0]?.avgWeight > (sessionStats[1]?.avgWeight ?? 0))
    ? 'improving'
    : plateau || overreaching
      ? 'declining'
      : 'plateau';

  const details = [
    recentPR       ? `New PR: ${prWeight} lbs` : null,
    plateau        ? 'Strength has plateaued for 2+ weeks.' : null,
    overreaching   ? 'RPE is rising without weight increases — signs of overreaching.' : null,
    underTraining  ? 'RPE consistently below 6 — weight is too light.' : null
  ].filter(Boolean).join(' ') || 'Progressing normally.';

  return { plateau, overreaching, underTraining, recentPR, prWeight, trend, details };
}


// ─── 6. Deload Algorithm ─────────────────────────────────────────────────────

/**
 * Determine whether a deload week should be triggered, and if so, generate
 * the deload plan.
 *
 * @param {{
 *   fatigueScore: number,            // from calcFatigueScore()
 *   weeksSinceLastDeload: number,
 *   performanceDecline: number,      // fraction 0-1 (e.g. 0.1 = 10% decline)
 *   userRequestedDeload?: boolean
 * }} input
 * @returns {{
 *   shouldDeload: boolean,
 *   trigger: 'fatigue' | 'performance' | 'time' | 'user' | null,
 *   plan: {
 *     weightFactor: number,  // multiply planned weight by this
 *     volumeFactor: number,  // multiply planned sets by this
 *     durationDays: number,
 *     intensityGuidance: string
 *   } | null
 * }}
 *
 * Trigger rules:
 *   - fatigue score >= 70  → deload now (fatigue trigger)
 *   - performance decline >= 10% vs 3-session average → deload now (performance trigger)
 *   - weeksSinceLastDeload >= 5 → deload now (time-based trigger)
 *   - user requests deload → deload now (user trigger)
 *
 * Deload plan:
 *   weightFactor = 0.60 (60% of normal weight)
 *   volumeFactor = 0.50 (50% of normal sets, min 2 sets per exercise)
 *   duration     = 7 days (full training week at reduced load)
 */
export function evaluateDeload({ fatigueScore, weeksSinceLastDeload, performanceDecline, userRequestedDeload = false }) {
  const deloadPlan = {
    weightFactor: 0.60,
    volumeFactor: 0.50,
    durationDays: 7,
    intensityGuidance: 'Keep all sets at RPE 6 or below. No failure sets, no advanced techniques. Focus on perfect form and tissue recovery.'
  };

  if (userRequestedDeload) {
    return { shouldDeload: true, trigger: 'user', plan: deloadPlan };
  }
  if (fatigueScore >= DELOAD_FATIGUE_THRESHOLD) {
    return { shouldDeload: true, trigger: 'fatigue', plan: deloadPlan };
  }
  if (performanceDecline >= DELOAD_PERFORMANCE_DECLINE) {
    return { shouldDeload: true, trigger: 'performance', plan: deloadPlan };
  }
  if (weeksSinceLastDeload >= DELOAD_TIME_WEEKS) {
    return { shouldDeload: true, trigger: 'time', plan: deloadPlan };
  }

  return { shouldDeload: false, trigger: null, plan: null };
}


// ─── 7. Program Switching Logic ───────────────────────────────────────────────

/**
 * Evaluate whether the user should switch to a different training program.
 *
 * @param {{
 *   weeksOnCurrentProgram: number,
 *   plateau: boolean,              // from analyseExerciseTrend() for primary lifts
 *   goalChanged: boolean,          // set when user updates their goal in profile
 *   completionRateAvg: number,     // 4-week avg session completion rate 0-1
 *   fatigueScore: number
 * }} input
 * @returns {{
 *   shouldSwitch: boolean,
 *   urgency: 'low' | 'medium' | 'high',
 *   reason: string,
 *   bridgeWeek: boolean,           // true = run a bridge/transition week first
 *   recommendation: string
 * }}
 *
 * Rules (evaluated in order, first match wins):
 *   A. Goal changed → switch now (high urgency, bridge week recommended)
 *   B. weeksOnCurrentProgram >= 16 → switch recommended (medium, bridge week)
 *   C. Plateau for 3+ consecutive sessions on 2+ primary lifts AND
 *      weeksOnCurrentProgram >= 8 → switch (medium, bridge week)
 *   D. avgCompletionRate < 0.70 for 4+ weeks → switch (low, no bridge)
 *   E. Default → no switch
 */
export function evaluateProgramSwitch({ weeksOnCurrentProgram, plateau, goalChanged, completionRateAvg, fatigueScore }) {
  if (goalChanged) {
    return {
      shouldSwitch: true,
      urgency: 'high',
      reason: 'Your training goal has changed.',
      bridgeWeek: true,
      recommendation: 'Run a bridge week at 70% volume before starting the new program.'
    };
  }

  if (weeksOnCurrentProgram >= 16) {
    return {
      shouldSwitch: true,
      urgency: 'medium',
      reason: `You've been on this program for ${weeksOnCurrentProgram} weeks — stimulus adaptation is likely.`,
      bridgeWeek: true,
      recommendation: 'Consider a variation: change exercise selection, rep ranges, or split structure.'
    };
  }

  if (plateau && weeksOnCurrentProgram >= 8) {
    return {
      shouldSwitch: true,
      urgency: 'medium',
      reason: 'Plateau detected on primary lifts after 8+ weeks on the same program.',
      bridgeWeek: true,
      recommendation: 'A program with periodization variation (e.g. undulating or block) may break the plateau.'
    };
  }

  if (completionRateAvg < 0.70) {
    return {
      shouldSwitch: true,
      urgency: 'low',
      reason: 'Session completion rate has been below 70% for several weeks — program may be too demanding.',
      bridgeWeek: false,
      recommendation: 'Consider a lower-volume program or reduce session count.'
    };
  }

  return {
    shouldSwitch: false,
    urgency: 'low',
    reason: 'Current program is still producing progress.',
    bridgeWeek: false,
    recommendation: null
  };
}


// ─── 8. Cardio-Lifting Balance Algorithm ─────────────────────────────────────

/**
 * Recommend cardio volume adjustments based on lifting load and current fatigue.
 *
 * @param {{
 *   liftingSessions: Array<{
 *     intensityCategory: 'light' | 'moderate' | 'heavy',  // from RPE
 *     volumeSets: number
 *   }>,
 *   cardioSessions: Array<{
 *     modality: 'cycling' | 'running' | 'rowing' | 'other',
 *     intensityZone: 1|2|3|4|5,
 *     durationMin: number
 *   }>,
 *   fatigueScore: number     // from calcFatigueScore()
 * }} input
 * @returns {{
 *   recommendation: 'increase' | 'maintain' | 'decrease' | 'skip',
 *   targetCardioMinutes: number,
 *   targetMaxZone: 1|2|3|4|5,
 *   reason: string
 * }}
 *
 * Algorithm:
 *   1. Compute lifting stress score (LSS): each session contributes based on intensity.
 *        light   → 1 point
 *        moderate→ 2 points
 *        heavy   → 3 points
 *      LSS = sum of all session points this week.
 *
 *   2. Compute cardio fatigue score (CFS): sum of (zone fatigue rate × minutes) per session.
 *
 *   3. Combined load = fatigueScore + LSS × 4 + CFS
 *      (fatigueScore already 0-100; scale LSS and CFS to same range)
 *
 *   Decision thresholds:
 *     combinedLoad >= 90 → skip cardio
 *     combinedLoad >= 70 → decrease (zone 1-2 only, ≤ 20 min)
 *     combinedLoad >= 45 → maintain (zone ≤ 3, current volume)
 *     combinedLoad < 45  → increase (add 1 zone-2 session or +10 min)
 */
export function cardioLiftingBalance({ liftingSessions = [], cardioSessions = [], fatigueScore }) {
  // Lifting stress score
  const intensityMap = { light: 1, moderate: 2, heavy: 3 };
  const lss = liftingSessions.reduce((sum, s) => sum + (intensityMap[s.intensityCategory] ?? 2), 0);

  // Cardio fatigue score
  const cfs = cardioSessions.reduce((sum, s) => {
    const ratePerMin = CARDIO_ZONE_FATIGUE_PER_MIN[s.intensityZone] ?? 0.4;
    return sum + ratePerMin * (s.durationMin ?? 0);
  }, 0);

  const combinedLoad = Math.round(fatigueScore + lss * 4 + cfs);

  const currentCardioMinutes = cardioSessions.reduce((sum, s) => sum + (s.durationMin ?? 0), 0);

  if (combinedLoad >= 90) {
    return {
      recommendation: 'skip',
      targetCardioMinutes: 0,
      targetMaxZone: 1,
      reason: `Combined training load is very high (${combinedLoad}) — skip cardio and prioritise recovery.`
    };
  }

  if (combinedLoad >= 70) {
    return {
      recommendation: 'decrease',
      targetCardioMinutes: Math.min(currentCardioMinutes, 20),
      targetMaxZone: 2,
      reason: `Combined load ${combinedLoad}: reduce cardio to ≤ 20 min at zone 1-2 only.`
    };
  }

  if (combinedLoad >= 45) {
    return {
      recommendation: 'maintain',
      targetCardioMinutes: currentCardioMinutes,
      targetMaxZone: 3,
      reason: `Combined load ${combinedLoad}: maintain current cardio volume, cap intensity at zone 3.`
    };
  }

  return {
    recommendation: 'increase',
    targetCardioMinutes: currentCardioMinutes + 10,
    targetMaxZone: 4,
    reason: `Combined load ${combinedLoad}: capacity exists to add cardio — try an additional 10 min or one extra zone-2 session.`
  };
}


// ─── 9. Pro Tips Delivery System ─────────────────────────────────────────────

/**
 * Decide which (if any) contextual tip to surface for a given exercise and session.
 *
 * @param {{
 *   exerciseId: string,
 *   sessionCountForExercise: number,  // how many times user has logged this exercise
 *   lastActualRPE: number | null,     // RPE from most recent set
 *   lastPlannedRPE: number | null,
 *   recentPR: boolean,
 *   trend: object,                    // from analyseExerciseTrend()
 *   totalSessionsEver: number,        // all exercises combined
 *   weeklyInsight: string | null      // pre-computed from trend analysis
 * }} input
 * @returns {Array<{
 *   type: 'exercise' | 'warning' | 'milestone' | 'weekly_insight',
 *   priority: 1|2|3,      // 1 = highest, shown first
 *   message: string
 * }>}
 *
 * Rules:
 *   Exercise tips:
 *     - sessionCountForExercise === 1 → show the exercise's built-in cue/tip (first time)
 *     - sessionCountForExercise % 5 === 0 → show tip again as reminder
 *
 *   Warning tips (RPE-based form indicators):
 *     - actualRPE > plannedRPE + 2 → "Consider reducing weight — form may be compromising."
 *     - avgRPE consistently >= 9.5 → "You're regularly hitting near-failure — ensure you're recovering."
 *
 *   Milestone tips:
 *     - totalSessionsEver === 10 → "10 sessions complete — great consistency!"
 *     - recentPR === true → "Personal record! Log this weight as your new benchmark."
 *     - sessionCountForExercise === 1 → "First time logging [exercise] — start light and nail form."
 *
 *   Weekly insight:
 *     - Passed in as weeklyInsight string if trend analysis produced one.
 *
 * Returns sorted by priority (1 first), then de-duplicated by type.
 */
export function getContextualTips({
  exerciseId,
  sessionCountForExercise,
  lastActualRPE,
  lastPlannedRPE,
  recentPR,
  trend,
  totalSessionsEver,
  weeklyInsight
}) {
  const tips = [];

  // --- Exercise tips ---
  if (sessionCountForExercise === 1) {
    tips.push({
      type: 'exercise',
      priority: 2,
      message: `First time logging this exercise — focus on feeling the target muscle and mastering form before adding weight.`
    });
  } else if (sessionCountForExercise > 1 && sessionCountForExercise % 5 === 0) {
    tips.push({
      type: 'exercise',
      priority: 3,
      message: `Session ${sessionCountForExercise} on this exercise — revisit the technique cue to stay sharp.`
    });
  }

  // --- Warning tips ---
  if (typeof lastActualRPE === 'number' && typeof lastPlannedRPE === 'number') {
    if (lastActualRPE > lastPlannedRPE + 2) {
      tips.push({
        type: 'warning',
        priority: 1,
        message: `RPE ${lastActualRPE} was ${lastActualRPE - lastPlannedRPE} points above target — consider reducing weight to protect form.`
      });
    }
  }

  if (trend?.overreaching) {
    tips.push({
      type: 'warning',
      priority: 1,
      message: 'RPE has been rising without weight increases over the last few sessions — signs of overreaching. Consider a deload.'
    });
  }

  if (trend?.underTraining) {
    tips.push({
      type: 'warning',
      priority: 2,
      message: 'RPE is consistently below 6 — the weight may be too light to drive hypertrophy. Consider an increase.'
    });
  }

  // --- Milestone tips ---
  if (recentPR) {
    tips.push({
      type: 'milestone',
      priority: 1,
      message: `Personal record! This is your new benchmark weight. Let the system track it for future progress.`
    });
  }

  if (totalSessionsEver === 10) {
    tips.push({
      type: 'milestone',
      priority: 2,
      message: '10 sessions logged — you\'ve built a real habit. Consistency is the single biggest driver of results.'
    });
  }

  if (totalSessionsEver === 30) {
    tips.push({
      type: 'milestone',
      priority: 2,
      message: '30 sessions logged — you\'re past the adaptation phase. Your body is now efficiently building muscle.'
    });
  }

  if (trend?.recentPR && trend?.plateau === false) {
    // no-op, already caught by recentPR above
  }

  if (trend?.plateau) {
    tips.push({
      type: 'weekly_insight',
      priority: 2,
      message: 'Strength has plateaued on this exercise for 2+ weeks. Consider a technique variation, rep range change, or a brief deload to break through.'
    });
  }

  // --- Weekly insight ---
  if (weeklyInsight) {
    tips.push({
      type: 'weekly_insight',
      priority: 3,
      message: weeklyInsight
    });
  }

  // Sort by priority ascending (1 = most important first), then deduplicate by type
  const sorted = tips.sort((a, b) => a.priority - b.priority);
  const seen = new Set();
  return sorted.filter((t) => {
    // Allow multiple 'warning' tips; deduplicate others by type
    if (t.type === 'warning') return true;
    if (seen.has(t.type)) return false;
    seen.add(t.type);
    return true;
  });
}


// ─── Private helpers ──────────────────────────────────────────────────────────

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function avg(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Days between two YYYY-MM-DD strings (absolute value). */
function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return 0;
  const msA = new Date(dateA).getTime();
  const msB = new Date(dateB).getTime();
  return Math.abs((msB - msA) / (1000 * 60 * 60 * 24));
}

/**
 * Count how many calendar days in a row (ending today) had at least one
 * session, given an array of session objects sorted newest-first.
 */
function countConsecutiveTrainingDays(sessions) {
  if (!sessions || sessions.length === 0) return 0;

  const dateSet = new Set(sessions.map((s) => s.date));
  let count = 0;
  const cursor = new Date();

  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (dateSet.has(dateStr)) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return count;
}

/**
 * Average (actualRPE - plannedRPE) across all completed sets that have both values.
 * Positive = harder than planned.
 */
function avgRPEDelta(sets) {
  if (!sets || sets.length === 0) return 0;
  const deltas = sets
    .filter((s) => typeof s.actualRPE === 'number' && typeof s.plannedRPE === 'number')
    .map((s) => s.actualRPE - s.plannedRPE);
  return deltas.length === 0 ? 0 : avg(deltas);
}

/** True if every set's actualReps >= the ceiling of its plannedReps range. */
function allSetsHitCeiling(sets) {
  if (!sets || sets.length === 0) return false;
  return sets.every((s) => {
    if (typeof s.actualReps !== 'number') return false;
    const range = parseRepRange(s.plannedReps);
    return range ? s.actualReps >= range.max : false;
  });
}

/** True if any set's actualReps < the floor of its plannedReps range. */
function anySetMissedFloor(sets) {
  if (!sets || sets.length === 0) return false;
  return sets.some((s) => {
    if (typeof s.actualReps !== 'number') return false;
    const range = parseRepRange(s.plannedReps);
    return range ? s.actualReps < range.min : false;
  });
}

/** Fraction of sets that are marked completed. */
function completionRateFromSets(sets) {
  if (!sets || sets.length === 0) return 1;
  const completed = sets.filter((s) => s.completed !== false).length;
  return completed / sets.length;
}

/** Mirror of the same function in overload.js — kept local to avoid circular deps. */
function parseRepRange(repsString) {
  if (!repsString || typeof repsString !== 'string') return null;
  const match = repsString.match(/^(\d+)\s*[–\-]\s*(\d+)$/);
  if (!match) return null;
  return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
}
