<script>
  import { goto } from '$app/navigation';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import RestTimer from '$lib/components/RestTimer.svelte';
  import RPEFeedback from '$lib/components/RPEFeedback.svelte';
  import RPEGuide from '$lib/components/RPEGuide.svelte';

  let { data } = $props();
  let { dayData, dayNum, weekInfo, prevWorkout, doneToday, today } = $derived(data);

  // ── State ──────────────────────────────────────────────────────────────────

  // Track each exercise's sets: { [exIdx]: { [setIdx]: { done, weight, reps, rpe } } }
  let setStates = $state(
    Object.fromEntries(
      (dayData?.exercises ?? []).map((ex, ei) => [
        ei,
        Object.fromEntries(
          Array.from({ length: ex.sets || 3 }, (_, si) => [
            si,
            { done: false, weight: 0, reps: ex.reps || 8, rpe: null }
          ])
        )
      ])
    )
  );

  let expandedEx = $state(0);
  let showRestTimer = $state(false);
  let restSeconds = $state(90);
  let saving = $state(false);
  let sessionComplete = $state(false);
  let startTime = $state(Date.now());
  let showRPEGuide = $state(false);

  // Per-exercise feedback
  let exerciseFeedback = $state(
    Object.fromEntries((dayData?.exercises ?? []).map((_, i) => [i, 'good']))
  );

  // Session feedback
  let sessionDifficulty = $state('just_right');

  // ── Derived ────────────────────────────────────────────────────────────────

  let exercises = $derived(dayData?.exercises ?? []);

  let totalSets = $derived(
    exercises.reduce((sum, ex) => sum + (ex.sets || 3), 0)
  );

  let completedSets = $derived(
    Object.values(setStates).reduce(
      (sum, exSets) => sum + Object.values(exSets).filter((s) => s.done).length,
      0
    )
  );

  let progressPercent = $derived(totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0);

  let allDone = $derived(completedSets === totalSets && totalSets > 0);

  let elapsedMinutes = $state(0);
  $effect(() => {
    const interval = setInterval(() => {
      elapsedMinutes = Math.round((Date.now() - startTime) / 60000);
    }, 30000);
    return () => clearInterval(interval);
  });

  // ── Actions ────────────────────────────────────────────────────────────────

  function markSetDone(exIdx, setIdx) {
    setStates[exIdx][setIdx].done = true;

    // Start rest timer
    const ex = exercises[exIdx];
    restSeconds = ex.rest || 90;
    showRestTimer = true;
  }

  function handleRPESubmit(exIdx, setIdx, feedback) {
    setStates[exIdx][setIdx].rpe = feedback.rpe;
    // Apply suggested weight to next set
    const exSets = setStates[exIdx];
    const nextSetIdx = setIdx + 1;
    if (exSets[nextSetIdx] && !exSets[nextSetIdx].done) {
      exSets[nextSetIdx].weight = feedback.suggestedWeight;
    }
  }

  async function saveSession() {
    saving = true;
    const workoutData = {
      dayNumber: dayNum,
      dayName: dayData.name,
      weekNumber: weekInfo?.weekNumber,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      exercises: exercises.map((ex, ei) => ({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        prescribed: { sets: ex.sets, reps: ex.reps, rpe: ex.rpe },
        actual: Object.values(setStates[ei] || {}).map((s, si) => ({
          setNum: si + 1,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          completed: s.done
        })),
        feedback: exerciseFeedback[ei] || 'good'
      })),
      sessionFeedback: {
        difficulty: sessionDifficulty,
        notes: '',
        energyLevel: 'normal'
      }
    };

    try {
      const res = await fetch(`/workout/${dayNum}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workoutData })
      });
      if (res.ok) {
        sessionComplete = true;
      }
    } finally {
      saving = false;
    }
  }

  const feedbackOptions = [
    { id: 'good', label: 'Good', color: '#22C55E' },
    { id: 'too_easy', label: 'Easy', color: '#3B82F6' },
    { id: 'too_hard', label: 'Hard', color: '#F97316' },
    { id: 'pain', label: 'Pain', color: '#EF4444' },
  ];
</script>

<svelte:head>
  <title>LIFT — {dayData?.name || 'Workout'}</title>
</svelte:head>

<div class="px-4 py-6 pb-32" style="max-width: 600px; margin: 0 auto;">

  <!-- Header -->
  <div class="flex items-center justify-between mb-4">
    <button onclick={() => goto('/dashboard')} class="text-sm font-medium" style="color: #6B6B75;">
      ← Back
    </button>
    <button onclick={() => showRPEGuide = !showRPEGuide} class="text-sm px-2 py-1 rounded-lg" style="background: #1E1E22; color: #6B6B75;">
      RPE ?
    </button>
  </div>

  {#if showRPEGuide}
    <div class="mb-4">
      <RPEGuide expanded={true} />
    </div>
  {/if}

  <div class="mb-5">
    <h1 class="text-xl font-black" style="color: #F1F1F3;">{dayData?.name || 'Workout'}</h1>
    <p class="text-sm" style="color: #9B9BA4;">{dayData?.focus || ''}</p>
    <div class="flex items-center gap-3 mt-1">
      <span class="text-xs" style="color: #6B6B75;">
        Week {weekInfo?.weekNumber}{weekInfo?.isDeload ? ' (Deload)' : ''}
      </span>
      <span class="text-xs" style="color: #6B6B75;">{elapsedMinutes} min elapsed</span>
    </div>
  </div>

  <!-- Progress bar -->
  <div class="mb-6">
    <ProgressBar value={progressPercent} color={allDone ? '#22C55E' : '#3B82F6'} />
    <p class="text-xs mt-1 text-right" style="color: #6B6B75;">{completedSets}/{totalSets} sets</p>
  </div>

  <!-- Rest timer overlay -->
  {#if showRestTimer}
    <div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.8);">
      <div class="text-center">
        <RestTimer seconds={restSeconds} onComplete={() => showRestTimer = false} />
        <button onclick={() => showRestTimer = false}
          class="mt-4 text-sm font-medium" style="color: #6B6B75;">Skip</button>
      </div>
    </div>
  {/if}

  <!-- Session complete screen -->
  {#if sessionComplete}
    <div class="rounded-2xl p-8 text-center" style="background: #161618; border: 1px solid #22C55E44;">
      <div class="text-4xl mb-3">💪</div>
      <h2 class="text-xl font-black mb-2" style="color: #22C55E;">Workout Complete!</h2>
      <p class="text-sm mb-1" style="color: #9B9BA4;">{dayData?.name}</p>
      <p class="text-sm mb-4" style="color: #6B6B75;">
        {completedSets} sets in {elapsedMinutes} minutes
      </p>
      <button onclick={() => goto('/dashboard')}
        class="px-6 py-3 rounded-xl text-sm font-bold" style="background: #3B82F6; color: white;">
        Back to Dashboard
      </button>
    </div>
  {:else}
    <!-- Exercise list -->
    <div class="flex flex-col gap-4">
      {#each exercises as ex, exIdx}
        {@const exSets = setStates[exIdx] || {}}
        {@const isExpanded = expandedEx === exIdx}
        {@const exDone = Object.values(exSets).every((s) => s.done)}

        <div
          class="rounded-2xl overflow-hidden transition-all"
          style="background: #161618; border: 1px solid {exDone ? '#22C55E44' : isExpanded ? '#3B82F6' : '#2A2A2E'};"
        >
          <!-- Exercise header — tap to expand -->
          <button
            onclick={() => expandedEx = isExpanded ? -1 : exIdx}
            class="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2">
                {#if exDone}
                  <span style="color: #22C55E;">✓</span>
                {/if}
                <span class="text-sm font-bold" style="color: {exDone ? '#22C55E' : '#F1F1F3'};">
                  {ex.name}
                </span>
              </div>
              <span class="text-xs" style="color: #6B6B75;">
                {ex.muscleGroup} · {ex.sets}×{ex.reps} @ RPE {ex.rpe}
              </span>
            </div>
            <span class="text-xs" style="color: #6B6B75;">{isExpanded ? '▲' : '▼'}</span>
          </button>

          {#if isExpanded}
            <div class="px-4 pb-4 flex flex-col gap-3">
              <!-- Cue -->
              {#if ex.cue}
                <div class="rounded-lg px-3 py-2" style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2);">
                  <p class="text-xs font-medium" style="color: #3B82F6;">{ex.cue}</p>
                </div>
              {/if}

              <!-- Tip -->
              {#if ex.tip}
                <p class="text-xs" style="color: #6B6B75;">{ex.tip}</p>
              {/if}

              <!-- Equipment -->
              {#if ex.equipment}
                <p class="text-xs" style="color: #9B9BA4;">Equipment: {ex.equipment}</p>
              {/if}

              <!-- Technique -->
              {#if ex.technique}
                <div class="rounded-lg px-3 py-2" style="background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.2);">
                  <p class="text-xs font-medium" style="color: #F97316;">
                    Final set: {ex.technique}{ex.techniqueNote ? ` — ${ex.techniqueNote}` : ''}
                  </p>
                </div>
              {/if}

              <!-- Sets -->
              {#each Array.from({ length: ex.sets || 3 }) as _, setIdx}
                {@const setData = exSets[setIdx] || { done: false, weight: 0, reps: ex.reps, rpe: null }}

                <div class="rounded-xl p-3" style="background: #0A0A0B; border: 1px solid {setData.done ? '#22C55E44' : '#2A2A2E'};">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold" style="color: {setData.done ? '#22C55E' : '#9B9BA4'};">
                      Set {setIdx + 1}{setData.done ? ' ✓' : ''}
                    </span>
                    <span class="text-xs" style="color: #6B6B75;">Target: {ex.reps} reps @ RPE {ex.rpe}</span>
                  </div>

                  {#if !setData.done}
                    <!-- Input row -->
                    <div class="flex items-center gap-2 mb-2">
                      <div class="flex flex-col gap-0.5 flex-1">
                        <label class="text-xs" style="color: #6B6B75;">Weight</label>
                        <input type="number" bind:value={setStates[exIdx][setIdx].weight}
                          placeholder="lbs" step="2.5" min="0"
                          class="w-full rounded-lg px-3 py-2 text-sm outline-none"
                          style="background: #161618; border: 1px solid #2A2A2E; color: #F1F1F3;" />
                      </div>
                      <div class="flex flex-col gap-0.5 w-20">
                        <label class="text-xs" style="color: #6B6B75;">Reps</label>
                        <input type="number" bind:value={setStates[exIdx][setIdx].reps}
                          min="0" max="50"
                          class="w-full rounded-lg px-3 py-2 text-sm outline-none"
                          style="background: #161618; border: 1px solid #2A2A2E; color: #F1F1F3;" />
                      </div>
                      <div class="flex flex-col gap-0.5">
                        <label class="text-xs opacity-0">Done</label>
                        <button onclick={() => markSetDone(exIdx, setIdx)}
                          class="px-4 py-2 rounded-lg text-sm font-bold"
                          style="background: #3B82F6; color: white;">
                          Done
                        </button>
                      </div>
                    </div>
                  {:else}
                    <!-- Completed set summary -->
                    <div class="flex items-center gap-3 text-sm" style="color: #9B9BA4;">
                      <span>{setData.weight} lbs</span>
                      <span>×</span>
                      <span>{setData.reps} reps</span>
                      {#if setData.rpe}
                        <span>@ RPE {setData.rpe}</span>
                      {/if}
                    </div>
                  {/if}

                  <!-- RPE feedback after completing a set -->
                  {#if setData.done && !setData.rpe}
                    <div class="mt-2">
                      <RPEFeedback
                        currentWeight={setData.weight}
                        targetRPE={ex.rpe}
                        targetReps={ex.reps}
                        bind:actualReps={setStates[exIdx][setIdx].reps}
                        onSubmit={(fb) => handleRPESubmit(exIdx, setIdx, fb)}
                      />
                    </div>
                  {/if}
                </div>
              {/each}

              <!-- Per-exercise feedback -->
              {#if exDone}
                <div class="flex gap-2 mt-1">
                  {#each feedbackOptions as opt}
                    <button
                      type="button"
                      onclick={() => exerciseFeedback[exIdx] = opt.id}
                      class="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                      style="
                        background: {exerciseFeedback[exIdx] === opt.id ? `${opt.color}20` : '#0A0A0B'};
                        color: {exerciseFeedback[exIdx] === opt.id ? opt.color : '#6B6B75'};
                        border: 1px solid {exerciseFeedback[exIdx] === opt.id ? opt.color : '#2A2A2E'};
                      "
                    >
                      {opt.label}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Session complete / save button -->
    {#if allDone}
      <div class="mt-6 flex flex-col gap-3">
        <!-- Session difficulty -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold" style="color: #9B9BA4;">How was this session?</label>
          <div class="flex gap-2">
            {#each [{ id: 'too_easy', label: 'Too Easy' }, { id: 'just_right', label: 'Just Right' }, { id: 'too_hard', label: 'Too Hard' }] as opt}
              <button
                type="button"
                onclick={() => sessionDifficulty = opt.id}
                class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style="
                  background: {sessionDifficulty === opt.id ? '#3B82F6' : '#1E1E22'};
                  color: {sessionDifficulty === opt.id ? '#fff' : '#9B9BA4'};
                  border: 1px solid {sessionDifficulty === opt.id ? '#3B82F6' : '#2A2A2E'};
                "
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>

        <button
          onclick={saveSession}
          disabled={saving}
          class="w-full py-4 rounded-xl text-base font-bold transition-all active:scale-95"
          style="background: #22C55E; color: white; opacity: {saving ? 0.7 : 1};"
        >
          {saving ? 'Saving...' : 'Complete Workout'}
        </button>
      </div>
    {/if}
  {/if}
</div>
