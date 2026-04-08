# KhangLift

**Adaptive AI Fitness Coach** — personalized training plans powered by Claude, backed by 200+ peer-reviewed studies in exercise science, hypertrophy, and periodization.

**Live:** https://khangfit.vercel.app

---

## Features

- **Adaptive AI plan generation** — Claude Sonnet 4.6 generates 5-week DUP (daily undulating periodization) mesocycles grounded in exercise science (MEV/MAV/MRV volume landmarks, RPE-based loading, deload protocols)
- **Progressive onboarding** — 4-step flow (account + phone → body stats → equipment/goals → generate) completing in ~10 seconds
- **Mobile-first workout UI** — full-screen fixed layout (no viewport scroll), single-set-at-a-time wizard with large touch targets, weight steppers, inline rest timer, and no iOS zoom on input focus
- **In-session auto-regulation** — RPE feedback after every set silently adjusts weight for the next set using deterministic math (no AI calls)
- **Readiness check** — pre-workout sleep/stress/soreness/energy check with scale labels; gates workout start until all 4 fields are filled
- **Cardio-aware** — exercises using peloton, treadmill, rower, etc. switch to duration tracking automatically
- **Workout history** — completed sessions feed back into plan regeneration for progressive overload recommendations
- **Day 1 summary** — after the calibration session, the dashboard shows performance breakdown before generating the full week
- **AI brevity** — all generated descriptions, cues, and tips are constrained to 1 sentence for fast, scannable reading

---

## Architecture

```
Onboarding (4 steps: Account+Phone → About You → Personalize → Generate)
  └─ generateSkeleton()        ~10s  → Redis: plan:{user}:skeleton
       │
       ▼
Dashboard STATE 1.5 (skeleton preview)
  └─ generateTestDay()         ~30s  → Redis: plan:{user}:week:1 (Day 1 only)
       │
       ▼
Workout Session (Day 1)
  └─ Readiness check (sleep/stress/soreness/energy)
  └─ RPE feedback → deterministic weight adjust (no AI)
  └─ saveWorkout()             → Redis: workout:{user}:{date}
       │
       ▼
Dashboard STATE 3 (Day 1 summary)
  └─ generateRemainingDays()   ~2m   → Redis: plan:{user}:week:1 (Days 2-N merged)
       │
       ▼
Full week view
  └─ generateWeek(weekN)       ~2m   → Redis: plan:{user}:week:N
  └─ generateDay() per shuffle ~30s  → Redis: plan:{user}:week:N (one day updated)
```

**AI boundary:** Claude is called only for plan generation. All in-session math (weight adjustments, RPE-to-load calculations, deload detection) is deterministic client-side code in `src/lib/`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit 5 (Svelte runes: `$state`, `$derived`, `$effect`) |
| AI | Claude Sonnet 4.6 via Anthropic API — structured outputs + prompt caching |
| Database | Upstash Redis (`@upstash/redis`) |
| Auth | bcrypt passwords + session cookies (7-day, httpOnly) |
| Icons | `lucide-svelte` (ChevronLeft, Clock, Zap, Info, Play, CheckCircle2, Sparkles) |
| Styling | Tailwind CSS 4 + inline styles, theme color `#84CC16` (lime/yellow-green) |
| Deployment | Vercel (auto-deploy from `main`) |
| Node | 20+ required (`nvm use 20`) |

---

## Getting Started

### Prerequisites

- Node 20 (`nvm use 20`)
- Vercel CLI (`npm i -g vercel`) — for pulling env vars
- An Anthropic API key
- An Upstash Redis database

### Installation

```bash
git clone https://github.com/kkhangv/KhangFit
cd KhangFit
nvm use 20
npm install
```

### Environment Variables

```bash
# Pull from Vercel (recommended)
vercel env pull .env.local

# Or create .env.local manually:
ANTHROPIC_API_KEY=sk-ant-...
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=...
```

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key from console.anthropic.com |
| `KV_REST_API_URL` | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | Upstash Redis REST token |

The Redis client also accepts `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` as fallback names.

### Local Development

```bash
npm run dev
# → http://localhost:5173
```

### Production Build

```bash
npm run build
npm run preview
```

---

## Deployment

The app is deployed to Vercel with the `@sveltejs/adapter-vercel` adapter.

**Auto-deploy:** every push to `main` triggers a Vercel deployment.

**Manual deploy:**
```bash
vercel --prod
```

**Vercel configuration notes:**
- The `/api/generate-plan` serverless function has `maxDuration: 60` to accommodate Claude API response times
- Upstash Redis is provisioned through the Vercel Marketplace integration (environment variables are auto-injected)

---

## Project Structure

```
src/
├── lib/
│   ├── ai.js                 # Claude API integration (all generation functions)
│   ├── storage.js            # Redis data access layer
│   ├── auth.js               # bcrypt + session cookie helpers
│   ├── kv.js                 # Upstash Redis client singleton
│   ├── intensityCalc.js      # RPE tables, volume landmarks, 1RM calculations
│   ├── rpeAdjust.js          # In-session weight adjustment + cardio detection
│   ├── weekCalc.js           # Program week/day scheduling utilities
│   ├── overload.js           # Progressive overload recommendations
│   └── components/
│       ├── GenerationProgress.svelte  # AI loading animation (progress bar + tips)
│       ├── RPEFeedback.svelte         # Post-set effort rating (plain English labels)
│       ├── RestTimer.svelte           # Countdown timer (inline or fixed-bottom pill)
│       ├── ProgressBar.svelte         # Session completion progress
│       ├── EquipmentPicker.svelte     # Equipment preset selector
│       ├── RPEGuide.svelte            # Collapsible RPE education panel
│       ├── DayCard.svelte             # Dashboard day card
│       ├── SessionSummary.svelte      # Post-workout summary display
│       └── ...
├── routes/
│   ├── +page.svelte                   # Login
│   ├── onboarding/                    # 4-step account + profile setup
│   ├── dashboard/                     # Week view, generation controls
│   ├── workout/[day]/                 # Interactive set wizard
│   ├── api/
│   │   ├── generate-plan/+server.js   # AI generation endpoint (6 modes)
│   │   └── test-ai/+server.js         # Dev-only smoke test (all AI modes)
│   └── logout/
```

---

## API Reference

### `POST /api/generate-plan`

All requests require an authenticated session cookie. Rate limited to **7 generations per user per day**.

| `mode` | Required fields | Description |
|---|---|---|
| `skeleton` | `profile` | Generate program structure (no exercises, ~10s) |
| `test-day` | `profile` | Generate Day 1 calibration exercises (~30s) |
| `remaining-days` | `profile` | Generate Days 2-N of Week 1 from Day 1 results (~2m) |
| `week` | `profile`, `weekNumber` | Generate a full week from workout history (~2m) |
| `day` | `profile`, `currentDay`, `weekNumber` | Shuffle one day's exercises (~30s) |
| `full` | `profile` | Legacy: generate entire 5-week plan at once |

---

## Mobile UX

The workout page is designed to feel like a native app on iOS/Android:

- **No viewport scroll** — workout container is `position: fixed; inset: 0` with internal scroll only
- **No zoom on input focus** — viewport sets `maximum-scale=1, user-scalable=no`; all inputs have `font-size: max(16px, 1em)` (iOS won't zoom inputs ≥ 16px)
- **Numeric keyboard** — number inputs use `inputmode="numeric"` or `inputmode="decimal"` + `pattern="[0-9]*"`
- **Touch-action** — `touch-action: manipulation` globally eliminates the 300ms tap delay

---

## Exercise Science

The AI prompt and in-session logic are grounded in peer-reviewed training research:

- **Volume landmarks** — MEV (minimum effective volume), MAV (maximum adaptive volume), MRV (maximum recoverable volume) per muscle group, sourced from Dr. Mike Israetel / Renaissance Periodization
- **DUP periodization** — daily undulating periodization cycles intensity and volume across sessions within the same week (e.g., strength day / hypertrophy day)
- **RPE-based loading** — Rate of Perceived Exertion 1-10 scale; in-session adjustments keep you within ±1 RPE of target without AI calls
- **Deload protocol** — Week 5 of every 5-week mesocycle drops to ~60% volume/intensity; `evaluateDeloadTriggers()` can recommend early deload based on session RPE drift, readiness scores, and completion rates
- **Progressive overload** — `overload.js` compares current vs. previous logs; recommends +5 lbs (barbell) or +2.5 lbs (dumbbell) when target RPE is consistently met

---

## Redis Data Model

All keys are namespaced by username:

| Key | Value | Description |
|---|---|---|
| `user:{username}` | JSON | Account info (name, passwordHash, phone, createdAt) |
| `user:{username}:config` | JSON | Training profile + preferences |
| `plan:{username}:skeleton` | JSON | Program structure (no exercises) |
| `plan:{username}:week:{N}` | JSON | Full week data with exercises |
| `workout:{username}:{date}` | JSON | Completed workout log |
| `history:{username}` | JSON array | Date index for last 60 workout dates |
| `ratelimit:generate:{username}:{date}` | number | Daily generation count (TTL 24h) |

---

## Testing AI Endpoints

A dev-only smoke test endpoint exercises all 6 AI generation modes with realistic mock data:

```bash
# Run all tests sequentially (~5 min, real Claude API calls)
curl "http://localhost:5173/api/test-ai"

# Run a single test (~30s)
curl "http://localhost:5173/api/test-ai?test=skeleton"
curl "http://localhost:5173/api/test-ai?test=testday"
curl "http://localhost:5173/api/test-ai?test=remaining"
curl "http://localhost:5173/api/test-ai?test=week"
curl "http://localhost:5173/api/test-ai?test=day"
```

Returns `{ allOk, totalMs, testsRun, results }`. Blocked with 403 in production.

---

## Contributing

1. Branch from `main`
2. Run `nvm use 20 && npm run dev` and verify locally
3. Hit `GET /api/test-ai` to smoke-test AI endpoints before PRing
4. Open a PR against `main` — Vercel preview deployments are created automatically
