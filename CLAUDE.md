# KhangFit — AI Workout Tracker

## Overview

SvelteKit 5 app that uses Claude to generate personalized, research-grounded workout plans. Deployed on Vercel with Upstash Redis.

**Live:** https://khangfit.vercel.app

---

## Architecture

```
Onboarding → generateSkeleton() → Redis
                                     │
Dashboard (skeleton preview)         │
  → generateTestDay()      ──────────┘ (saves Week 1 Day 1)
       │
Workout (Day 1)
  → RPE feedback → deterministic weight adjust (NO AI)
  → saveWorkout() → Redis
       │
Dashboard (Day 1 summary)
  → generateRemainingDays() → merges into Week 1
  → generateWeek(N)         → full subsequent weeks
  → generateDay()           → per-day shuffle
```

**AI boundary:** Claude is ONLY called for plan generation. All in-session math is deterministic: `rpeAdjust.js`, `intensityCalc.js`, `overload.js`.

---

## Tech Stack

- **Framework:** SvelteKit 5 — Svelte runes only (`$state`, `$derived`, `$effect`, `$props`)
- **AI:** Claude Sonnet 4.6 (`claude-sonnet-4-6`) — structured outputs + prompt caching
- **Database:** Upstash Redis via `@upstash/redis`
- **Auth:** bcrypt + httpOnly session cookies (7-day)
- **Styling:** Tailwind CSS 4 + inline styles for dark theme
- **Deploy:** Vercel with `@sveltejs/adapter-vercel`
- **Node:** 20+ required

---

## Key Files

### AI Layer
- `src/lib/ai.js` — all Claude API calls: `generateSkeleton`, `generateTestDay`, `generateRemainingDays`, `generateWeek`, `generateDay`, `generatePlan` (legacy). Also exports `buildHistorySummary`, `summarizeDay1Results`, `validatePlan`.
- `src/routes/api/generate-plan/+server.js` — POST endpoint routing all 6 modes. Rate limited 7/day per user. `maxDuration: 60` for Vercel.
- `src/routes/api/test-ai/+server.js` — **dev-only** smoke test: `GET /api/test-ai?test=all|skeleton|testday|remaining|week|day`

### Exercise Science (all deterministic, no AI)
- `src/lib/intensityCalc.js` — RPE tables, volume landmarks (MEV/MAV/MRV), 1RM calc, `evaluateDeloadTriggers`
- `src/lib/rpeAdjust.js` — in-session weight adjustment from RPE, `getExerciseInputType` (cardio detection)
- `src/lib/weekCalc.js` — program week/day scheduling (Monday-anchored, deload week 5)
- `src/lib/overload.js` — progressive overload recommendations from history

### Components
- `src/lib/components/GenerationProgress.svelte` — animated progress bar for all AI generation states (0→95% fake progress, time estimate, rotating tips, error state)
- `src/lib/components/RPEFeedback.svelte` — post-set effort buttons in plain English ("Could do 3 more" / "Nothing left")
- `src/lib/components/RestTimer.svelte` — countdown timer; `inline` prop for in-page rendering vs. fixed-bottom pill
- `src/lib/components/ProgressBar.svelte` — session completion progress
- `src/lib/components/EquipmentPicker.svelte` — equipment preset selector

### Routes
- `/` — Login
- `/onboarding` — 4 steps: Account → About You → Personalize → Generate (skeleton only, ~10s)
- `/dashboard` — progressive states: no-plan → skeleton-preview → day1-pending → day1-summary → full-week
- `/workout/[day]` — set wizard with phase state machine: `input → rpe → rest → exercise-feedback`
- `/logout` — session cleanup

### Data
- `src/lib/storage.js` — all Redis access: users, plans, workout logs, stats, history
- `src/lib/auth.js` — `requireAuth`, `createSession`, `hashPassword`, `verifyPassword`
- `src/lib/kv.js` — Upstash Redis singleton

---

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=...
```

Pull from Vercel: `vercel env pull .env.local`

Fallback names accepted: `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`

---

## Local Dev

```bash
nvm use 20
npm install
vercel env pull .env.local
npm run dev
```

---

## Claude API — Rules & Patterns

### Model
`claude-sonnet-4-6` — structured outputs with prompt caching.

### Structured Output Schema Rules (critical)
```js
// CORRECT — Anthropic format
output_config: {
  format: {
    type: 'json_schema',
    schema: { ... }   // schema directly here
  }
}

// WRONG — OpenAI format, rejected by Anthropic
output_config: {
  format: {
    type: 'json_schema',
    json_schema: { name: '...', schema: { ... } }
  }
}
```

- Every `object` MUST have `additionalProperties: false`
- All properties MUST be in `required[]` (no optional fields when `additionalProperties: false`)
- Nullable fields: `anyOf: [{ type: 'string' }, { type: 'null' }]` — NOT `type: ['string', 'null']`

### JSON Safety (in `callClaude`)
```js
if (result.stop_reason === 'max_tokens') throw new Error('AI response was too long...');
if (result.stop_reason === 'refusal') throw new Error('AI could not generate...');
const textBlock = result.content?.find(b => b.type === 'text');
try {
  return JSON.parse(textBlock.text);
} catch (parseErr) {
  console.error('[callClaude] JSON parse failed:', parseErr.message, 'stop_reason:', result.stop_reason);
  throw new Error('AI returned invalid data. Please try again.');
}
```

### Token Budgets
- `remaining-days` mode: 8192 tokens (3-4 full days)
- `week` mode: 8192 tokens (4-5 full days)
- Other modes: 4096 tokens

### Prompt Caching
System prompt is 4096+ tokens with `cache_control: { type: 'ephemeral' }` — saves ~70% on repeated calls.

### Cost
~$0.002–0.005 per generation call.

---

## Svelte 5 Runes Patterns

### Reactive state initialized from props
```svelte
<script>
  let { data } = $props();
  let { dayData } = $derived(data);

  // Snapshot at mount — intentionally non-reactive:
  // svelte-ignore state_referenced_locally
  const initExercises = dayData?.exercises ?? [];

  // For reactive constants derived from props, use $derived not const:
  const RADIUS = $derived(inline ? 50 : 36);
</script>
```

### Error handling on async operations
Every fetch that touches the AI API uses `fetchWithTimeout` (60s AbortController):
```js
async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 60000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}
```

---

## Workout Page State Machine

```
wizardPhase: 'input' → 'rpe' → 'rest' → 'exercise-feedback' → (next set or next exercise)
```

- **input** — weight stepper (-5/-2.5/+2.5/+5), reps stepper (±1), "Done" button
- **rpe** — plain English effort buttons; weight adjustment applied silently to next set
- **rest** — `<RestTimer inline>` as main card content; skip button; auto-advances
- **exercise-feedback** — after last set: Easy / Good / Hard / Pain

Cardio exercises (detected by `getExerciseInputType`): skip weight/reps input → show duration field + "Complete"; skip rest timer.

---

## Dashboard States

| State | Condition | User action |
|---|---|---|
| No plan | `!hasPlan` | Start onboarding |
| Skeleton preview | `skeletonOnly` | "Generate Day 1" button |
| Day 1 pending | `day1Only && !day1Complete` | Link to workout |
| Day 1 summary | `day1Only && day1Complete` | "Generate remaining days" |
| Full week | `currentWeekDays.length > 0` | Day cards, shuffle, regenerate |

All generation buttons: `fetchWithTimeout` + inline `genError` banner — no `alert()`, no stuck spinners.

---

## Redis Key Schema

```
user:{username}                    # account info
config:{username}                  # training profile
plan:{username}:skeleton           # program structure (no exercises)
plan:{username}:week:{N}           # week data with exercises
workout:{username}:{date}          # completed session log
history:{username}                 # date index (last 60 entries)
ratelimit:generate:{username}:{date}  # daily AI call count (TTL 24h)
```

---

## Workout Log Format

What `saveWorkout()` persists and what `buildHistorySummary` / `summarizeDay1Results` expect:

```js
{
  dayNumber: number,
  weekNumber: number,
  date: 'YYYY-MM-DD',
  startedAt: ISO8601,
  completedAt: ISO8601,
  readiness: { sleep: 1-5, stress: 1-5, soreness: 1-5, energy: 1-5 },
  exercises: [{
    name: string,
    muscleGroup: string,
    feedback: 'good' | 'easy' | 'hard' | 'pain',
    prescribed: { sets, reps, rpe },
    actual: [{ weight, reps, rpe, completed: boolean }]
  }]
}
```

Note: sets use `actual[]` (NOT `sets[]`), and each set needs `completed: true` for volume counting.
