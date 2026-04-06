import { requireAuth } from '$lib/auth';
import { getUserConfig, getWorkoutHistory, getWorkout, getUserProgram } from '$lib/storage';
import { getCurrentWeek } from '$lib/weekCalc';
import { getDay } from '$lib/workoutData';
import { getOverloadRecommendation } from '$lib/overload';
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

  const [config, history, userProgram] = await Promise.all([
    getUserConfig(username),
    getWorkoutHistory(username),
    getUserProgram(username)
  ]);

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
        const sets = buildSetsFromNote(note);

        if (full) {
          return {
            id: full.id || id,
            name: full.name || formatExerciseId(id),
            equipment: full.equipment || null,
            muscleGroup: full.primaryMuscles?.[0] || full.muscleGroup || null,
            cue: full.cue || full.formCues?.[0] || null,
            tip: full.scienceTip || full.tip || null,
            scienceTip: full.scienceTip || null,
            proTips: full.proTips || [],
            sets
          };
        }

        // Fallback: exercise not found in DB, build minimal object from ID + note
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

  // Build per-exercise overload recommendations
  const recommendations = {};
  if (dayData?.exercises) {
    for (const exercise of dayData.exercises) {
      const prevLogs = prevWorkout?.exercises?.find(e => e.id === exercise.id)?.sets || null;
      recommendations[exercise.id] = getOverloadRecommendation(
        exercise.id,
        prevLogs,
        weekInfo?.cycleWeek ?? 1
      );
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
