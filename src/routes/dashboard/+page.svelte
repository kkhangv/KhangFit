<script>
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';

  let { data } = $props();
  let { name, weekInfo, currentWeekDays, dayStatuses, sessionsCompleted, config, plan, hasPlan } = $derived(data);

  let regenerating = $state(false);
  let shufflingDay = $state(null);

  const dayColors = {
    today:    { bg: 'rgba(59,130,246,0.12)', border: '#3B82F6',  label: 'TODAY',    labelColor: '#3B82F6'  },
    done:     { bg: 'rgba(34,197,94,0.08)',  border: '#22C55E',  label: 'DONE',     labelColor: '#22C55E'  },
    missed:   { bg: 'rgba(249,115,22,0.08)', border: '#F97316',  label: 'MISSED',   labelColor: '#F97316'  },
    upcoming: { bg: 'transparent',           border: '#2A2A2E',  label: 'UPCOMING', labelColor: '#9B9BA4'  }
  };

  const weekLabels = ['', 'Foundation', 'Progression', 'Overload', 'Peak', 'Deload'];

  async function regenerateAll() {
    regenerating = true;
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'full',
          profile: {
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
            freeformNotes: config.freeformNotes
          }
        })
      });
      if (res.ok) {
        await invalidateAll();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to regenerate plan');
      }
    } finally {
      regenerating = false;
    }
  }

  async function shuffleDay(day) {
    shufflingDay = day.dayNumber;
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'day',
          profile: {
            equipment: config.equipment,
            goal: config.goal,
            experience: config.experience,
            injuries: config.injuries
          },
          currentDay: day
        })
      });
      if (res.ok) {
        await invalidateAll();
      }
    } finally {
      shufflingDay = null;
    }
  }
</script>

<svelte:head>
  <title>LIFT — Dashboard</title>
</svelte:head>

<div class="px-4 py-6 pb-24" style="max-width: 600px; margin: 0 auto;">

  <!-- Header -->
  <div class="flex items-start justify-between mb-6">
    <div>
      <h1 class="text-2xl font-black" style="color: #F1F1F3;">Hey {name}!</h1>
      <p class="text-sm mt-0.5" style="color: #9B9BA4;">
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
      <span class="text-xs font-semibold uppercase tracking-wider" style="color: {weekInfo?.isDeload ? '#F97316' : '#3B82F6'};">
        Week {weekInfo?.weekNumber || 1} — {weekLabels[weekInfo?.weekNumber || 1]}
      </span>
      <p class="text-xs mt-0.5" style="color: #6B6B75;">
        {sessionsCompleted} of {currentWeekDays.length} sessions completed
      </p>
    </div>
    {#if plan?.programName}
      <span class="text-xs font-medium px-2 py-1 rounded-lg" style="background: #2A2A2E; color: #9B9BA4;">
        {plan.programName}
      </span>
    {/if}
  </div>

  <!-- No plan state -->
  {#if !hasPlan}
    <div class="rounded-2xl p-8 text-center mb-6" style="background: #161618; border: 1px solid #2A2A2E;">
      <p class="text-lg font-bold mb-2" style="color: #F1F1F3;">No workout plan yet</p>
      <p class="text-sm mb-4" style="color: #9B9BA4;">Generate a personalized program with AI.</p>
      <button
        onclick={regenerateAll}
        disabled={regenerating}
        class="px-6 py-3 rounded-xl text-sm font-bold"
        style="background: #3B82F6; color: white; opacity: {regenerating ? 0.7 : 1};"
      >
        {regenerating ? 'Generating...' : 'Generate Plan'}
      </button>
    </div>
  {:else}
    <!-- Day cards -->
    <div class="flex flex-col gap-3 mb-6">
      {#each currentWeekDays as day, idx}
        {@const dayNum = day.dayNumber || (idx + 1)}
        {@const status = dayStatuses[dayNum] || 'upcoming'}
        {@const colors = dayColors[status]}

        <div
          class="rounded-2xl overflow-hidden flex flex-col relative transition-all duration-300"
          style="background: #161618; border: 1px solid {colors.border}; {status === 'today' ? 'box-shadow: 0 0 20px rgba(59,130,246,0.2);' : ''}"
        >
          <!-- Status badge -->
          <div class="absolute top-3 right-3 flex items-center gap-2">
            {#if status !== 'done' && status !== 'missed'}
              <button
                onclick={() => shuffleDay(day)}
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

          <!-- Card body — clickable to start workout -->
          <button
            onclick={() => goto(`/workout/${dayNum}`)}
            class="w-full text-left px-4 pt-4 pb-3 flex flex-col gap-1"
          >
            <span class="text-xs font-medium uppercase tracking-wider" style="color: #6B6B75;">
              Day {dayNum}
            </span>
            <span class="text-base font-bold" style="color: #F1F1F3;">{day.name}</span>
            <span class="text-sm" style="color: #9B9BA4;">{day.focus}</span>

            <div class="flex items-center gap-3 mt-1.5">
              <span class="text-xs" style="color: #6B6B75;">
                {day.exercises?.length || 0} exercises
              </span>
              {#if day.targetDuration}
                <span class="text-xs" style="color: #6B6B75;">
                  ~{day.targetDuration} min
                </span>
              {/if}
            </div>

            {#if status === 'today'}
              <span class="text-sm font-semibold mt-2" style="color: #3B82F6;">Start Workout →</span>
            {/if}
          </button>
        </div>
      {/each}
    </div>

    <!-- Regenerate all button -->
    <button
      onclick={regenerateAll}
      disabled={regenerating}
      class="w-full py-3 rounded-xl text-sm font-semibold transition-all"
      style="background: #1E1E22; color: #9B9BA4; border: 1px solid #2A2A2E; opacity: {regenerating ? 0.7 : 1};"
    >
      {regenerating ? 'Generating new plan...' : 'Regenerate Entire Plan'}
    </button>
  {/if}
</div>
