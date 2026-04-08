// In-session weight adjustment based on RPE feedback.
// Pure deterministic rules — no AI calls.

/**
 * Color and label config for each exercise type.
 */
export const EXERCISE_TYPE_CONFIG = {
  'free-weight': { color: '#84CC16', label: 'Free Weight', bgAlpha: 'rgba(132,204,22,0.12)' },
  'machine':     { color: '#3B82F6', label: 'Machine',     bgAlpha: 'rgba(59,130,246,0.12)' },
  'bodyweight':  { color: '#A855F7', label: 'Bodyweight',  bgAlpha: 'rgba(168,85,247,0.12)' },
  'cardio':      { color: '#F97316', label: 'Cardio',      bgAlpha: 'rgba(249,115,22,0.12)' },
  'stretch':     { color: '#06B6D4', label: 'Stretch',     bgAlpha: 'rgba(6,182,212,0.12)' }
};

/**
 * Detect exercise input mode from exerciseType field (preferred) or fallback heuristics.
 * Returns: { type, metric, unit, step, skipRPE, skipRest }
 */
export function getExerciseInputType(exercise) {
  if (!exercise) return { type: 'free-weight', metric: 'weight', unit: 'lbs', step: 2.5, skipRPE: false, skipRest: false };

  // Use AI-classified exerciseType when available
  if (exercise.exerciseType) {
    switch (exercise.exerciseType) {
      case 'cardio':
        return { type: 'cardio', metric: 'duration', unit: 'min', step: 1, skipRPE: false, skipRest: true };
      case 'stretch':
        return { type: 'stretch', metric: 'duration', unit: 'sec', step: 5, skipRPE: true, skipRest: true };
      case 'bodyweight':
        return { type: 'bodyweight', metric: 'reps', unit: 'reps', step: 1, skipRPE: false, skipRest: false };
      case 'machine':
        return { type: 'machine', metric: 'weight', unit: 'lbs', step: 5, skipRPE: false, skipRest: false };
      case 'free-weight':
      default:
        return { type: 'free-weight', metric: 'weight', unit: 'lbs', step: 2.5, skipRPE: false, skipRest: false };
    }
  }

  // Fallback: legacy detection from equipment/name strings
  const equip = (exercise.equipment || '').toLowerCase();
  const name = (exercise.name || '').toLowerCase();
  const isCardioEquip = ['peloton', 'bike', 'cycle', 'treadmill', 'rower', 'rowing', 'elliptical', 'stairmaster'].some(k => equip.includes(k) || name.includes(k));

  if (isCardioEquip || (exercise.isCardio && (!exercise.reps || exercise.reps === 0))) {
    return { type: 'cardio', metric: 'duration', unit: 'min', step: 1, skipRPE: false, skipRest: true };
  }
  if (exercise.isMobility && (!exercise.reps || exercise.reps === 0)) {
    return { type: 'stretch', metric: 'duration', unit: 'sec', step: 5, skipRPE: true, skipRest: true };
  }
  return { type: 'free-weight', metric: 'weight', unit: 'lbs', step: 2.5, skipRPE: false, skipRest: false };
}

/**
 * Suggest a weight adjustment for the next set based on reported RPE.
 *
 * @param {number} currentWeight - Weight used for the completed set
 * @param {number} reportedRPE - RPE the user reported (6-10)
 * @param {number} targetRPE - Target RPE from the plan
 * @param {number} targetReps - Target reps from the plan
 * @param {number} actualReps - Actual reps completed
 * @param {boolean} isCardio - Whether this is a cardio exercise
 * @returns {{ suggestedWeight: number, message: string, adjustment: string }}
 */
export function getWeightSuggestion(currentWeight, reportedRPE, targetRPE, targetReps, actualReps, isCardio = false) {
  // Cardio exercises don't get weight suggestions
  if (isCardio) {
    return { suggestedWeight: currentWeight, message: 'Good effort!', adjustment: 'maintain' };
  }
  const diff = reportedRPE - targetRPE;
  const repShortfall = targetReps - actualReps;

  // Round weight to nearest 2.5 (standard plate increment)
  const round = (w) => Math.round(w / 2.5) * 2.5;

  // Couldn't complete target reps
  if (repShortfall > 2) {
    const suggested = round(currentWeight * 0.85);
    return {
      suggestedWeight: suggested,
      message: `Reduce to ${suggested} lbs — fell ${repShortfall} reps short`,
      adjustment: 'decrease'
    };
  }

  // RPE 10 — hit absolute failure
  if (reportedRPE >= 10) {
    const suggested = round(currentWeight * 0.90);
    return {
      suggestedWeight: suggested,
      message: `Drop to ${suggested} lbs for remaining sets`,
      adjustment: 'decrease'
    };
  }

  // Too easy — RPE well below target
  if (diff <= -2) {
    const suggested = round(currentWeight * 1.10);
    return {
      suggestedWeight: suggested,
      message: `Bump up to ${suggested} lbs — felt too light`,
      adjustment: 'increase'
    };
  }

  if (diff <= -1) {
    const suggested = round(currentWeight * 1.05);
    return {
      suggestedWeight: suggested,
      message: `Try ${suggested} lbs — slight increase`,
      adjustment: 'increase'
    };
  }

  // On target
  if (Math.abs(diff) < 1) {
    return {
      suggestedWeight: currentWeight,
      message: 'Weight is dialed in — maintain',
      adjustment: 'maintain'
    };
  }

  // Too hard — RPE above target
  if (diff >= 2) {
    const suggested = round(currentWeight * 0.90);
    return {
      suggestedWeight: suggested,
      message: `Ease off to ${suggested} lbs`,
      adjustment: 'decrease'
    };
  }

  if (diff >= 1) {
    const suggested = round(currentWeight * 0.95);
    return {
      suggestedWeight: suggested,
      message: `Slight drop to ${suggested} lbs`,
      adjustment: 'decrease'
    };
  }

  return {
    suggestedWeight: currentWeight,
    message: 'Maintain current weight',
    adjustment: 'maintain'
  };
}
