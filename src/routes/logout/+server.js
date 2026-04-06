import { redirect } from '@sveltejs/kit';
import { destroySession } from '$lib/auth';

export async function POST({ cookies }) {
  destroySession(cookies);
  redirect(302, '/');
}
