// POST /api/generate-plan
// Progressive generation modes:
//   { mode: "skeleton", profile }                           → program structure (no exercises)
//   { mode: "test-day", profile, skeleton }                 → Day 1 calibration exercises
//   { mode: "remaining-days", profile, skeleton, weekNumber } → Days 2-N of Week 1
//   { mode: "week", profile, weekNumber }                   → full week, calibrated from history
//   { mode: "day",  profile, currentDay, weekNumber }       → regenerate one day
//   { mode: "full", profile }                               → legacy: entire 5-week plan

import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/auth.js';
import {
  generatePlan, generateDay, generateSkeleton, generateTestDay,
  generateRemainingDays, generateWeek, buildHistorySummary, summarizeDay1Results
} from '$lib/ai.js';
import {
  savePlan, getPlan, getWorkoutHistory,
  saveSkeleton, getSkeleton, savePlanWeek, getPlanWeek, clearPlanWeeks
} from '$lib/storage.js';
import { evaluateDeloadTriggers } from '$lib/intensityCalc.js';
import { kv } from '$lib/kv.js';

const MAX_DAILY_GENERATIONS = 7; // increased for progressive flow

async function checkRateLimit(username) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `ratelimit:generate:${username}:${today}`;
  const count = (await kv.get(key)) || 0;

  if (count >= MAX_DAILY_GENERATIONS) {
    return false;
  }

  await kv.set(key, count + 1);
  await kv.expire(key, 86400);
  return true;
}

export const config = { maxDuration: 60 };

export async function POST({ request, cookies }) {
  const username = requireAuth(cookies);
  const body = await request.json();
  const { mode, profile, currentDay, weekNumber } = body;

  const allowed = await checkRateLimit(username);
  if (!allowed) {
    throw error(429, 'Daily generation limit reached (7/day). Try again tomorrow.');
  }

  try {
    // ── Skeleton: program structure only ──
    if (mode === 'skeleton') {
      const skeleton = await generateSkeleton(profile);
      await saveSkeleton(username, skeleton);
      return json({ success: true, skeleton });
    }

    // ── Test Day: Day 1 calibration exercises ──
    if (mode === 'test-day') {
      const skeleton = body.skeleton || await getSkeleton(username);
      if (!skeleton) throw error(400, 'No skeleton found. Generate skeleton first.');

      const day1 = await generateTestDay(profile, skeleton);

      // Save as partial Week 1 (just Day 1)
      const week1Overview = skeleton.weekOverviews?.[0];
      const week1Data = {
        weekNumber: 1,
        theme: week1Overview?.theme || 'Introduction',
        isDeload: false,
        days: [day1]
      };
      await savePlanWeek(username, 1, week1Data);

      return json({ success: true, day: day1 });
    }

    // ── Remaining Days: Days 2-N of Week 1 after test day ──
    if (mode === 'remaining-days') {
      const skeleton = await getSkeleton(username);
      if (!skeleton) throw error(400, 'No skeleton found.');

      // Get Day 1 workout data to calibrate
      const logs = await getWorkoutHistory(username);
      console.log(`[remaining-days] ${username}: ${logs.length} workout logs found`);
      const day1Log = logs.find(l => (l.dayNumber === 1 || l.day === 1) && l.weekNumber === 1);
      if (!day1Log && logs.length > 0) {
        console.log(`[remaining-days] Day 1 log NOT found. First log fields:`, Object.keys(logs[0]), 'dayNumber:', logs[0].dayNumber, 'day:', logs[0].day, 'weekNumber:', logs[0].weekNumber);
      } else {
        console.log(`[remaining-days] Day 1 log found:`, !!day1Log);
      }
      const day1Results = day1Log ? summarizeDay1Results(day1Log) : null;

      const result = await generateRemainingDays(profile, skeleton, day1Results);

      // Merge with existing Week 1 (which has Day 1)
      const existingWeek1 = await getPlanWeek(username, 1);
      if (existingWeek1) {
        existingWeek1.days = [
          ...existingWeek1.days.filter(d => d.dayNumber === 1), // keep Day 1
          ...result.days // add remaining days
        ];
        await savePlanWeek(username, 1, existingWeek1);
      }

      return json({ success: true, days: result.days });
    }

    // ── Week: generate a full week from history ──
    if (mode === 'week') {
      if (!weekNumber) throw error(400, 'Missing weekNumber.');

      const skeleton = await getSkeleton(username);
      if (!skeleton) throw error(400, 'No skeleton found.');

      const logs = await getWorkoutHistory(username);
      const history = buildHistorySummary(logs);

      // Evaluate deload triggers
      const deloadEval = evaluateDeloadTriggers(history, weekNumber);
      if (history) {
        history.deloadRecommended = deloadEval.shouldDeload;
        history.deloadReasons = deloadEval.reasons;
      }

      // Get previous week's exercises for rotation
      const prevWeek = weekNumber > 1 ? await getPlanWeek(username, weekNumber - 1) : null;
      const prevWeekExercises = prevWeek?.days || null;

      const week = await generateWeek(profile, weekNumber, skeleton, history, prevWeekExercises);
      await savePlanWeek(username, weekNumber, week);

      return json({ success: true, week, deloadRecommended: deloadEval.shouldDeload, deloadReasons: deloadEval.reasons });
    }

    // ── Day: shuffle one day within a week ──
    if (mode === 'day') {
      if (!currentDay) throw error(400, 'Missing currentDay.');
      const wk = weekNumber || 1;

      const logs = await getWorkoutHistory(username);
      const history = buildHistorySummary(logs);

      const newDay = await generateDay(profile, currentDay, history);

      // Update in per-week storage
      const weekData = await getPlanWeek(username, wk);
      if (weekData) {
        const dayIdx = weekData.days.findIndex(d => d.dayNumber === currentDay.dayNumber);
        if (dayIdx !== -1) {
          weekData.days[dayIdx] = { ...newDay, dayNumber: currentDay.dayNumber };
        }
        await savePlanWeek(username, wk, weekData);
      } else {
        // Fallback: try legacy plan
        const existingPlan = await getPlan(username);
        if (existingPlan) {
          for (const week of existingPlan.weeks) {
            const dayIdx = week.days.findIndex(d => d.dayNumber === currentDay.dayNumber);
            if (dayIdx !== -1) {
              week.days[dayIdx] = { ...newDay, dayNumber: currentDay.dayNumber };
            }
          }
          await savePlan(username, existingPlan);
        }
      }

      return json({ success: true, day: newDay });
    }

    // ── Full: legacy full plan generation ──
    const logs = await getWorkoutHistory(username);
    const history = buildHistorySummary(logs);
    const plan = await generatePlan(profile, history);
    await savePlan(username, plan);
    return json({ success: true, plan });

  } catch (err) {
    console.error('Plan generation error:', err);
    throw error(500, `Failed to generate plan: ${err.message}`);
  }
}
