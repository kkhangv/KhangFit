import { requireAuth } from '$lib/auth';
import { getUserConfig, getWorkoutHistory, getWorkout, getUserProgram, getLatestStats } from '$lib/storage';
import { getCurrentWeek } from '$lib/weekCalc';
import { getDay } from '$lib/workoutData';
import { getOverloadRecommendation } from '$lib/overload';
import { calcWorkingWeight } from '$lib/intensityCalc';
import { kv } from '$lib/kv';
import { getProgramDays, getExercise, getAllExercises } from '$lib/programData';

// Parse exercise note strings like "4×5 @ RPE 8", "3×8-10", "2×10-12 @ RPE 9"
function parseExerciseNote(note) {
  if (!note) return { numSets: 3, reps: '8-10', rpe: 8 };
  const match = note.match(/(\d+)[×x](\d+(?:-\d+)?)/i);
  const rpeMatch = note.match(/RPE\s*(\d+)/i);
  return {
    numSets: match ? parseInt(match[1]) : 3,
    reps: match ? match[2] : '8-10',
    rpe: rpeMatch ? parseInt(rpeMatch[1]) : 8
  };
}

function buildSetsFromNote(note) {
  const { numSets, reps, rpe } = parseExerciseNote(note);
  const sets = [];
  for (let i = 0; i < numSets; i++) {
    sets.push({
      setNum: i + 1,
      weight: null,
      reps: reps,
      rpe: rpe,
      rest: 120,
      tempo: null,
      technique: null,
      weightNote: null
    });
  }
  return sets;
}

function formatExerciseId(id) {
  // Convert 'flat-barbell-bench' to 'Flat Barbell Bench'
  return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function load({ cookies, params }) {
  const username = requireAuth(cookies);
  const dayNum = parseInt(params.day);

  if (isNaN(dayNum) || dayNum < 1) {
    return { error: 'Invalid day.' };
  }

  const dayId = 'day' + dayNum;

  const [config, history, userProgram, latestStats] = await Promise.all([
    getUserConfig(username),
    getWorkoutHistory(username),
    getUserProgram(username),
    getLatestStats(username)
  ]);

  const maxBench = latestStats?.maxBench || 185;

  const weekInfo = getCurrentWeek(config?.startDate, config?.weekOverride);

  // Try loading day data from the user's selected program in DB
  const programId = userProgram?.programId || 'chest-focus-4day';
  const programDays = await getProgramDays(kv, programId);
  const dayIndex = dayNum - 1;
  let dayData = programDays?.[dayIndex] || null;

  // If DB has exerciseIds (array of string IDs), resolve each to a full exercise object
  if (dayData?.exerciseIds && Array.isArray(dayData.exerciseIds)) {
    const exerciseNotes = dayData.exerciseNotes || {};
    const enriched = await Promise.all(
      dayData.exerciseIds.map(async (id) => {
        const full = await getExercise(kv, id);
        const note = exerciseNotes[id];
        const { numSets, reps, rpe } = parseExerciseNote(note);

        // Calculate working weight from user's max bench
        const targetReps = parseInt(reps) || 8;
        let suggestedWeight = calcWorkingWeight(maxBench, targetReps, rpe || 8);
        // Round to nearest 2.5
        suggestedWeight = Math.round(suggestedWeight / 2.5) * 2.5;

        const sets = [];
        for (let i = 0; i < numSets; i++) {
          sets.push({
            setNum: i + 1,
            weight: suggestedWeight,
            reps: reps,
            rpe: rpe,
            rest: 120,
            tempo: null,
            technique: null,
            weightNote: note || null
          });
        }

        if (full) {
          // Format equipment array to string
          const equipStr = Array.isArray(full.equipment) ? full.equipment.join(' + ') : (full.equipment || null);
          // Get first pro tip as the cue
          const cue = (full.proTips && full.proTips.length > 0) ? full.proTips[0] : null;
          // Science tip as string
          const sciTip = typeof full.scienceTip === 'string' ? full.scienceTip : null;

          return {
            id: full.id || id,
            name: full.name || formatExerciseId(id),
            equipment: equipStr,
            muscleGroup: (full.primaryMuscles?.[0] || '').replace(/-/g, ' '),
            cue: cue,
            tip: sciTip,
            scienceTip: sciTip,
            proTips: full.proTips || [],
            sets
          };
        }

        // Fallback: exercise not found in DB
        return {
          id,
          name: formatExerciseId(id),
          equipment: null,
          muscleGroup: null,
          cue: null,
          tip: null,
          scienceTip: null,
          proTips: [],
          sets
        };
      })
    );
    dayData = { ...dayData, exercises: enriched };
  }

  // If DB has exercise references in exercises array, load full exercise data
  if (dayData?.exercises && !dayData.exerciseIds) {
    const enriched = await Promise.all(
      dayData.exercises.map(async (ex) => {
        if (ex.id && !ex.name) {
          const full = await getExercise(kv, ex.id);
          return full ? { ...full, ...ex } : ex;
        }
        return ex;
      })
    );
    dayData = { ...dayData, exercises: enriched };
  }

  // Fall back to hardcoded data if DB returned nothing
  if (!dayData) {
    dayData = getDay(dayId);
  }

  const today = new Date().toISOString().split('T')[0];

  // Find the most recent previous workout for this day (not today)
  const prevEntry = (history || [])
    .filter(h => h.day === dayNum && h.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  const prevWorkout = prevEntry ? await getWorkout(username, prevEntry.date) : null;

  // Build per-exercise overload recommendations (extract .reason string from result object)
  const recommendations = {};
  if (dayData?.exercises) {
    for (const exercise of dayData.exercises) {
      const prevLogs = prevWorkout?.exercises?.find(e => e.id === exercise.id)?.sets || null;
      const result = getOverloadRecommendation(
        exercise.id,
        prevLogs,
        weekInfo?.cycleWeek ?? 1
      );
      // getOverloadRecommendation returns { action, increment, reason } — extract reason string
      recommendations[exercise.id] = typeof result === 'string' ? result : (result?.reason || null);
    }
  }

  // Check if already done today
  const doneToday = (history || []).some(h => h.day === dayNum && h.date === today);

  // Load all exercises for the exercise picker
  const allExercises = await getAllExercises(kv);

  return {
    username,
    dayData,
    weekInfo,
    prevWorkout,
    recommendations,
    doneToday,
    today,
    hasPeloton: config?.hasPeloton ?? false,
    allExercises: allExercises || []
  };
}
