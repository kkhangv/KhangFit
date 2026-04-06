import { getSession } from '$lib/auth';
import { redirect } from '@sveltejs/kit';

const PUBLIC_ROUTES = ['/', '/onboarding'];

export async function load({ cookies, url }) {
  const userId = getSession(cookies);

  const isPublic = PUBLIC_ROUTES.includes(url.pathname);

  if (!userId) {
    if (!isPublic) {
      redirect(302, '/');
    }
    return { user: null };
  }

  // Already logged in and hitting login page → send to dashboard
  if (userId && url.pathname === '/') {
    redirect(302, '/dashboard');
  }

  return { user: { username: userId } };
}
