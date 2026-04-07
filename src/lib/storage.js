// Server-only module
// All data access functions for the workout tracker, backed by Upstash Redis.

import { kv } from './kv.js';

// ─── Key helpers ─────────────────────────────────────────────────────────────

const keys = {
  user: (username) => `user:${username}`,
  userConfig: (username) => `user:${username}:config`,
  plan: (username) => `plan:${username}`,
  statsLatest: (username) => `stats:${username}:latest`,
  statsDate: (username, date) => `stats:${username}:${date}`,
  workout: (username, date) => `workout:${username}:${date}`,
  history: (username) => `history:${username}`,
  weekProgress: (username, weekNum) => `progress:${username}:week:${weekNum}`
};

// ─── User functions ──────────────────────────────────────────────────────────

/**
 * Fetch a user profile by username.
 * @param {string} username
 * @returns {Promise<object | null>}
 */
export async function getUser(username) {
  return kv.get(keys.user(username));
}

/**
 * Create a new user and initialise their config record.
 * Throws if the username already exists.
 *
 * @param {string} username
 * @param {{ name: string, passwordHash: string }} options
 * @returns {Promise<object>} the created user object
 */
export async function createUser(username, { name, passwordHash, phone = null }) {
  const existing = await kv.get(keys.user(username));
  if (existing) {
    throw new Error(`User "${username}" already exists.`);
  }

  const user = { username, name, passwordHash, phone, createdAt: new Date().toISOString() };
  const config = { name, startDate: null, weekOverride: null };

  await Promise.all([
    kv.set(keys.user(username), JSON.stringify(user)),
    kv.set(keys.userConfig(username), JSON.stringify(config))
  ]);

  return user;
}

/**
 * Merge new fields into the user's config object.
 * @param {string} username
 * @param {{ startDate?: string, weekOverride?: number | null, name?: string }} config
 * @returns {Promise<object>} the updated config
 */
export async function updateUserConfig(username, config) {
  const raw = await kv.get(keys.userConfig(username));
  const existing = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {};
  const updated = { ...existing, ...config };
  await kv.set(keys.userConfig(username), JSON.stringify(updated));
  return updated;
}

/**
 * Fetch a user's config record.
 * @param {string} username
 * @returns {Promise<{ startDate: string | null, weekOverride: number | null, name: string } | null>}
 */
export async function getUserConfig(username) {
  const raw = await kv.get(keys.userConfig(username));
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

// ─── Plan functions ─────────────────────────────────────────────────────────

/**
 * Save an AI-generated workout plan for a user.
 * @param {string} username
 * @param {object} planData - The full plan JSON from Claude
 */
export async function savePlan(username, planData) {
  await kv.set(keys.plan(username), JSON.stringify(planData));
}

/**
 * Fetch the user's current workout plan, or null.
 * @param {string} username
 * @returns {Promise<object | null>}
 */
export async function getPlan(username) {
  const raw = await kv.get(keys.plan(username));
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

// ─── Stats functions ─────────────────────────────────────────────────────────

/**
 * Save body stats for a given date. Writes both the dated entry and the
 * "latest" pointer so getLatestStats() is O(1).
 *
 * @param {string} username
 * @param {{ date: string, weight: number, [key: string]: any }} stats
 */
export async function saveStats(username, stats) {
  const date = stats.date ?? new Date().toISOString().slice(0, 10);
  const payload = JSON.stringify({ ...stats, date });

  await Promise.all([
    kv.set(keys.statsDate(username, date), payload),
    kv.set(keys.statsLatest(username), payload)
  ]);
}

/**
 * Return the most-recent body stats entry, or null.
 * @param {string} username
 * @returns {Promise<object | null>}
 */
export async function getLatestStats(username) {
  const raw = await kv.get(keys.statsLatest(username));
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

/**
 * Return all stats entries for a user, sorted ascending by date.
 * @param {string} username
 * @returns {Promise<object[]>}
 */
export async function getStatsHistory(username) {
  const pattern = keys.statsDate(username, '*');
  const matchingKeys = await kv.keys(pattern);

  if (!matchingKeys || matchingKeys.length === 0) return [];

  const raws = await Promise.all(matchingKeys.map((k) => kv.get(k)));

  return raws
    .filter(Boolean)
    .map((r) => (typeof r === 'string' ? JSON.parse(r) : r))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

// ─── Workout log functions ───────────────────────────────────────────────────

/**
 * Persist a workout log for a specific date. Also appends the date to the
 * history index.
 *
 * @param {string} username
 * @param {string} date - YYYY-MM-DD
 * @param {object} workoutData
 */
export async function saveWorkout(username, date, workoutData) {
  const payload = JSON.stringify({ ...workoutData, date });
  await kv.set(keys.workout(username, date), payload);
  await addToHistory(username, date);
}

/**
 * Fetch a single workout log, or null if it doesn't exist.
 * @param {string} username
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<object | null>}
 */
export async function getWorkout(username, date) {
  const raw = await kv.get(keys.workout(username, date));
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

/**
 * Return the last 20 workout log objects from the history index,
 * most-recent first.
 * @param {string} username
 * @returns {Promise<object[]>}
 */
export async function getWorkoutHistory(username) {
  const historyRaw = await kv.get(keys.history(username));
  if (!historyRaw) return [];

  const dates = (typeof historyRaw === 'string' ? JSON.parse(historyRaw) : historyRaw);
  if (!Array.isArray(dates) || dates.length === 0) return [];

  // Most-recent 20
  const recent = dates.slice(-20).reverse();

  const logs = await Promise.all(recent.map((date) => getWorkout(username, date)));
  return logs.filter(Boolean);
}

/**
 * Add a date to the history index, deduplicating and capping at 60 entries.
 * @param {string} username
 * @param {string} date - YYYY-MM-DD
 */
export async function addToHistory(username, date) {
  const raw = await kv.get(keys.history(username));
  let dates = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];

  if (!Array.isArray(dates)) dates = [];

  // Remove duplicate, then append
  dates = dates.filter((d) => d !== date);
  dates.push(date);

  // Keep the most-recent 60 entries
  if (dates.length > 60) {
    dates = dates.slice(dates.length - 60);
  }

  await kv.set(keys.history(username), JSON.stringify(dates));
}

// ─── Progress functions ──────────────────────────────────────────────────────

/**
 * Save a weekly summary object for a specific week number.
 * @param {string} username
 * @param {number} weekNum
 * @param {object} data
 */
export async function saveWeeklyProgress(username, weekNum, data) {
  const payload = JSON.stringify({ ...data, weekNum });
  await kv.set(keys.weekProgress(username, weekNum), payload);
}

/**
 * Fetch the weekly summary for a specific week number, or null.
 * @param {string} username
 * @param {number} weekNum
 * @returns {Promise<object | null>}
 */
export async function getWeeklyProgress(username, weekNum) {
  const raw = await kv.get(keys.weekProgress(username, weekNum));
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

// ─── Program selection ──────────────────────────────────────────────────────

/**
 * Save the selected program for a user.
 * @param {string} username
 * @param {string} programId
 */
export async function setUserProgram(username, programId) {
  await kv.set(`user:${username}:program`, JSON.stringify({ programId, startedAt: new Date().toISOString() }));
}

/**
 * Fetch the user's selected program.
 * @param {string} username
 * @returns {Promise<{ programId: string, startedAt: string } | null>}
 */
export async function getUserProgram(username) {
  const data = await kv.get(`user:${username}:program`);
  if (!data) return null;
  return typeof data === 'string' ? JSON.parse(data) : data;
}

/**
 * Return the last 6 weekly progress objects for a user, ordered by week number
 * descending (most recent first). Skips weeks with no data.
 * @param {string} username
 * @returns {Promise<object[]>}
 */
export async function getLast6Weeks(username) {
  const pattern = keys.weekProgress(username, '*');
  const matchingKeys = await kv.keys(pattern);

  if (!matchingKeys || matchingKeys.length === 0) return [];

  const raws = await Promise.all(matchingKeys.map((k) => kv.get(k)));

  return raws
    .filter(Boolean)
    .map((r) => (typeof r === 'string' ? JSON.parse(r) : r))
    .sort((a, b) => (b.weekNum ?? 0) - (a.weekNum ?? 0))
    .slice(0, 6);
}
