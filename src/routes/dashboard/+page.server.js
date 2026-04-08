import { redirect, fail } from '@sveltejs/kit';
import { requireAuth } from '$lib/auth';
import {
  getUserConfig, updateUserConfig, getWorkoutHistory, getUser,
  getPlan, getSkeleton, getPlanWeek
} from '$lib/storage';
import { getCurrentWeek } from '$lib/weekCalc';
import { buildHistorySummary } from '$lib/ai.js';
import { evaluateDeloadTriggers } from '$lib/intensityCalc.js';

export async function load({ cookies }) {
  const username = requireAuth(cookies);

  const [user, config, workoutHistory, skeleton] = await Promise.all([
    getUser(username),
    getUserConfig(username),
    getWorkoutHistory(username),
    getSkeleton(username)
  ]);

  const weekInfo = getCurrentWeek(config?.startDate, config?.weekOverride);

  // Try progressive storage first, then legacy
  let currentWeekDays = [];
  let weekGenerated = false;
  let day1Only = false;
  let hasSkeleton = !!skeleton;
  let legacyPlan = null;

  const currentWeekData = await getPlanWeek(username, weekInfo.weekNumber);

  if (currentWeekData?.days?.length) {
    currentWeekDays = currentWeekData.days;
    weekGenerated = true;

    // Check if Week 1 only has Day 1 (test day completed, rest not generated)
    if (weekInfo.weekNumber === 1 && currentWeekDays.length === 1) {
      const daysPerWeek = config?.daysPerWeek || skeleton?.daysPerWeek || 4;
      if (daysPerWeek > 1) {
        day1Only = true;
        weekGenerated = false; // not fully generated yet
      }
    }
  } else {
    // Fallback: legacy full plan
    legacyPlan = await getPlan(username);
    if (legacyPlan?.weeks) {
      const week = legacyPlan.weeks.find(w => w.weekNumber === weekInfo.weekNumber);
      if (week) {
        currentWeekDays = week.days || [];
        weekGenerated = true;
      }
      hasSkeleton = true; // legacy plan implies program exists
    }
  }

  // Detect skeleton-only state (skeleton exists but no days generated)
  let skeletonOnly = hasSkeleton && currentWeekDays.length === 0 && !day1Only;

  // Check Day 1 completion status
  let day1Complete = false;
  let day1Summary = null;
  if (day1Only) {
    const day1Entry = (workoutHistory || []).find(
      entry => (entry.dayNumber === 1 || entry.day === 1) && entry.weekNumber === 1
    );
    day1Complete = !!day1Entry;

    // Build Day 1 summary for dashboard display
    if (day1Complete && day1Entry?.exercises?.length) {
      const exSummaries = day1Entry.exercises.map(ex => {
        const completedSets = (ex.actual || []).filter(s => s.completed);
        const avgRPE = completedSets.length > 0
          ? (completedSets.reduce((sum, s) => sum + (s.rpe || 0), 0) / completedSets.length).toFixed(1)
          : null;
        const bestSet = completedSets.reduce((best, s) => (s.weight > (best?.weight || 0)) ? s : best, null);
        return {
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          setsCompleted: completedSets.length,
          setsTotal: ex.prescribed?.sets || completedSets.length,
          avgRPE,
          bestWeight: bestSet?.weight || 0,
          bestReps: bestSet?.reps || 0,
          feedback: ex.feedback
        };
      });

      let durationMin = null;
      if (day1Entry.startedAt && day1Entry.completedAt) {
        durationMin = Math.round((new Date(day1Entry.completedAt) - new Date(day1Entry.startedAt)) / 60000);
      }

      const painExercises = exSummaries.filter(e => e.feedback === 'pain').map(e => e.name);
      const overallAvgRPE = exSummaries.filter(e => e.avgRPE).length > 0
        ? (exSummaries.reduce((sum, e) => sum + (parseFloat(e.avgRPE) || 0), 0) / exSummaries.filter(e => e.avgRPE).length).toFixed(1)
        : null;

      day1Summary = {
        exercises: exSummaries,
        durationMin,
        painExercises,
        overallAvgRPE,
        totalSets: exSummaries.reduce((sum, e) => sum + e.setsCompleted, 0)
      };
    }
  }

  // Determine day statuses
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedDays = new Set();
  for (const entry of (workoutHistory || [])) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
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
      dayStatuses[dayNum] = 'today';
    } else if (idx < completedDays.size) {
      dayStatuses[dayNum] = 'missed';
    } else {
      dayStatuses[dayNum] = 'upcoming';
    }
  });

  // Evaluate deload triggers for the next week CTA
  const history = buildHistorySummary(workoutHistory || []);
  const deloadEval = history ? evaluateDeloadTriggers(history, weekInfo.weekNumber) : { shouldDeload: false, reasons: [] };

  // Get week overview from skeleton for "generate week" CTA
  const weekOverview = skeleton?.weekOverviews?.find(w => w.weekNumber === weekInfo.weekNumber) || null;

  return {
    username,
    name: user?.name || username,
    config: config || {},
    weekInfo,
    skeleton,
    currentWeekDays,
    weekGenerated,
    skeletonOnly,
    day1Only,
    day1Complete,
    day1Summary,
    dayStatuses,
    sessionsCompleted: completedDays.size,
    hasPlan: hasSkeleton || !!legacyPlan,
    weekOverview,
    deloadRecommended: deloadEval.shouldDeload,
    deloadReasons: deloadEval.reasons,
    historySummary: history
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
    if (isNaN(weekOverride) || weekOverride < 1 || weekOverride > 10) {
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
