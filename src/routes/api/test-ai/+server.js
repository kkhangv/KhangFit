// Development-only smoke test for all AI generation endpoints.
// Runs each AI function with mock data in the exact shape the frontend sends.
//
// Usage (dev only):
//   GET /api/test-ai           → runs all 5 tests sequentially
//   GET /api/test-ai?test=skeleton
//   GET /api/test-ai?test=testday
//   GET /api/test-ai?test=remaining
//   GET /api/test-ai?test=week
//   GET /api/test-ai?test=day
//
// Each test logs timing and a compact summary so you can verify schema + content.

import { json, error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import {
  generateSkeleton,
  generateTestDay,
  generateRemainingDays,
  generateWeek,
  generateDay,
  buildHistorySummary,
  summarizeDay1Results,
} from '$lib/ai.js';

// ---------------------------------------------------------------------------
// Mock data — mirrors exact shapes the frontend sends to /api/generate-plan
// ---------------------------------------------------------------------------

/** Full profile object (all 14 fields from onboarding). */
const MOCK_PROFILE = {
  equipment: ['barbell', 'dumbbells', 'pull-up bar', 'bench', 'squat rack'],
  goal: 'hypertrophy',
  daysPerWeek: 4,
  experience: 'intermediate',
  focusMuscles: ['chest', 'back', 'shoulders'],
  cardio: 'minimal',
  cardioType: 'cycling',
  cardioDuration: 20,
  mobility: ['hip flexors', 'thoracic spine'],
  injuries: null,
  sessionDuration: 60,
  freeformNotes: null,
  age: 28,
  bodyWeight: 175,
  bodyFat: 15,
  trainingAge: '3-5 years',
};

/**
 * Mock Day 1 workout log — mirrors the exact shape saved by saveWorkout().
 * Keys that matter for AI functions:
 *   - exercises[].actual  (NOT .sets) — array of { weight, reps, rpe, completed }
 *   - exercises[].prescribed — { sets, reps, rpe } from the plan
 *   - exercises[].feedback   — 'good' | 'easy' | 'hard' | 'pain'
 *   - readiness — object { sleep, stress, soreness, energy } (each 1-5)
 *   - startedAt / completedAt — ISO strings (duration derived from these)
 */
const _now = Date.now();
const MOCK_DAY1_WORKOUT = {
  dayNumber: 1,
  weekNumber: 1,
  date: new Date().toISOString().slice(0, 10),
  startedAt: new Date(_now - 52 * 60 * 1000).toISOString(),
  completedAt: new Date(_now).toISOString(),
  readiness: { sleep: 4, stress: 2, soreness: 2, energy: 4 },
  exercises: [
    {
      name: 'Barbell Bench Press',
      muscleGroup: 'chest',
      feedback: 'good',
      prescribed: { sets: 3, reps: 8, rpe: 8 },
      actual: [
        { weight: 135, reps: 8, rpe: 8, completed: true },
        { weight: 135, reps: 7, rpe: 9, completed: true },
        { weight: 125, reps: 8, rpe: 8, completed: true },
      ],
    },
    {
      name: 'Barbell Back Squat',
      muscleGroup: 'quads',
      feedback: 'good',
      prescribed: { sets: 3, reps: 8, rpe: 8 },
      actual: [
        { weight: 185, reps: 8, rpe: 8, completed: true },
        { weight: 185, reps: 8, rpe: 8, completed: true },
        { weight: 185, reps: 7, rpe: 9, completed: true },
      ],
    },
    {
      name: 'Pull-Up',
      muscleGroup: 'back',
      feedback: 'hard',
      prescribed: { sets: 3, reps: 8, rpe: 8 },
      actual: [
        { weight: 0, reps: 8, rpe: 8, completed: true },
        { weight: 0, reps: 7, rpe: 9, completed: true },
        { weight: 0, reps: 6, rpe: 10, completed: true },
      ],
    },
    {
      name: 'Dumbbell Lateral Raise',
      muscleGroup: 'shoulders',
      feedback: 'easy',
      prescribed: { sets: 3, reps: 12, rpe: 7 },
      actual: [
        { weight: 20, reps: 12, rpe: 7, completed: true },
        { weight: 20, reps: 12, rpe: 7, completed: true },
        { weight: 25, reps: 10, rpe: 8, completed: true },
      ],
    },
  ],
};

/**
 * Mock current day — for the "day" shuffle mode.
 * Mirrors the day object shape from DAY_SCHEMA.
 */
const MOCK_CURRENT_DAY = {
  dayNumber: 2,
  name: 'Lower Body Power',
  focus: ['quads', 'hamstrings', 'glutes'],
  exercises: [
    {
      name: 'Barbell Back Squat',
      equipment: 'barbell',
      muscleGroup: 'quads',
      sets: 4,
      reps: 6,
      rpe: 8,
      rest: 180,
      cue: 'Brace core, knees out',
      tip: null,
      technique: null,
      techniqueNote: null,
      supersetWith: null,
      isCardio: false,
      isMobility: false,
    },
    {
      name: 'Romanian Deadlift',
      equipment: 'barbell',
      muscleGroup: 'hamstrings',
      sets: 3,
      reps: 8,
      rpe: 8,
      rest: 120,
      cue: 'Hip hinge, soft knees',
      tip: null,
      technique: null,
      techniqueNote: null,
      supersetWith: null,
      isCardio: false,
      isMobility: false,
    },
    {
      name: 'Leg Press',
      equipment: 'machine',
      muscleGroup: 'quads',
      sets: 3,
      reps: 10,
      rpe: 7,
      rest: 90,
      cue: null,
      tip: null,
      technique: null,
      techniqueNote: null,
      supersetWith: null,
      isCardio: false,
      isMobility: false,
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function summarise(obj) {
  if (!obj) return null;
  // Return a compact version of an object so the JSON response is readable
  return JSON.stringify(obj).slice(0, 300) + (JSON.stringify(obj).length > 300 ? '…' : '');
}

async function run(label, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    return { ok: true, ms: Date.now() - start, ...result };
  } catch (e) {
    console.error(`[test-ai] ${label} FAILED:`, e.message);
    return { ok: false, ms: Date.now() - start, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET({ url }) {
  if (!dev) {
    throw error(403, 'This endpoint is only available in development mode.');
  }

  const testMode = url.searchParams.get('test') || 'all';
  const results = {};

  // Shared state across sequential tests — each test can feed the next
  let skeleton = null;

  // ── 1. Skeleton ──────────────────────────────────────────────────────────
  if (testMode === 'all' || testMode === 'skeleton') {
    results.skeleton = await run('skeleton', async () => {
      skeleton = await generateSkeleton(MOCK_PROFILE);
      return {
        programName: skeleton.programName,
        totalWeeks: skeleton.totalWeeks,
        daysPerWeek: skeleton.daysPerWeek,
        weekOverviewCount: skeleton.weekOverviews?.length,
        week1DayCount: skeleton.weekOverviews?.[0]?.days?.length,
        week1Theme: skeleton.weekOverviews?.[0]?.theme,
        preview: summarise(skeleton.weekOverviews?.[0]),
      };
    });
    console.log('[test-ai] skeleton:', results.skeleton.ok ? 'OK' : 'FAIL', results.skeleton.error || '');
  }

  // ── 2. Test Day (Day 1) ──────────────────────────────────────────────────
  if (testMode === 'all' || testMode === 'testday') {
    results.testDay = await run('test-day', async () => {
      const day1 = await generateTestDay(MOCK_PROFILE, skeleton);
      return {
        dayName: day1.name,
        focus: day1.focus,
        exerciseCount: day1.exercises?.length,
        exercises: day1.exercises?.map(e => `${e.name} ${e.sets}x${e.reps} @RPE${e.rpe}`),
      };
    });
    console.log('[test-ai] testDay:', results.testDay.ok ? 'OK' : 'FAIL', results.testDay.error || '');
  }

  // ── 3. Remaining Days (Days 2-N of Week 1) ───────────────────────────────
  if (testMode === 'all' || testMode === 'remaining') {
    results.remainingDays = await run('remaining-days', async () => {
      const day1Summary = summarizeDay1Results(MOCK_DAY1_WORKOUT);
      const result = await generateRemainingDays(MOCK_PROFILE, skeleton, day1Summary);
      return {
        dayCount: result.days?.length,
        dayNames: result.days?.map(d => d.name),
        day1SummaryUsed: {
          totalSets: day1Summary.totalSets,
          overallAvgRPE: day1Summary.overallAvgRPE,
          durationMin: day1Summary.durationMin,
          exerciseCount: day1Summary.exercises?.length,
        },
      };
    });
    console.log('[test-ai] remainingDays:', results.remainingDays.ok ? 'OK' : 'FAIL', results.remainingDays.error || '');
  }

  // ── 4. Week (generate Week 2 from history) ───────────────────────────────
  if (testMode === 'all' || testMode === 'week') {
    results.week = await run('week', async () => {
      const history = buildHistorySummary([MOCK_DAY1_WORKOUT]);
      const week = await generateWeek(MOCK_PROFILE, 2, skeleton, history, null);
      return {
        weekNumber: week.weekNumber,
        theme: week.theme,
        isDeload: week.isDeload,
        dayCount: week.days?.length,
        dayNames: week.days?.map(d => d.name),
        historySummaryKeys: Object.keys(history || {}),
      };
    });
    console.log('[test-ai] week:', results.week.ok ? 'OK' : 'FAIL', results.week.error || '');
  }

  // ── 5. Day (shuffle one day) ─────────────────────────────────────────────
  if (testMode === 'all' || testMode === 'day') {
    results.day = await run('day', async () => {
      const history = buildHistorySummary([MOCK_DAY1_WORKOUT]);
      const newDay = await generateDay(MOCK_PROFILE, MOCK_CURRENT_DAY, history);
      return {
        dayName: newDay.name,
        focus: newDay.focus,
        exerciseCount: newDay.exercises?.length,
        exercises: newDay.exercises?.map(e => `${e.name} ${e.sets}x${e.reps} @RPE${e.rpe}`),
      };
    });
    console.log('[test-ai] day:', results.day.ok ? 'OK' : 'FAIL', results.day.error || '');
  }

  const allOk = Object.values(results).every((r) => r.ok);
  const totalMs = Object.values(results).reduce((sum, r) => sum + (r.ms || 0), 0);

  return json({
    allOk,
    totalMs,
    testsRun: Object.keys(results),
    results,
    mockDataUsed: {
      profile: MOCK_PROFILE,
      day1WorkoutExerciseCount: MOCK_DAY1_WORKOUT.exercises.length,
      currentDayExerciseCount: MOCK_CURRENT_DAY.exercises.length,
    },
  });
}
