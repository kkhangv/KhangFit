import { requireAuth } from '$lib/auth';
import { getUserConfig, getWorkoutHistory, getWorkout } from '$lib/storage';
import { getCurrentWeek } from '$lib/weekCalc';
import { getDay } from '$lib/workoutData';
import { getOverloadRecommendation } from '$lib/overload';

export async function load({ cookies, params }) {
  const username = requireAuth(cookies);
  const dayNum = parseInt(params.day);

  if (isNaN(dayNum) || dayNum < 1 || dayNum > 4) {
    return { error: 'Invalid day.' };
  }

  const dayId = 'day' + dayNum;

  const [config, history] = await Promise.all([
    getUserConfig(username),
    getWorkoutHistory(username)
  ]);

  const weekInfo = getCurrentWeek(config?.startDate, config?.weekOverride);
  const dayData = getDay(dayId);

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
