// POST /api/admin/reset-plan
// One-time admin endpoint to wipe a user's plan and regenerate with updated profile.
// Protected by requiring a matching ANTHROPIC_API_KEY header.

import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
  getUserConfig, updateUserConfig, getSkeleton,
  saveSkeleton, clearPlanWeeks, savePlanWeek
} from '$lib/storage.js';
import { generateSkeleton, generateTestDay } from '$lib/ai.js';
import { kv } from '$lib/kv.js';

export const config = { maxDuration: 120 };

export async function POST({ request }) {
  // Simple auth: require the API key as a bearer token
  const authHeader = request.headers.get('authorization');
  const expectedToken = env.ANTHROPIC_API_KEY;
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    throw error(401, 'Unauthorized');
  }

  const body = await request.json();
  const { username } = body;

  if (!username) {
    throw error(400, 'Missing username');
  }

  // 1. Read current config
  const currentConfig = await getUserConfig(username);
  if (!currentConfig) {
    throw error(404, `No config found for user "${username}"`);
  }

  console.log(`[admin/reset-plan] Current config for ${username}:`, JSON.stringify(currentConfig, null, 2));

  // 2. Update profile with new preferences
  const updatedFields = {
    focusMuscles: ['Back', 'Chest', 'Arms', 'Shoulders', 'Core'],
    goal: 'Build muscle',
    freeformNotes: [
      'Goal: lean muscle definition, fitness model physique — NOT bulky.',
      'Target ~10% muscle gain with emphasis on definition and leanness.',
      'Upper body focused: back, chest, arms, shoulders, core. No dedicated leg days.',
      'Day 1 MUST focus on Shoulders + Core as primary muscle groups.',
      'Prioritize exercises that build aesthetic proportions: V-taper (wide back, capped shoulders, defined arms, visible abs).',
      'Include higher rep ranges (10-15) with moderate weight for definition.',
      'Incorporate supersets and drop sets for time efficiency and metabolic stress.',
      currentConfig.freeformNotes
    ].filter(Boolean).join('\n')
  };

  const newConfig = { ...currentConfig, ...updatedFields };
  await updateUserConfig(username, updatedFields);

  console.log(`[admin/reset-plan] Updated config for ${username}`);

  // 3. Wipe existing plan data
  await Promise.all([
    kv.del(`plan:${username}:skeleton`),
    kv.del(`plan:${username}`), // legacy plan
    clearPlanWeeks(username, 10)
  ]);

  console.log(`[admin/reset-plan] Wiped plan data for ${username}`);

  // 4. Build profile object for AI
  const profile = {
    equipment: newConfig.equipment,
    goal: newConfig.goal,
    daysPerWeek: newConfig.daysPerWeek,
    experience: newConfig.experience,
    focusMuscles: newConfig.focusMuscles,
    cardio: newConfig.cardio,
    cardioType: newConfig.cardioType,
    cardioDuration: newConfig.cardioDuration,
    mobility: newConfig.mobility,
    injuries: newConfig.injuries,
    sessionDuration: newConfig.sessionDuration,
    freeformNotes: newConfig.freeformNotes,
    age: newConfig.age,
    bodyWeight: newConfig.bodyWeight,
    bodyFat: newConfig.bodyFat,
    trainingAge: newConfig.trainingAge
  };

  console.log(`[admin/reset-plan] Generating skeleton for ${username}...`);

  // 5. Generate new skeleton
  const skeleton = await generateSkeleton(profile);
  await saveSkeleton(username, skeleton);

  console.log(`[admin/reset-plan] Skeleton generated:`, skeleton.programName);

  // 6. Generate test day (Day 1 — shoulder + core focus)
  console.log(`[admin/reset-plan] Generating test day for ${username}...`);
  const day1 = await generateTestDay(profile, skeleton);

  // Save as Week 1 with just Day 1
  const week1Overview = skeleton.weekOverviews?.[0];
  const week1Data = {
    weekNumber: 1,
    theme: week1Overview?.theme || 'Introduction',
    isDeload: false,
    days: [day1]
  };
  await savePlanWeek(username, 1, week1Data);

  console.log(`[admin/reset-plan] Day 1 generated: ${day1.name} (${day1.focus})`);

  // 7. Reset week override and start date to today
  await updateUserConfig(username, {
    startDate: new Date().toISOString().split('T')[0],
    weekOverride: null
  });

  return json({
    success: true,
    username,
    previousFocusMuscles: currentConfig.focusMuscles,
    newFocusMuscles: updatedFields.focusMuscles,
    skeleton: {
      programName: skeleton.programName,
      programDescription: skeleton.programDescription,
      totalWeeks: skeleton.totalWeeks,
      daysPerWeek: skeleton.daysPerWeek,
      weekOverviews: skeleton.weekOverviews?.map(w => ({
        weekNumber: w.weekNumber,
        theme: w.theme,
        days: w.days?.map(d => ({ dayNumber: d.dayNumber, name: d.name, focus: d.focus }))
      }))
    },
    day1: {
      name: day1.name,
      focus: day1.focus,
      exercises: day1.exercises?.map(e => ({
        name: e.name,
        muscleGroup: e.muscleGroup,
        sets: e.sets,
        reps: e.reps,
        rpe: e.rpe
      }))
    }
  });
}
