// Progressive overload calculation logic.

import { DELOAD_WEIGHT_FACTOR, DELOAD_WEEK } from './workoutData.js';

// Increment amounts by equipment type
const BARBELL_INCREMENT = 5;   // lbs
const DB_INCREMENT = 2.5;      // lbs per dumbbell

/**
 * Parse a rep range string like "8–10" or "6–8" into { min, max }.
 * Returns null if the string is not a parseable range (e.g. "to failure").
 *
 * @param {string} repsString
 * @returns {{ min: number, max: number } | null}
 */
export function parseRepRange(repsString) {
  if (!repsString || typeof repsString !== 'string') return null;

  // Support both the en-dash (–) and a regular hyphen (-)
  const match = repsString.match(/^(\d+)\s*[–\-]\s*(\d+)$/);
  if (!match) return null;

  return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
}

/**
 * Determine whether the exercise uses barbell weight increments.
 * Falls back to dumbbell increments for everything else.
 *
 * @param {string} exerciseId
 * @returns {boolean}
 */
function isBarbell(exerciseId) {
  const barbellIds = ['flat-barbell-bench', 'barbell-curl'];
  return barbellIds.includes(exerciseId);
}

/**
 * Given previous workout logs for a single exercise and the current week number,
 * return a recommended weight adjustment.
 *
 * prevLogs is an array of log objects, most-recent first, each shaped like:
 * {
 *   date: string,           // ISO date
 *   weekNumber: number,
 *   sets: [
 *     { setNum: number, weight: number, repsCompleted: number | 'failure', rpe: number }
 *   ],
 *   feedback: 'tooEasy' | 'tooHard' | 'justRight' | null
 * }
 *
 * @param {string} exerciseId
 * @param {Array<object>} prevLogs
 * @param {number} currentWeek  1-5 (5 = deload)
 * @returns {{
 *   action: 'increase' | 'decrease' | 'keep' | 'deload',
 *   increment: number,
 *   reason: string
 * }}
 */
export function getOverloadRecommendation(exerciseId, prevLogs, currentWeek) {
  const increment = isBarbell(exerciseId) ? BARBELL_INCREMENT : DB_INCREMENT;

  // Deload week — always reduce
  if (currentWeek === DELOAD_WEEK) {
    return {
      action: 'deload',
      increment: 0,
      reason: `Deload week — use ${Math.round(DELOAD_WEIGHT_FACTOR * 100)}% of normal weight for 2 sets.`
    };
  }

  if (!prevLogs || prevLogs.length === 0) {
    return { action: 'keep', increment: 0, reason: 'No previous data — maintain current weight.' };
  }

  const latest = prevLogs[0];

  // Check explicit user feedback from the last two sessions
  const recentFeedback = prevLogs.slice(0, 2).map((l) => l.feedback);

  if (recentFeedback[0] === 'tooHard') {
    return {
      action: 'decrease',
      increment: -5,
      reason: 'Marked too hard last session — reduce weight by 5 lbs.'
    };
  }

  const tooEasyCount = recentFeedback.filter((f) => f === 'tooEasy').length;
  if (tooEasyCount >= 2) {
    return {
      action: 'increase',
      increment,
      reason: `Marked too easy in the last 2 sessions — increase by ${increment} lbs.`
    };
  }

  // Analyse completed reps vs. the target rep range
  const sets = latest.sets ?? [];

  if (sets.length === 0) {
    return { action: 'keep', increment: 0, reason: 'No set data — maintain current weight.' };
  }

  // We only evaluate sets that have a defined rep range (skip 'to failure' sets)
  const evaluableSets = sets.filter((s) => {
    const range = parseRepRange(s.targetReps);
    return range !== null && typeof s.repsCompleted === 'number';
  });

  if (evaluableSets.length === 0) {
    return { action: 'keep', increment: 0, reason: 'All sets were AMRAP — maintain current weight.' };
  }

  const missedBottom = evaluableSets.some((s) => {
    const range = parseRepRange(s.targetReps);
    return s.repsCompleted < range.min;
  });

  if (missedBottom) {
    return {
      action: 'keep',
      increment: 0,
      reason: 'One or more sets missed the bottom of the rep range — maintain current weight.'
    };
  }

  const allHitTop = evaluableSets.every((s) => {
    const range = parseRepRange(s.targetReps);
    return s.repsCompleted >= range.max;
  });

  if (allHitTop) {
    return {
      action: 'increase',
      increment,
      reason: `All sets hit the top of the rep range — increase by ${increment} lbs.`
    };
  }

  return { action: 'keep', increment: 0, reason: 'Still progressing within the rep range — maintain current weight.' };
}

/**
 * Calculate total training volume (weight × reps) for a completed workout.
 *
 * exercises is an array of:
 * {
 *   sets: [{ weight: number, repsCompleted: number | 'failure' }]
 * }
 *
 * 'failure' reps are treated as 0 for volume purposes (we don't know the count).
 *
 * @param {Array<{ sets: Array<{ weight: number, repsCompleted: number | string }> }>} exercises
 * @returns {number}
 */
export function calcVolume(exercises) {
  if (!Array.isArray(exercises)) return 0;

  return exercises.reduce((total, exercise) => {
    const sets = exercise?.sets ?? [];
    return (
      total +
      sets.reduce((exTotal, set) => {
        const weight = typeof set.weight === 'number' ? set.weight : 0;
        const reps = typeof set.repsCompleted === 'number' ? set.repsCompleted : 0;
        return exTotal + weight * reps;
      }, 0)
    );
  }, 0);
}

/**
 * Check whether a personal record (PR) was hit for a given exercise.
 * A PR is recorded when the current set's weight exceeds the best weight
 * previously logged for this exercise.
 *
 * historyLogs is the same shape as prevLogs in getOverloadRecommendation.
 *
 * @param {string} exerciseId
 * @param {{ weight: number, repsCompleted: number | string }} currentSet
 * @param {Array<object>} historyLogs
 * @returns {boolean}
 */
export function checkPR(exerciseId, currentSet, historyLogs) {
  if (!currentSet || typeof currentSet.weight !== 'number') return false;
  if (!Array.isArray(historyLogs) || historyLogs.length === 0) return false;

  const currentWeight = currentSet.weight;

  const bestPrevious = historyLogs.reduce((best, log) => {
    const sets = log?.sets ?? [];
    const maxInLog = sets.reduce((m, s) => {
      return typeof s.weight === 'number' ? Math.max(m, s.weight) : m;
    }, 0);
    return Math.max(best, maxInLog);
  }, 0);

  return currentWeight > bestPrevious;
}
