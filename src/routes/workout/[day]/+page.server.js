import { requireAuth } from '$lib/auth';
import { getUserConfig, getWorkoutHistory, getWorkout, getUserProgram } from '$lib/storage';
import { getCurrentWeek } from '$lib/weekCalc';
import { getDay } from '$lib/workoutData';
import { getOverloadRecommendation } from '$lib/overload';
import { kv } from '$lib/kv';
import { getProgramDays, getExercise } from '$lib/programData';

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

  // If DB has exercise references, load full exercise data
  if (dayData?.exercises) {
    const enriched = await Promise.all(
      dayData.exercises.map(async (ex) => {
        // If exercise only has an id (reference), load full data from DB
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

  return {
    username,
    dayData,
    weekInfo,
    prevWorkout,
    recommendations,
    doneToday,
    today,
    hasPeloton: config?.hasPeloton ?? false
  };
}
