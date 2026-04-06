// Server-only module

import bcrypt from 'bcryptjs';
import { redirect } from '@sveltejs/kit';

const BCRYPT_ROUNDS = 10;
const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/** @type {import('svelte/types').CookieSerializeOptions} */
const COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/',
  sameSite: 'lax',
  maxAge: SESSION_MAX_AGE
};

/**
 * Hash a plain-text password with bcrypt.
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a plain-text password against a bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Write a session cookie containing the userId.
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @param {string} userId
 */
export function createSession(cookies, userId) {
  cookies.set(SESSION_COOKIE, userId, COOKIE_OPTIONS);
}

/**
 * Read the session cookie and return the userId, or null if absent.
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @returns {string | null}
 */
export function getSession(cookies) {
  return cookies.get(SESSION_COOKIE) ?? null;
}

/**
 * Clear the session cookie, effectively logging the user out.
 * @param {import('@sveltejs/kit').Cookies} cookies
 */
export function destroySession(cookies) {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

/**
 * Require a valid session or redirect to '/'.
 * Returns the userId string when the session is present.
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @returns {string}
 */
export function requireAuth(cookies) {
  const userId = getSession(cookies);
  if (!userId) {
    throw redirect(302, '/');
  }
  return userId;
}
