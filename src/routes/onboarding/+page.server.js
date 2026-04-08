import { redirect, fail } from '@sveltejs/kit';
import { getUser, createUser, updateUserConfig, saveSkeleton } from '$lib/storage';
import { hashPassword, createSession } from '$lib/auth';
import { generateSkeleton } from '$lib/ai.js';

export async function load({ cookies }) {
  const { getSession } = await import('$lib/auth');
  const userId = getSession(cookies);
  if (userId) {
    redirect(302, '/dashboard');
  }
  return {};
}

export const actions = {
  default: async ({ cookies, request }) => {
    const data = await request.formData();

    // Step 1: Account
    const name = data.get('name')?.toString().trim();
    const username = data.get('username')?.toString().trim().toLowerCase();
    const password = data.get('password')?.toString();
    const phone = data.get('phone')?.toString().trim() || null;

    // Step 2: About You + Training
    const age = data.get('age') ? parseInt(data.get('age')) : null;
    const bodyWeight = data.get('bodyWeight') ? parseFloat(data.get('bodyWeight')) : null;
    const bodyFat = data.get('bodyFat') ? parseFloat(data.get('bodyFat')) : null;
    const trainingAge = data.get('trainingAge')?.toString() || null;
    const equipment = JSON.parse(data.get('equipment') || '[]');
    const goal = data.get('goal')?.toString() || 'Build muscle';
    const daysPerWeek = parseInt(data.get('daysPerWeek')) || 4;
    const experience = data.get('experience')?.toString() || 'Intermediate';

    // Step 3: Personalize
    const focusMuscles = JSON.parse(data.get('focusMuscles') || '[]');
    const cardio = data.get('cardio')?.toString() || 'none';
    const cardioType = data.get('cardioType')?.toString() || null;
    const cardioDuration = data.get('cardioDuration') ? parseInt(data.get('cardioDuration')) : null;
    const mobility = JSON.parse(data.get('mobility') || '[]');
    const injuries = data.get('injuries')?.toString().trim() || null;
    const sessionDuration = data.get('sessionDuration') ? parseInt(data.get('sessionDuration')) : null;
    const freeformNotes = data.get('freeformNotes')?.toString().trim() || null;

    // Validation
    if (!name || !username || !password) {
      return fail(400, { error: 'Please fill in all required fields.' });
    }
    if (password.length < 6) {
      return fail(400, { error: 'Password must be at least 6 characters.' });
    }
    if (!username.match(/^[a-z0-9_]+$/)) {
      return fail(400, { error: 'Username: letters, numbers, underscores only.' });
    }
    if (equipment.length === 0) {
      return fail(400, { error: 'Please select your equipment.' });
    }

    const existing = await getUser(username);
    if (existing) {
      return fail(409, { error: 'That username is already taken.' });
    }

    const passwordHash = await hashPassword(password);
    await createUser(username, { name, passwordHash, phone });

    // Save profile config (used for future plan regeneration)
    const profile = {
      age, bodyWeight, bodyFat, trainingAge,
      equipment, goal, daysPerWeek, experience,
      focusMuscles, cardio, cardioType, cardioDuration,
      mobility, injuries, sessionDuration, freeformNotes
    };

    const startDate = new Date().toISOString().split('T')[0];
    await updateUserConfig(username, {
      startDate,
      weekOverride: null,
      ...profile
    });

    // Generate skeleton only — Day 1 is generated from the dashboard
    try {
      const skeleton = await generateSkeleton(profile);
      await saveSkeleton(username, skeleton);
    } catch (err) {
      console.error('Skeleton generation failed:', err);
      // Don't block onboarding — user can regenerate from dashboard
    }

    createSession(cookies, username);
    redirect(302, '/dashboard');
  }
};
