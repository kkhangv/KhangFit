<script>
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import GenerationProgress from '$lib/components/GenerationProgress.svelte';
  import { EXERCISE_TYPE_CONFIG, getExerciseInputType } from '$lib/rpeAdjust.js';
  import { Sparkles, ChevronLeft } from 'lucide-svelte';

  let { data } = $props();
  let {
    name, weekInfo, currentWeekDays, dayStatuses, sessionsCompleted,
    config, hasPlan, skeleton, weekGenerated, skeletonOnly, day1Only, day1Complete,
    day1Summary, weekOverview, deloadRecommended, deloadReasons
  } = $derived(data);

  let regenerating = $state(false);
  let generatingDay1 = $state(false);
  let generatingRemaining = $state(false);
  let generatingWeek = $state(false);
  let shufflingDay = $state(null);
  let genError = $state('');

  // Regenerate modal state
  let showRegenModal = $state(false);
  let regenReason = $state('');
  let regenTarget = $state(null); // null = full program, day object = shuffle

  function getTypeSummary(exercises) {
    if (!exercises?.length) return [];
    const counts = {};
    for (const ex of exercises) {
      const t = ex.exerciseType || getExerciseInputType(ex).type;
      counts[t] = (counts[t] || 0) + 1;
    }
    return Object.entries(counts).map(([type, count]) => ({
      type, count, ...EXERCISE_TYPE_CONFIG[type]
    }));
  }

  const dayColors = {
    today:    { bg: 'rgba(132,204,22,0.12)', border: '#84CC16',  label: 'TODAY',    labelColor: '#84CC16'  },
    done:     { bg: 'rgba(34,197,94,0.08)',  border: '#22C55E',  label: 'DONE',     labelColor: '#22C55E'  },
    missed:   { bg: 'rgba(249,115,22,0.08)', border: '#F97316',  label: 'MISSED',   labelColor: '#F97316'  },
    upcoming: { bg: 'transparent',           border: '#2A2A2E',  label: 'UPCOMING', labelColor: '#9B9BA4'  }
  };

  function getProfile() {
    return {
      equipment: config.equipment,
      goal: config.goal,
      daysPerWeek: config.daysPerWeek,
      experience: config.experience,
      focusMuscles: config.focusMuscles,
      cardio: config.cardio,
      cardioType: config.cardioType,
      cardioDuration: config.cardioDuration,
      mobility: config.mobility,
      injuries: config.injuries,
      sessionDuration: config.sessionDuration,
      freeformNotes: config.freeformNotes,
      age: config.age,
      bodyWeight: config.bodyWeight,
      bodyFat: config.bodyFat,
      trainingAge: config.trainingAge
    };
  }

  async function fetchWithTimeout(url, options, timeoutMs = 60000) {
    genError = '';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        genError = err.message || 'Generation failed. Please try again.';
        return null;
      }
      return res;
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') genError = 'Generation timed out. Please try again.';
      else genError = `Something went wrong: ${e.message}`;
      return null;
    }
  }

  function openRegenModal(target = null) {
    regenTarget = target;
    regenReason = '';
    showRegenModal = true;
  }

  async function confirmRegen() {
    showRegenModal = false;
    const reason = regenReason.trim() || null;

    if (regenTarget) {
      // Shuffle specific day
      await shuffleDay(regenTarget, reason);
    } else {
      // Full program regenerate
      await regenerateProgram(reason);
    }
  }

  async function regenerateProgram(reason = null) {
    regenerating = true;
    genError = '';
    try {
      let res = await fetchWithTimeout('/api/generate-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'skeleton', profile: getProfile(), reason })
      });
      if (!res) return;

      res = await fetchWithTimeout('/api/generate-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'test-day', profile: getProfile() })
      });
      if (res) await invalidateAll();
    } finally {
      regenerating = false;
    }
  }

  async function generateDay1() {
    generatingDay1 = true;
    genError = '';
    try {
      const res = await fetchWithTimeout('/api/generate-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'test-day', profile: getProfile() })
      });
      if (res) await invalidateAll();
    } finally {
      generatingDay1 = false;
    }
  }

  async function generateRemainingDays() {
    generatingRemaining = true;
    genError = '';
    try {
      const res = await fetchWithTimeout('/api/generate-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'remaining-days', profile: getProfile() })
      });
      if (res) await invalidateAll();
    } finally {
      generatingRemaining = false;
    }
  }

  async function generateCurrentWeek() {
    generatingWeek = true;
    genError = '';
    try {
      const res = await fetchWithTimeout('/api/generate-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'week', profile: getProfile(), weekNumber: weekInfo.weekNumber })
      });
      if (res) await invalidateAll();
    } finally {
      generatingWeek = false;
    }
  }

  async function shuffleDay(day, reason = null) {
    shufflingDay = day.dayNumber;
    genError = '';
    try {
      const res = await fetchWithTimeout('/api/generate-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'day',
          weekNumber: weekInfo.weekNumber,
          profile: { equipment: config.equipment, goal: config.goal, experience: config.experience, injuries: config.injuries },
          currentDay: day,
          reason
        })
      });
      if (res) await invalidateAll();
    } finally {
      shufflingDay = null;
    }
  }
</script>

<svelte:head>
  <title>KhangLift — Dashboard</title>
</svelte:head>

<div class="px-4 py-6 pb-24" style="max-width: 600px; margin: 0 auto;">

  <!-- Header -->
  <div class="flex items-start justify-between mb-6">
    <div>
      <h1 class="text-2xl font-black" style="color: #F1F1F3;">Hey {name}!</h1>
      <p class="text-base mt-0.5" style="color: #9B9BA4;">
        {weekInfo?.isDeload ? 'Deload week — recover hard.' : 'Time to make progress.'}
      </p>
    </div>
    <form method="POST" action="/logout">
      <button class="text-xs font-medium px-3 py-1.5 rounded-lg" style="color: #6B6B75; background: #1E1E22;">
        Log out
      </button>
    </form>
  </div>

  <!-- Week info -->
  <div class="flex items-center justify-between mb-6 px-4 py-3 rounded-xl" style="background: #161618; border: 1px solid #2A2A2E;">
    <div>
      <span class="text-xs font-semibold uppercase tracking-wider" style="color: {weekInfo?.isDeload ? '#F97316' : '#84CC16'};">
        Week {weekInfo?.weekNumber || 1} — {weekOverview?.theme || skeleton?.weekOverviews?.[0]?.theme || 'Training'}
      </span>
      <p class="text-xs mt-0.5" style="color: #6B6B75;">
        {sessionsCompleted} of {currentWeekDays.length || config?.daysPerWeek || '?'} sessions completed
      </p>
    </div>
    {#if skeleton?.programName}
      <span class="text-xs font-medium px-2 py-1 rounded-lg" style="background: #2A2A2E; color: #9B9BA4;">
        {skeleton.programName}
      </span>
    {/if}
  </div>

  <!-- Error banner -->
  {#if genError}
    <div class="mb-4 rounded-xl px-4 py-3 flex items-start gap-3" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);">
      <p class="text-base flex-1" style="color: #F87171;">{genError}</p>
      <button onclick={() => genError = ''} class="text-xs font-medium shrink-0" style="color: #F87171;">Dismiss</button>
    </div>
  {/if}

  <!-- STATE 1: No plan at all -->
  {#if !hasPlan}
    <div class="rounded-2xl p-8 text-center mb-6" style="background: #161618; border: 1px solid #2A2A2E;">
      <p class="text-lg font-bold mb-2" style="color: #F1F1F3;">No workout plan yet</p>
      <p class="text-base mb-4" style="color: #9B9BA4;">Generate a personalized program with AI.</p>
      {#if regenerating}
        <GenerationProgress estimatedSeconds={12} label="Designing your program..." error={genError} onRetry={regenerateProgram} />
      {:else}
        <button
          onclick={regenerateProgram}
          class="px-6 py-3 rounded-xl text-base font-bold flex items-center justify-center gap-2"
          style="background: #84CC16; color: white;">
          <Sparkles size={16} /> Generate Program
        </button>
      {/if}
    </div>

  <!-- STATE 1.5: Skeleton exists, no days generated yet — MAGIC MOMENT -->
  {:else if skeletonOnly}
    <div class="rounded-2xl overflow-hidden mb-4" style="background: linear-gradient(145deg, rgba(132,204,22,0.12), rgba(147,51,234,0.10), rgba(6,182,212,0.06)); border: 1px solid #84CC16; box-shadow: 0 0 40px rgba(132,204,22,0.08);">
      <div class="px-5 pt-6 pb-5">
        <p class="text-xs font-bold uppercase tracking-widest mb-3" style="color: #84CC16;">Built for {name}</p>
        <h2 class="text-xl font-black mb-1" style="color: #F1F1F3;">{skeleton?.programName}</h2>
        <p class="text-sm mb-4" style="color: #9B9BA4;">{skeleton?.programDescription}</p>

        <!-- Value prop chips -->
        <div class="flex flex-wrap gap-2 mb-5">
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full" style="background: rgba(132,204,22,0.12); color: #84CC16; border: 1px solid rgba(132,204,22,0.25);">Adapts to your effort</span>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full" style="background: rgba(132,204,22,0.12); color: #84CC16; border: 1px solid rgba(132,204,22,0.25);">Auto-adjusts weights</span>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full" style="background: rgba(147,51,234,0.12); color: #A855F7; border: 1px solid rgba(147,51,234,0.25);">{config?.daysPerWeek || 4}x/week</span>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full" style="background: rgba(147,51,234,0.12); color: #A855F7; border: 1px solid rgba(147,51,234,0.25);">{config?.goal || 'Build Muscle'}</span>
        </div>

        <!-- Week 1 timeline -->
        {#if skeleton?.weekOverviews?.[0]?.days?.length}
          <div class="flex flex-col gap-2 mb-5">
            {#each skeleton.weekOverviews[0].days as day, i}
              <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl" style="background: rgba(0,0,0,0.25); {i === 0 ? 'border: 1px solid rgba(132,204,22,0.3);' : ''}">
                <span class="text-xs font-black w-5 text-center" style="color: {i === 0 ? '#84CC16' : '#4B4B55'};">{day.dayNumber}</span>
                <div class="flex-1">
                  <span class="text-sm font-semibold" style="color: #F1F1F3;">{day.name}</span>
                  <span class="text-xs ml-2" style="color: #6B6B75;">{day.focus}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if generatingDay1}
          <GenerationProgress estimatedSeconds={18} label="Crafting your calibration workout..." error={genError} onRetry={generateDay1} />
        {:else}
          <p class="text-sm mb-4 text-center" style="color: #9B9BA4;">Day 1 calibrates your entire program.</p>
          <button
            onclick={generateDay1}
            class="w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 active:scale-95"
            style="background: #84CC16; color: white; box-shadow: 0 4px 20px rgba(132,204,22,0.3);">
            <Sparkles size={18} /> Generate Day 1
          </button>
        {/if}
      </div>
    </div>

  <!-- STATE 2: Day 1 only, not yet completed — PERSONALIZED CARD -->
  {:else if day1Only && !day1Complete}
    <div class="rounded-2xl overflow-hidden mb-4" style="background: linear-gradient(145deg, rgba(132,204,22,0.10), rgba(147,51,234,0.06)); border: 1px solid #84CC16; box-shadow: 0 0 30px rgba(132,204,22,0.1);">
      <div class="px-5 pt-5 pb-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs font-bold px-2.5 py-0.5 rounded-full" style="background: rgba(132,204,22,0.2); color: #84CC16;">CALIBRATION</span>
          <span class="text-xs" style="color: #6B6B75;">Your first workout</span>
        </div>
        <p class="text-base font-bold mb-2" style="color: #F1F1F3;">Your program starts here</p>
        <div class="flex items-center gap-4 text-xs mb-3" style="color: #9B9BA4;">
          <span>Train</span>
          <span style="color: #4B4B55;">→</span>
          <span>Rate each set</span>
          <span style="color: #4B4B55;">→</span>
          <span style="color: #84CC16; font-weight: 600;">We adapt everything</span>
        </div>
      </div>
    </div>

    {#each currentWeekDays as day, idx}
      {@const dayNum = day.dayNumber || (idx + 1)}
      {@const status = dayStatuses[dayNum] || 'today'}
      {@const colors = dayColors[status]}

      <div class="rounded-2xl overflow-hidden mb-3" style="background: #161618; border: 1px solid {colors.border}; box-shadow: 0 0 24px rgba(132,204,22,0.15);">
        <button onclick={() => goto(`/workout/${dayNum}`)} class="w-full text-left px-5 pt-5 pb-4 flex flex-col gap-1">
          <span class="text-xs font-bold uppercase tracking-wider" style="color: #84CC16;">Day {dayNum} — Calibration</span>
          <span class="text-lg font-black" style="color: #F1F1F3;">{day.name}</span>
          <span class="text-sm" style="color: #9B9BA4;">{day.focus}</span>
          <div class="flex items-center gap-4 mt-2">
            <span class="text-sm font-medium" style="color: #6B6B75;">{day.exercises?.length || 0} exercises</span>
            {#if day.targetDuration}
              <span class="text-sm font-medium" style="color: #6B6B75;">~{day.targetDuration} min</span>
            {/if}
          </div>
          <div class="mt-3 py-2.5 rounded-xl text-center text-base font-bold" style="background: #84CC16; color: white;">
            Start Workout
          </div>
        </button>
      </div>
    {/each}

  <!-- STATE 3: Day 1 done, rest of week not generated -->
  {:else if day1Only && day1Complete}
    <div class="rounded-2xl p-5 mb-4" style="background: #161618; border: 1px solid #22C55E;">
      <p class="text-xs font-bold uppercase tracking-wider mb-2" style="color: #22C55E;">Day 1 Complete</p>

      <!-- Day 1 performance summary -->
      {#if day1Summary}
        <div class="mb-4">
          <div class="flex items-center gap-4 mb-3">
            {#if day1Summary.totalSets}
              <div>
                <p class="text-lg font-black" style="color: #F1F1F3;">{day1Summary.totalSets}</p>
                <p class="text-xs" style="color: #6B6B75;">sets done</p>
              </div>
            {/if}
            {#if day1Summary.overallAvgRPE}
              <div>
                <p class="text-lg font-black" style="color: #F1F1F3;">{day1Summary.overallAvgRPE}</p>
                <p class="text-xs" style="color: #6B6B75;">avg effort</p>
              </div>
            {/if}
            {#if day1Summary.durationMin}
              <div>
                <p class="text-lg font-black" style="color: #F1F1F3;">{day1Summary.durationMin}m</p>
                <p class="text-xs" style="color: #6B6B75;">duration</p>
              </div>
            {/if}
          </div>

          <!-- Exercise breakdown -->
          <div class="flex flex-col gap-1.5">
            {#each day1Summary.exercises as ex}
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" style="background: #0A0A0B;">
                <span class="text-xs font-medium flex-1" style="color: #F1F1F3;">{ex.name}</span>
                {#if ex.bestWeight > 0}
                  <span class="text-xs" style="color: #6B6B75;">{ex.bestWeight}lbs x{ex.bestReps}</span>
                {/if}
                {#if ex.feedback === 'pain'}
                  <span class="text-xs font-bold" style="color: #EF4444;">Pain</span>
                {:else if ex.feedback === 'too_hard'}
                  <span class="text-xs" style="color: #F97316;">Hard</span>
                {/if}
              </div>
            {/each}
          </div>

          {#if day1Summary.painExercises.length > 0}
            <p class="text-xs mt-2" style="color: #F97316;">
              Flagged: {day1Summary.painExercises.join(', ')} — will be avoided
            </p>
          {/if}
        </div>
      {/if}

      {#if generatingRemaining}
        <GenerationProgress estimatedSeconds={25} label="Building your week from Day 1 data..." error={genError} onRetry={generateRemainingDays} />
      {:else}
        <p class="text-base mb-3" style="color: #9B9BA4;">
          Generate the rest of Week 1, calibrated to your performance.
        </p>
        <button
          onclick={generateRemainingDays}
          class="w-full py-3 rounded-xl text-sm font-bold"
          style="background: #22C55E; color: white;">
          Generate Remaining Days
        </button>
      {/if}
    </div>

  <!-- STATE 4: Week not generated (Week 2+) -->
  {:else if hasPlan && !weekGenerated}
    <div class="rounded-2xl p-6 mb-6" style="background: #161618; border: 1px solid #84CC16;">
      {#if deloadRecommended}
        <div class="rounded-lg p-3 mb-4" style="background: rgba(249,115,22,0.1); border: 1px solid #F97316;">
          <p class="text-xs font-bold uppercase mb-1" style="color: #F97316;">Recovery Recommended</p>
          <p class="text-xs" style="color: #9B9BA4;">
            Based on your fatigue indicators, a deload week is recommended.
          </p>
        </div>
      {/if}

      <p class="text-base font-bold mb-2" style="color: #F1F1F3;">
        Week {weekInfo?.weekNumber} — {weekOverview?.theme || 'Ready to Generate'}
      </p>

      {#if weekOverview?.days?.length}
        <div class="flex flex-col gap-1.5 mb-4">
          {#each weekOverview.days as day}
            <div class="flex items-center gap-2 px-3 py-2 rounded-lg" style="background: #1E1E22;">
              <span class="text-xs font-bold" style="color: #6B6B75;">Day {day.dayNumber}</span>
              <span class="text-base" style="color: #F1F1F3;">{day.name}</span>
              <span class="text-sm ml-auto" style="color: #6B6B75;">{day.focus}</span>
            </div>
          {/each}
        </div>
      {/if}

      {#if generatingWeek}
        <GenerationProgress estimatedSeconds={25} label="Generating Week {weekInfo?.weekNumber}..." error={genError} onRetry={generateCurrentWeek} />
      {:else}
        <button
          onclick={generateCurrentWeek}
          class="w-full py-3 rounded-xl text-base font-bold flex items-center justify-center gap-2"
          style="background: #84CC16; color: white;">
          <Sparkles size={16} /> Generate Week {weekInfo?.weekNumber} Based on Your Progress
        </button>
      {/if}
    </div>

  <!-- STATE 5: Week fully generated — normal day cards -->
  {:else}
    <div class="flex flex-col gap-3 mb-6">
      {#each currentWeekDays as day, idx}
        {@const dayNum = day.dayNumber || (idx + 1)}
        {@const status = dayStatuses[dayNum] || 'upcoming'}
        {@const colors = dayColors[status]}
        {@const typeSummary = getTypeSummary(day.exercises)}

        <div
          class="rounded-2xl overflow-hidden flex flex-col relative transition-all duration-300"
          style="background: #161618; border: 1px solid {colors.border}; {status === 'today' ? 'box-shadow: 0 0 20px rgba(132,204,22,0.2);' : ''}"
        >
          <div class="absolute top-3 right-3 flex items-center gap-2">
            {#if status !== 'done' && status !== 'missed'}
              <button
                onclick={() => openRegenModal(day)}
                disabled={shufflingDay === dayNum}
                class="text-xs px-2 py-1 rounded-lg transition-all"
                style="background: #2A2A2E; color: #6B6B75;"
                title="Shuffle exercises"
              >
                {shufflingDay === dayNum ? '...' : '🔀'}
              </button>
            {/if}
            <span class="text-xs font-bold px-2 py-0.5 rounded-full"
              style="background: {colors.bg}; color: {colors.labelColor};">
              {colors.label}
            </span>
          </div>

          <button
            onclick={() => goto(`/workout/${dayNum}`)}
            class="w-full text-left px-4 pt-4 pb-3 flex flex-col gap-1"
          >
            <span class="text-xs font-medium uppercase tracking-wider" style="color: #6B6B75;">
              Day {dayNum}
            </span>
            <span class="text-base font-bold" style="color: #F1F1F3;">{day.name}</span>
            <span class="text-base" style="color: #9B9BA4;">{day.focus}</span>

            <div class="flex items-center gap-3 mt-1.5">
              <span class="text-sm" style="color: #6B6B75;">
                {day.exercises?.length || 0} exercises
              </span>
              {#if day.targetDuration}
                <span class="text-sm" style="color: #6B6B75;">
                  ~{day.targetDuration} min
                </span>
              {/if}
            </div>

            <!-- Exercise type breakdown -->
            {#if typeSummary.length > 0}
              <div class="flex flex-wrap gap-1.5 mt-2">
                {#each typeSummary as ts}
                  <span class="text-xs px-1.5 py-0.5 rounded" style="background: {ts.bgAlpha || 'rgba(155,155,164,0.08)'}; color: {ts.color || '#6B6B75'};">
                    {ts.count} {ts.label?.toLowerCase() || ts.type}
                  </span>
                {/each}
              </div>
            {/if}

            {#if status === 'today'}
              <span class="text-base font-semibold mt-2" style="color: #84CC16;">Start Workout →</span>
            {/if}
          </button>
        </div>
      {/each}
    </div>

    {#if regenerating}
      <GenerationProgress estimatedSeconds={20} label="Regenerating your program..." error={genError} onRetry={() => regenerateProgram()} />
    {:else}
      <button
        onclick={() => openRegenModal()}
        class="w-full py-3 rounded-xl text-sm font-semibold transition-all"
        style="background: #1E1E22; color: #9B9BA4; border: 1px solid #2A2A2E;">
        Regenerate Program
      </button>
    {/if}
  {/if}

  <!-- Regenerate reason modal -->
  {#if showRegenModal}
    <div
      style="position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px;"
      onclick={(e) => { if (e.target === e.currentTarget) showRegenModal = false; }}
    >
      <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.7);"></div>
      <div class="rounded-2xl p-5 w-full" style="max-width: 400px; background: #161618; border: 1px solid #2A2A2E; position: relative; z-index: 1;">
        <p class="text-base font-bold mb-1" style="color: #F1F1F3;">
          {regenTarget ? `Shuffle Day ${regenTarget.dayNumber}` : 'Regenerate Program'}
        </p>
        <p class="text-sm mb-4" style="color: #9B9BA4;">
          {regenTarget ? 'What would you like changed about this day?' : 'What would you like changed?'}
        </p>
        <textarea
          bind:value={regenReason}
          rows="3"
          placeholder="e.g., exercises are too hard, need more leg work, want different equipment..."
          class="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none mb-4"
          style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
        ></textarea>
        <div class="flex gap-3">
          <button
            onclick={() => showRegenModal = false}
            class="flex-1 py-3 rounded-xl text-sm font-semibold"
            style="background: #2A2A2E; color: #9B9BA4;">
            Cancel
          </button>
          <button
            onclick={confirmRegen}
            class="flex-1 py-3 rounded-xl text-sm font-bold"
            style="background: #84CC16; color: white;">
            {regenTarget ? 'Shuffle' : 'Regenerate'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
