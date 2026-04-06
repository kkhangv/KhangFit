import { json } from '@sveltejs/kit';
import { getSession } from '$lib/auth';
import { kv } from '$lib/kv';
import { seedPrograms } from '$lib/programData';
import {
  CARDIO_TYPES,
  CARDIO_SESSION_TEMPLATES,
  PELOTON_PROTOCOLS,
  WEEKLY_CARDIO_SCHEDULES,
  PRE_LIFT_CARDIO_RULES,
  POST_LIFT_CARDIO_RULES,
  REST_DAY_CARDIO,
  CARDIO_AUTO_REGULATION,
} from '$lib/cardioData';
import {
  RPE_TABLE,
  VOLUME_LANDMARKS,
  TRAINING_ZONES,
  PERIODIZATION_MODELS,
} from '$lib/intensityCalc';

export async function POST({ cookies }) {
  // Require auth
  const session = getSession(cookies);
  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const counts = {
    programs: 0,
    dayArrays: 0,
    exercises: 0,
    cardioTypes: 0,
    cardioTemplates: 0,
    pelotonProtocols: 0,
    cardioSchedules: 0,
    configKeys: 0,
  };

  try {
    // ── 1. Seed programs and exercises ──────────────────────────────────────
    const programResult = await seedPrograms(kv);
    counts.programs = programResult.programs;
    counts.dayArrays = programResult.dayArrays;
    counts.exercises = programResult.exercises;

    // ── 2. Seed cardio data ────────────────────────────────────────────────
    const cardioOps = [];

    // Cardio types
    cardioOps.push(kv.set('cardio:types', JSON.stringify(CARDIO_TYPES)));
    counts.cardioTypes = Object.keys(CARDIO_TYPES).length;

    // Cardio session templates
    cardioOps.push(kv.set('cardio:templates', JSON.stringify(CARDIO_SESSION_TEMPLATES)));
    counts.cardioTemplates = CARDIO_SESSION_TEMPLATES.length;

    // Peloton protocols
    cardioOps.push(kv.set('cardio:peloton', JSON.stringify(PELOTON_PROTOCOLS)));
    counts.pelotonProtocols = Object.keys(PELOTON_PROTOCOLS).length;

    // Weekly schedules
    cardioOps.push(kv.set('cardio:schedules', JSON.stringify(WEEKLY_CARDIO_SCHEDULES)));
    counts.cardioSchedules = Object.keys(WEEKLY_CARDIO_SCHEDULES).length;

    // Additional cardio config
    cardioOps.push(kv.set('cardio:pre_lift_rules', JSON.stringify(PRE_LIFT_CARDIO_RULES)));
    cardioOps.push(kv.set('cardio:post_lift_rules', JSON.stringify(POST_LIFT_CARDIO_RULES)));
    cardioOps.push(kv.set('cardio:rest_day', JSON.stringify(REST_DAY_CARDIO)));
    cardioOps.push(kv.set('cardio:auto_regulation', JSON.stringify(CARDIO_AUTO_REGULATION)));

    // ── 3. Seed intensity calc config ──────────────────────────────────────
    cardioOps.push(kv.set('config:rpe_table', JSON.stringify(RPE_TABLE)));
    cardioOps.push(kv.set('config:volume_landmarks', JSON.stringify(VOLUME_LANDMARKS)));
    cardioOps.push(kv.set('config:training_zones', JSON.stringify(TRAINING_ZONES)));
    cardioOps.push(kv.set('config:periodization_models', JSON.stringify(PERIODIZATION_MODELS)));
    counts.configKeys = 4;

    await Promise.all(cardioOps);

    return json({
      success: true,
      counts,
      message: `Seeded ${counts.programs} programs, ${counts.exercises} exercises, ${counts.cardioTypes} cardio types, ${counts.cardioTemplates} cardio templates, and ${counts.configKeys} config keys.`,
    });
  } catch (err) {
    console.error('Seed error:', err);
    return json(
      { error: 'Seed failed', details: err.message },
      { status: 500 }
    );
  }
}
