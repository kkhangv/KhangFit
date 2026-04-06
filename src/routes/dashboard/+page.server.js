import { redirect, fail } from '@sveltejs/kit';
import { requireAuth, getSession } from '$lib/auth';
import { getUserConfig, updateUserConfig, getWorkoutHistory, getLast6Weeks, getLatestStats, getUser } from '$lib/storage';
import { getCurrentWeek, getTodayDay } from '$lib/weekCalc';
import { workoutProgram } from '$lib/workoutData';

// Day-of-week mapping: which calendar days each training day falls on
// Day 1 = Monday (1), Day 2 = Tuesday (2), Day 3 = Thursday (4), Day 4 = Saturday (6)
const DAY_DOW = { 1: 1, 2: 2, 3: 4, 4: 6 };

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const dow = d.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow; // Monday-based
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDayStatuses(workoutHistory, weekInfo) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = getWeekStart(today);

  // Find workouts completed this calendar week
  const thisWeekDates = new Set();
  for (const entry of workoutHistory) {
    const d = new Date(entry.date);
    d.setHours(0, 0, 0, 0);
    if (d >= weekStart && d <= today) {
      thisWeekDates.add(`day${entry.day}`);
    }
  }

  const todayDow = today.getDay(); // 0=Sun

  const statuses = {};
  for (const day of workoutProgram) {
    const dayNum = parseInt(day.id.replace('day', ''));
    const targetDow = DAY_DOW[dayNum];

    if (thisWeekDates.has(day.id)) {
      statuses[day.id] = 'done';
    } else {
      // Compute the target date for this day in the current week
      const targetDate = new Date(weekStart);
      targetDate.setDate(weekStart.getDate() + (targetDow === 0 ? 6 : targetDow - 1));

      if (targetDate < today) {
        statuses[day.id] = 'missed';
      } else if (targetDate.getTime() === today.getTime()) {
        statuses[day.id] = 'today';
      } else {
        statuses[day.id] = 'upcoming';
      }
    }
  }

  return statuses;
}

export async function load({ cookies }) {
  const username = requireAuth(cookies);

  const [user, config, workoutHistory, last6Weeks, latestStats] = await Promise.all([
    getUser(username),
    getUserConfig(username),
    getWorkoutHistory(username),
    getLast6Weeks(username),
    getLatestStats(username)
  ]);

  const weekInfo = getCurrentWeek(config?.startDate, config?.weekOverride);
  const dayStatuses = getDayStatuses(workoutHistory || [], weekInfo);

  // Volume stats for this week
  const today = new Date();
  const weekStart = getWeekStart(today);
  const thisWeekSessions = (workoutHistory || []).filter(h => {
    const d = new Date(h.date);
    return d >= weekStart && d <= today;
  });

  const sessionsCompleted = thisWeekSessions.length;

  // Next workout day
  const todayDow = today.getDay();
  let nextDay = null;
  const dayOrder = [1, 2, 3, 4];
  for (const dayNum of dayOrder) {
    const did = `day${dayNum}`;
    if (dayStatuses[did] === 'today' || dayStatuses[did] === 'upcoming') {
      nextDay = workoutProgram.find(d => d.id === did);
      break;
    }
  }

  return {
    username,
    name: user?.name || username,
    config: config || {},
    weekInfo,
    workoutHistory: workoutHistory || [],
    last6Weeks: last6Weeks || [],
    latestStats: latestStats || null,
    dayStatuses,
    sessionsCompleted,
    nextDay,
    days: workoutProgram
  };
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
