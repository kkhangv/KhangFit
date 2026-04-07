import { redirect, fail } from '@sveltejs/kit';
import { requireAuth } from '$lib/auth';
import { getUserConfig, updateUserConfig, getWorkoutHistory, getUser, getPlan } from '$lib/storage';
import { getCurrentWeek } from '$lib/weekCalc';

export async function load({ cookies }) {
  const username = requireAuth(cookies);

  const [user, config, workoutHistory, plan] = await Promise.all([
    getUser(username),
    getUserConfig(username),
    getWorkoutHistory(username),
    getPlan(username)
  ]);

  const weekInfo = getCurrentWeek(config?.startDate, config?.weekOverride);

  // Extract current week's days from the AI plan
  let currentWeekDays = [];
  if (plan?.weeks) {
    const week = plan.weeks.find((w) => w.weekNumber === weekInfo.weekNumber);
    if (week) {
      currentWeekDays = week.days || [];
    }
  }

  // Determine status for each day (done, today, upcoming, missed)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  // Find which days were completed this week
  const completedDays = new Set();
  for (const entry of (workoutHistory || [])) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    // Check if within current week
    const weekStart = getWeekStart(today);
    if (entryDate >= weekStart && entryDate <= today) {
      completedDays.add(entry.day || entry.dayNumber);
    }
  }

  const dayStatuses = {};
  currentWeekDays.forEach((day, idx) => {
    const dayNum = day.dayNumber || (idx + 1);
    if (completedDays.has(dayNum)) {
      dayStatuses[dayNum] = 'done';
    } else if (idx === completedDays.size) {
      // Next unfinished day is "today" / active
      dayStatuses[dayNum] = 'today';
    } else if (idx < completedDays.size) {
      dayStatuses[dayNum] = 'missed';
    } else {
      dayStatuses[dayNum] = 'upcoming';
    }
  });

  const sessionsCompleted = completedDays.size;

  return {
    username,
    name: user?.name || username,
    config: config || {},
    weekInfo,
    plan,
    currentWeekDays,
    dayStatuses,
    sessionsCompleted,
    hasPlan: !!plan
  };
}

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const actions = {
  updateWeek: async ({ cookies, request }) => {
    const username = requireAuth(cookies);
    const data = await request.formData();
    const weekOverride = parseInt(data.get('week'));
    if (isNaN(weekOverride) || weekOverride < 1 || weekOverride > 5) {
      return fail(400, { error: 'Invalid week number.' });
    }
    await updateUserConfig(username, { weekOverride });
    return { success: true };
  },

  resetWeek: async ({ cookies }) => {
    const username = requireAuth(cookies);
    await updateUserConfig(username, { weekOverride: null });
    return { success: true };
  }
};
