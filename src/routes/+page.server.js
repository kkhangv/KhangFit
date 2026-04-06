import { redirect, fail } from '@sveltejs/kit';
import { getUser } from '$lib/storage';
import { verifyPassword, createSession, getSession } from '$lib/auth';

export async function load({ cookies }) {
  const userId = getSession(cookies);
  if (userId) {
    redirect(302, '/dashboard');
  }
  return {};
}

export const actions = {
  default: async ({ cookies, request }) => {
    const data = await request.formData();
    const username = data.get('username')?.toString().trim().toLowerCase();
    const password = data.get('password')?.toString();

    if (!username || !password) {
      return fail(400, { error: 'Username and password are required.' });
    }

    const user = await getUser(username);
    if (!user) {
      return fail(401, { error: 'Invalid username or password.' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return fail(401, { error: 'Invalid username or password.' });
    }

    createSession(cookies, username);
    redirect(302, '/dashboard');
  }
};
