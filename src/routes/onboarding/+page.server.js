import { redirect, fail } from '@sveltejs/kit';
import { getUser, createUser, updateUserConfig, saveStats, setUserProgram } from '$lib/storage';
import { hashPassword, createSession } from '$lib/auth';
import { kv } from '$lib/kv';
import { getAllPrograms, seedPrograms } from '$lib/programData';

export async function load({ cookies }) {
  // Already logged in → skip onboarding
  const { getSession } = await import('$lib/auth');
  const userId = getSession(cookies);
  if (userId) {
    redirect(302, '/dashboard');
  }

  let programs = await getAllPrograms(kv);

  // Auto-seed programs if DB is empty (first-time setup)
  if (!programs || programs.length === 0) {
    try {
      await seedPrograms(kv);
      programs = await getAllPrograms(kv);
    } catch (e) {
      console.error('Auto-seed failed:', e);
      programs = [];
    }
  }

  return { programs: programs || [] };
}

export const actions = {
  default: async ({ cookies, request }) => {
    const data = await request.formData();

    // Step 1 fields
    const name = data.get('name')?.toString().trim();
    const username = data.get('username')?.toString().trim().toLowerCase();
    const password = data.get('password')?.toString();
    const confirmPassword = data.get('confirmPassword')?.toString();
    const phone = data.get('phone')?.toString().trim() || null;

    // Step 2 fields
    const bodyWeight = parseFloat(data.get('bodyWeight'));
    const bodyFat = data.get('bodyFat') ? parseFloat(data.get('bodyFat')) : null;
    const maxBench = parseFloat(data.get('maxBench'));
    const maxOHP = data.get('maxOHP') ? parseFloat(data.get('maxOHP')) : null;
    const notes = data.get('notes')?.toString().trim() || '';

    // Step 3 fields
    const startDate = data.get('startDate')?.toString();

    // Validation
    if (!name || !username || !password || !startDate || !phone) {
      return fail(400, { error: 'Please fill in all required fields.' });
    }

    if (password !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return fail(400, { error: 'Password must be at least 6 characters.' });
    }

    if (!username.match(/^[a-z0-9_]+$/)) {
      return fail(400, { error: 'Username can only contain letters, numbers, and underscores.' });
    }

    // Check username availability
    const existing = await getUser(username);
    if (existing) {
      return fail(409, { error: 'That username is already taken. Please choose another.' });
    }

    if (!maxBench || isNaN(maxBench)) {
      return fail(400, { error: 'Please enter your current max bench press.' });
    }

    const passwordHash = await hashPassword(password);

    // Create user
    await createUser(username, { name, passwordHash, phone });

    // Save selected program
    const programId = data.get('programId')?.toString() || 'chest-focus-4day';
    await setUserProgram(username, programId);

    // Save program config
    await updateUserConfig(username, {
      startDate,
      weekOverride: null,
      hasPeloton: false
    });

    // Save initial stats
    await saveStats(username, {
      bodyWeight: isNaN(bodyWeight) ? null : bodyWeight,
      bodyFat,
      maxBench,
      maxOHP,
      notes,
      date: new Date().toISOString().split('T')[0]
    });

    createSession(cookies, username);
    redirect(302, '/dashboard');
  }
};
