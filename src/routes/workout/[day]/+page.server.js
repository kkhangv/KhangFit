import { requireAuth } from '$lib/auth';
import { getUserConfig, getWorkoutHistory, getWorkout, getPlan, getPlanWeek } from '$lib/storage';
import { getCurrentWeek } from '$lib/weekCalc';

export async function load({ cookies, params }) {
  const username = requireAuth(cookies);
  const dayNum = parseInt(params.day);

  if (isNaN(dayNum) || dayNum < 1) {
    return { error: 'Invalid day.' };
  }

  const [config, history] = await Promise.all([
    getUserConfig(username),
    getWorkoutHistory(username)
  ]);

  const weekInfo = getCurrentWeek(config?.startDate, config?.weekOverride);

  // Try per-week storage first, then legacy full plan
  let dayData = null;
  const weekData = await getPlanWeek(username, weekInfo.weekNumber);
  if (weekData?.days) {
    dayData = weekData.days.find(d => d.dayNumber === dayNum) || weekData.days[dayNum - 1] || null;
  }

  if (!dayData) {
    // Fallback: legacy full plan
    const plan = await getPlan(username);
    if (plan?.weeks) {
      const week = plan.weeks.find(w => w.weekNumber === weekInfo.weekNumber);
      if (week?.days) {
        dayData = week.days.find(d => d.dayNumber === dayNum) || week.days[dayNum - 1] || null;
      }
    }
  }

  if (!dayData) {
    return { error: 'No plan found for this day. Generate a plan from the dashboard.' };
  }

  const today = new Date().toISOString().split('T')[0];

  const doneToday = (history || []).some(h => (h.day === dayNum || h.dayNumber === dayNum) && h.date === today);

  const prevEntry = (history || [])
    .filter(h => (h.day === dayNum || h.dayNumber === dayNum) && h.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  const prevWorkout = prevEntry ? await getWorkout(username, prevEntry.date) : null;

  return {
    username,
    dayData,
    dayNum,
    weekInfo,
    prevWorkout,
    doneToday,
    today
  };
}
