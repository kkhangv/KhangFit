import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/auth';
import { saveWorkout, addToHistory } from '$lib/storage';

export async function POST({ request, cookies, params }) {
  const username = requireAuth(cookies);
  const { workoutData } = await request.json();

  const today = new Date().toISOString().split('T')[0];
  const dayNum = parseInt(params.day);

  await saveWorkout(username, today, { ...workoutData, day: dayNum, date: today });
  await addToHistory(username, { date: today, day: dayNum });

  return json({ success: true });
}
