# KhangFit v3 - AI-Powered Workout Tracker

## What This Is

A SvelteKit 5 workout tracker that uses Claude AI (Haiku 4.5) to generate personalized, research-grounded workout plans. Deployed on Vercel with Upstash Redis for persistence.

**Live:** https://khangfit.vercel.app

## Architecture

```
Onboarding (4 steps) --> Claude Haiku generates 5-week plan --> Redis stores plan
                                                                     |
Dashboard (week view) <---------------------------------------------+
     |
Workout Session --> RPE feedback --> client-side weight adjustment (no AI)
     |
Save workout log --> feeds back into next "Regenerate Plan" call
```

**AI boundary:** Claude is ONLY called for plan generation/regeneration. All in-session math (weight adjustments, RPE calculations, deload detection) is deterministic client-side code.

## Tech Stack

- **Framework:** SvelteKit 5 (Svelte runes: `$state`, `$derived`, `$effect`)
- **AI:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) via direct API with structured outputs + prompt caching
- **Database:** Upstash Redis via `@upstash/redis`
- **Auth:** bcrypt + session cookies
- **Styling:** Tailwind CSS 4 + inline styles for dark theme
- **Deploy:** Vercel (auto-deploy from `main`)
- **Node:** Requires Node 20 (`nvm use 20`)

## Key Files

### AI Layer
- `src/lib/ai.js` - Claude API integration: system prompt (4096+ tokens for caching), JSON schemas, `generatePlan()`, `generateDay()`, `validatePlan()`
- `src/routes/api/generate-plan/+server.js` - API endpoint with two modes: `full` (5-week plan) and `day` (single day). Rate limited to 5/day per user.

### Exercise Science
- `src/lib/intensityCalc.js` - RPE tables, volume landmarks (MEV/MAV/MRV), 1RM calc, working weight calculator
- `src/lib/rpeAdjust.js` - Deterministic in-session weight adjustment from RPE feedback
- `src/lib/weekCalc.js` - 5-week mesocycle with deload week 5
- `src/lib/overload.js` - Progressive overload recommendations from history

### Components
- `src/lib/components/RPEFeedback.svelte` - Post-set RPE buttons (Too Easy / Just Right / Hard / Maxed Out)
- `src/lib/components/RPEGuide.svelte` - Collapsible RPE education panel
- `src/lib/components/EquipmentPicker.svelte` - Equipment presets (Full Gym / Home Dumbbells / Bodyweight / Custom)
- `src/lib/components/RestTimer.svelte` - Rest timer between sets
- `src/lib/components/ProgressBar.svelte` - Session progress indicator

### Routes
- `/` - Login
- `/onboarding` - 4-step flow: Account > About You > Personalize > Generate
- `/dashboard` - Week view with day cards, regenerate buttons
- `/workout/[day]` - Interactive workout session with RPE feedback
- `/api/generate-plan` - Claude API endpoint
- `/logout` - Session cleanup

### Data
- `src/lib/storage.js` - Redis data access: users, plans, workouts, stats
- `src/lib/auth.js` - Auth helpers (bcrypt, sessions, cookies)
- `src/lib/kv.js` - Upstash Redis client

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...     # Claude API key
KV_REST_API_URL=...              # Upstash Redis URL
KV_REST_API_TOKEN=...            # Upstash Redis token
```

Pull from Vercel: `vercel env pull .env.local`

## Local Dev

```bash
nvm use 20
npm install
vercel env pull .env.local
npm run dev
```

## Claude API Usage

- **Model:** `claude-haiku-4-5-20251001`
- **Structured outputs:** `output_config.format` with `type: 'json_schema'`
- **Prompt caching:** System prompt is 4096+ tokens with `cache_control: { type: 'ephemeral' }`
- **Cost:** ~$0.002-0.005 per plan generation

### Structured Output Schema Rules

The Claude API requires strict schema compliance for structured outputs:
- Every `object` type MUST have `additionalProperties: false`
- All properties MUST be listed in `required` (no optional fields with `additionalProperties: false`)
- Nullable fields use `anyOf: [{ type: 'string' }, { type: 'null' }]`, NOT `type: ['string', 'null']`
- The format key is `schema` directly under `format`, NOT wrapped in `json_schema`

```js
// CORRECT
output_config: {
  format: {
    type: 'json_schema',
    schema: { ... }         // schema directly here
  }
}

// WRONG - do NOT use
output_config: {
  format: {
    type: 'json_schema',
    json_schema: { name: '...', schema: { ... } }  // OpenAI format, not Anthropic
  }
}
```

## What Was Done (v3 Rewrite)

### Completed
- Replaced ~5000 lines of hardcoded workout data (`programData.js`, `workoutData.js`, `cardioData.js`) with a single Claude API call
- Built 4-step onboarding: account creation, body stats + training history, personalization (equipment/goals/cardio/PT/injuries), plan generation with loading animation
- Claude generates 5-week DUP mesocycle grounded in exercise science research (volume landmarks, periodization, deload protocols)
- Dashboard shows AI-generated day cards with per-day shuffle and full regenerate
- Workout session with set tracking, RPE feedback, and deterministic weight adjustments
- `requireAuth` fix in `generate-plan` endpoint (was destructuring a string)
- `output_config.format` fix (removed wrong `json_schema` wrapper key)

### NOT Yet Done (Blocking - Must Fix Before App Works End-to-End)

1. **Schema `additionalProperties` error** - `src/lib/ai.js` schemas (`EXERCISE_SCHEMA`, `DAY_SCHEMA`, `WEEK_SCHEMA`) are missing `additionalProperties: false`. The Claude structured outputs API rejects the request with HTTP 400. Fix: add `additionalProperties: false` to all three nested object schemas, convert `type: ['string', 'null']` fields to `anyOf` format, and add all properties to `required` arrays.

2. **End-to-end testing** - Once the schema fix is applied, the full onboarding > dashboard > workout flow needs to be tested with a real Claude API call to verify the generated plan structure works with the dashboard and workout pages.

### Nice-to-Have (Not Blocking)
- a11y warnings on onboarding labels (cosmetic, not functional)
- Old data files still referenced in some imports (should be dead code after the rewrite)
- Workout history aggregation (`buildHistorySummary`) for the regeneration feedback loop hasn't been tested with real data
