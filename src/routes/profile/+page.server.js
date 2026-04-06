import { redirect, fail } from '@sveltejs/kit';
import { requireAuth } from '$lib/auth';
import { destroySession } from '$lib/auth';
import { getUser, getUserConfig, updateUserConfig, getLatestStats, getStatsHistory, saveStats } from '$lib/storage';

export async function load({ cookies }) {
  const username = requireAuth(cookies);

  const [user, config, latestStats, statsHistory] = await Promise.all([
    getUser(username),
    getUserConfig(username),
    getLatestStats(username),
    getStatsHistory(username)
  ]);

  return {
    username,
    name: user?.name || username,
    createdAt: user?.createdAt || null,
    config: config || {},
    latestStats: latestStats || null,
    statsHistory: statsHistory || []
  };
}

export const actions = {
  updateStats: async ({ cookies, request }) => {
    const username = requireAuth(cookies);
    const data = await request.formData();

    const bodyWeight = data.get('bodyWeight') ? parseFloat(data.get('bodyWeight')) : null;
    const bodyFat    = data.get('bodyFat')    ? parseFloat(data.get('bodyFat'))    : null;
    const maxBench   = data.get('maxBench')   ? parseFloat(data.get('maxBench'))   : null;
    const maxOHP     = data.get('maxOHP')     ? parseFloat(data.get('maxOHP'))     : null;
    const notes      = data.get('notes')?.toString().trim() || '';

    await saveStats(username, {
      bodyWeight,
      bodyFat,
      maxBench,
      maxOHP,
      notes,
      date: new Date().toISOString().split('T')[0]
    });

    return { success: true, action: 'updateStats' };
  },

  updateConfig: async ({ cookies, request }) => {
    const username = requireAuth(cookies);
    const data = await request.formData();

    const startDate    = data.get('startDate')?.toString() || null;
    const weekOverride = data.get('weekOverride') ? parseInt(data.get('weekOverride')) : null;
    const hasPeloton   = data.get('hasPeloton') === 'on';

    await updateUserConfig(username, {
      ...(startDate    !== null ? { startDate }    : {}),
      ...(weekOverride !== null ? { weekOverride }  : { weekOverride: null }),
      hasPeloton
    });

    return { success: true, action: 'updateConfig' };
  },

  logout: async ({ cookies }) => {
    destroySession(cookies);
    redirect(302, '/');
  }
};
