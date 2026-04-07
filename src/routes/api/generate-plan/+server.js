// POST /api/generate-plan
// Two modes:
//   { mode: "full", profile: {...}, history?: {...} }  → generates entire 5-week plan
//   { mode: "day",  profile: {...}, currentDay: {...}, history?: {...} } → regenerates one day

import { json, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/auth.js';
import { generatePlan, generateDay, buildHistorySummary } from '$lib/ai.js';
import { savePlan, getPlan, getWorkoutHistory } from '$lib/storage.js';
import { kv } from '$lib/kv.js';

const MAX_DAILY_GENERATIONS = 5;

async function checkRateLimit(username) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `ratelimit:generate:${username}:${today}`;
  const count = (await kv.get(key)) || 0;

  if (count >= MAX_DAILY_GENERATIONS) {
    return false;
  }

  await kv.set(key, count + 1);
  // Expire at end of day (24h from now is safe enough)
  await kv.expire(key, 86400);
  return true;
}

export async function POST({ request, cookies }) {
  const username = requireAuth(cookies);
  const body = await request.json();
  const { mode, profile, currentDay, history: clientHistory } = body;

  // Rate limit check
  const allowed = await checkRateLimit(username);
  if (!allowed) {
    throw error(429, 'Daily plan generation limit reached (5/day). Try again tomorrow.');
  }

  // Build history from workout logs if not provided by client
  let history = clientHistory;
  if (!history) {
    const logs = await getWorkoutHistory(username);
    history = buildHistorySummary(logs);
  }

  try {
    if (mode === 'day') {
      if (!currentDay) {
        throw error(400, 'Missing currentDay for day regeneration');
      }
      const newDay = await generateDay(profile, currentDay, history);

      // Update the plan in Redis — replace just this day
      const existingPlan = await getPlan(username);
      if (existingPlan) {
        for (const week of existingPlan.weeks) {
          const dayIdx = week.days.findIndex((d) => d.dayNumber === currentDay.dayNumber);
          if (dayIdx !== -1) {
            week.days[dayIdx] = { ...newDay, dayNumber: currentDay.dayNumber };
          }
        }
        await savePlan(username, existingPlan);
      }

      return json({ success: true, day: newDay });
    }

    // mode === 'full' (default)
    const plan = await generatePlan(profile, history);
    await savePlan(username, plan);
    return json({ success: true, plan });

  } catch (err) {
    console.error('Plan generation error:', err);
    throw error(500, `Failed to generate plan: ${err.message}`);
  }
}
