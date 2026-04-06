<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import RestTimer from '$lib/components/RestTimer.svelte';
  import SetRow from '$lib/components/SetRow.svelte';

  let { data } = $props();
  let { dayData, weekInfo, prevWorkout, recommendations, hasPeloton, today } = $derived(data);

  const isDeload = $derived(weekInfo?.isDeload ?? false);

  // ── State ──────────────────────────────────────────────────────────────────

  // For each exercise, track set completion: { [exIdx]: { [setIdx]: { done, weight, reps, rpe } } }
  let setStates = $state(
    Object.fromEntries(
      (dayData?.exercises ?? []).map((ex, ei) => [
        ei,
        Object.fromEntries(
          buildSets(ex, isDeload).map((s, si) => [si, { done: false, weight: s.weight ?? 0, reps: s.reps ?? 10, rpe: null }])
        )
      ])
    )
  );

  let expandedEx = $state(0);
  let showRestTimer = $state(false);
  let restSeconds = $state(90);
  let showFeedback = $state(false);
  let showSummary = $state(false);
  let feedbackRating = $state(null);
  let feedbackNote = $state('');
  let saving = $state(false);
  let saveError = $state('');

  // ── Derived ────────────────────────────────────────────────────────────────

  let exercises = $derived(dayData?.exercises ?? []);

  let totalSets = $derived(
    exercises.reduce((acc, ex, ei) => acc + Object.keys(setStates[ei] ?? {}).length, 0)
  );

  let completedSets = $derived(
    exercises.reduce((acc, ex, ei) => {
      return acc + Object.values(setStates[ei] ?? {}).filter(s => s.done).length;
    }, 0)
  );

  let progressPct = $derived(totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0);

  let allDone = $derived(completedSets > 0 && completedSets === totalSets);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function buildSets(exercise, deload) {
    const sets = exercise.sets ?? [];
    if (!deload) return sets;
    // Deload: first 2 sets only, weight capped at 60%
    return sets.slice(0, 2).map(s => ({
      ...s,
      weight: s.weight && s.weight !== 'BW' ? Math.round((s.weight * 0.6) / 2.5) * 2.5 : s.weight
    }));
  }

  function getSets(exIdx) {
    return buildSets(exercises[exIdx], isDeload);
  }

  function getPrevSet(exercise, setIdx) {
    if (!prevWorkout) return null;
    const prevEx = prevWorkout.exercises?.find(e => e.id === exercise.id);
    return prevEx?.sets?.[setIdx] ?? null;
  }

  function getRestSeconds(exercise, setIdx) {
    const sets = getSets(exercise ? exercises.indexOf(exercise) : 0);
    const set = sets[setIdx];
    if (set?.rest) return set.rest;
    return exercise?.restSeconds ?? 90;
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  function handleSetComplete(exIdx, setIdx, weight, reps, rpe) {
    setStates[exIdx][setIdx] = { done: true, weight, reps, rpe };

    // Determine rest time
    const ex = exercises[exIdx];
    const setsForEx = getSets(exIdx);
    const set = setsForEx[setIdx];
    restSeconds = set?.rest ?? ex?.restSeconds ?? 90;
    showRestTimer = true;

    // Auto-advance to next exercise when all sets in this one are done
    const exSetsDone = Object.values(setStates[exIdx]).every(s => s.done);
    if (exSetsDone && exIdx < exercises.length - 1) {
      // Slight delay so user sees the completion
      setTimeout(() => {
        expandedEx = exIdx + 1;
      }, 400);
    }

    // Auto-save
    autoSave();

    // Check if everything is done
    if (allDone) {
      showRestTimer = false;
      setTimeout(() => (showFeedback = true), 600);
    }
  }

  function handleSetUndo(exIdx, setIdx) {
    setStates[exIdx][setIdx] = { ...setStates[exIdx][setIdx], done: false };
    showRestTimer = false;
  }

  function onRestComplete() {
    showRestTimer = false;
  }

  async function autoSave() {
    const workoutData = buildWorkoutPayload();
    try {
      await fetch(`/workout/${$page.params.day}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutData })
      });
    } catch (e) {
      // Silently fail auto-saves
    }
  }

  function buildWorkoutPayload() {
    return {
      day: parseInt($page.params.day),
      date: today,
      cycleWeek: weekInfo?.cycleWeek,
      isDeload,
      exercises: exercises.map((ex, ei) => ({
        id: ex.id,
        name: ex.name,
        sets: Object.entries(setStates[ei]).map(([si, s]) => ({
          setNum: parseInt(si) + 1,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          done: s.done
        }))
      })),
      feedback: feedbackRating ? { rating: feedbackRating, note: feedbackNote } : null
    };
  }

  async function submitFeedback() {
    saving = true;
    saveError = '';
    const workoutData = buildWorkoutPayload();
    try {
      const res = await fetch(`/workout/${$page.params.day}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutData })
      });
      if (!res.ok) throw new Error('Save failed');
      showFeedback = false;
      showSummary = true;
    } catch (e) {
      saveError = 'Could not save workout. Check your connection.';
    } finally {
      saving = false;
    }
  }

  function exitWorkout() {
    goto('/dashboard');
  }
</script>

<svelte:head>
  <title>LIFT — Day {$page.params.day}</title>
</svelte:head>

<!-- Sticky header -->
<header
  class="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
  style="background: rgba(10,10,11,0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #2A2A2E;"
>
  <div class="flex-1 min-w-0">
    <p class="text-xs font-semibold truncate" style="color: #9B9BA4;">
      Day {$page.params.day}
      {#if isDeload}
        · <span style="color: #F97316;">DELOAD</span>
      {/if}
    </p>
    <p class="text-sm font-bold truncate" style="color: #F1F1F3;">{dayData?.name ?? 'Workout'}</p>
  </div>
  <div class="flex items-center gap-3 shrink-0">
    <div style="width: 100px;">
      <ProgressBar value={progressPct} label="{completedSets}/{totalSets}" color="#3B82F6" />
    </div>
    <button
      onclick={exitWorkout}
      class="flex items-center justify-center rounded-full"
      style="width: 36px; height: 36px; background: #2A2A2E; color: #9B9BA4;"
      aria-label="Exit workout"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>
</header>

<div class="px-4 py-4 pb-40" style="max-width: 600px; margin: 0 auto;">

  <!-- Banners -->
  {#if hasPeloton}
    <div class="mb-4 rounded-xl px-4 py-3 flex items-center gap-3" style="background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3);">
      <span style="font-size: 18px;">🚴</span>
      <p class="text-sm" style="color: #A78BFA;">Add 20–30 min Peloton ride after strength work.</p>
    </div>
  {/if}

  {#if isDeload}
    <div class="mb-4 rounded-xl px-4 py-3" style="background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.3);">
      <p class="text-sm font-bold" style="color: #F97316;">DELOAD WEEK</p>
      <p class="text-xs mt-0.5" style="color: #9B9BA4;">60% of normal weights · 2 sets per exercise · Focus on form &amp; recovery</p>
    </div>
  {/if}

  <!-- Exercise list -->
  <div class="flex flex-col gap-4">
    {#each exercises as exercise, exIdx}
      {@const sets = getSets(exIdx)}
      {@const exSetsDone = Object.values(setStates[exIdx] ?? {}).every(s => s.done)}
      {@const exSetsCount = Object.keys(setStates[exIdx] ?? {}).length}
      {@const exDoneCount = Object.values(setStates[exIdx] ?? {}).filter(s => s.done).length}
      {@const isExpanded = expandedEx === exIdx}
      {@const rec = recommendations?.[exercise.id]}

      <div
        class="rounded-2xl overflow-hidden transition-all duration-300"
        style="
          background: #161618;
          border: 1px solid {exSetsDone ? '#22C55E' : isExpanded ? '#3B82F6' : '#2A2A2E'};
        "
      >
        <!-- Exercise header (always visible, tap to expand) -->
        <button
          class="w-full px-4 py-4 flex items-center gap-3 text-left"
          onclick={() => (expandedEx = isExpanded ? -1 : exIdx)}
        >
          <!-- Status dot -->
          <div
            class="shrink-0 rounded-full"
            style="
              width: 10px; height: 10px;
              background: {exSetsDone ? '#22C55E' : exDoneCount > 0 ? '#F97316' : isExpanded ? '#3B82F6' : '#2A2A2E'};
            "
          ></div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold truncate" style="color: #F1F1F3;">{exercise.name}</p>
            <p class="text-xs" style="color: #9B9BA4;">
              {sets.length} sets
              {#if exercise.repRange}· {exercise.repRange} reps{/if}
              {#if exercise.restSeconds}· {exercise.restSeconds}s rest{/if}
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs font-semibold" style="color: {exSetsDone ? '#22C55E' : '#9B9BA4'};">
              {exDoneCount}/{exSetsCount}
            </span>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#9B9BA4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              style="transform: rotate({isExpanded ? 180 : 0}deg); transition: transform 0.2s;"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </button>

        <!-- Expanded content -->
        {#if isExpanded}
          <div class="px-3 pb-4 flex flex-col gap-2 border-t" style="border-color: #2A2A2E;">
            <!-- Recommendation hint -->
            {#if rec}
              <div class="mt-3 px-3 py-2 rounded-xl flex items-start gap-2" style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p class="text-xs" style="color: #93C5FD;">{rec}</p>
              </div>
            {/if}

            <!-- Notes -->
            {#if exercise.notes}
              <p class="mt-2 text-xs px-1" style="color: #6B6B75;">{exercise.notes}</p>
            {/if}

            <!-- Set rows -->
            <div class="flex flex-col gap-2 mt-2">
              {#each sets as set, setIdx}
                {@const prevSet = getPrevSet(exercise, setIdx)}
                <SetRow
                  set={{ ...set, setNum: setIdx + 1, weight: setStates[exIdx]?.[setIdx]?.weight ?? set.weight, reps: setStates[exIdx]?.[setIdx]?.reps ?? set.reps }}
                  exerciseId={exercise.id}
                  weekIsDeload={isDeload}
                  lastWeekActual={prevSet}
                  recommendation={setIdx === 0 ? rec : null}
                  isActive={!setStates[exIdx]?.[setIdx]?.done}
                  onComplete={(w, r, rpe) => handleSetComplete(exIdx, setIdx, w, r, rpe)}
                  onUndo={() => handleSetUndo(exIdx, setIdx)}
                />
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<!-- Rest timer (floating) -->
{#if showRestTimer}
  <RestTimer seconds={restSeconds} onComplete={onRestComplete} />
{/if}

<!-- Feedback modal -->
{#if showFeedback}
  <div class="fixed inset-0 z-50 flex items-end justify-center" style="background: rgba(0,0,0,0.7);">
    <div class="w-full rounded-t-3xl p-6 pb-10" style="background: #161618; border-top: 1px solid #2A2A2E; max-width: 600px;">
      <div class="w-10 h-1 rounded-full mx-auto mb-6" style="background: #2A2A2E;"></div>
      <h2 class="text-xl font-black mb-1" style="color: #F1F1F3;">Session Complete!</h2>
      <p class="text-sm mb-6" style="color: #9B9BA4;">How did that feel?</p>

      <!-- Rating -->
      <div class="flex gap-2 mb-5">
        {#each [
          { val: 1, label: 'Easy', color: '#22C55E' },
          { val: 2, label: 'Good', color: '#3B82F6' },
          { val: 3, label: 'Hard', color: '#F97316' },
          { val: 4, label: 'Max',  color: '#EF4444' }
        ] as opt}
          <button
            onclick={() => (feedbackRating = opt.val)}
            class="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-150"
            style="
              background: {feedbackRating === opt.val ? opt.color : '#2A2A2E'};
              color: {feedbackRating === opt.val ? '#fff' : '#9B9BA4'};
              border: 1px solid {feedbackRating === opt.val ? opt.color : 'transparent'};
            "
          >
            {opt.label}
          </button>
        {/each}
      </div>

      <!-- Note -->
      <textarea
        bind:value={feedbackNote}
        placeholder="Any notes about this session… (optional)"
        rows="3"
        class="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none mb-4"
        style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
      ></textarea>

      {#if saveError}
        <p class="text-sm mb-3" style="color: #F87171;">{saveError}</p>
      {/if}

      <button
        onclick={submitFeedback}
        disabled={saving}
        class="w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
        style="background: #22C55E; color: #fff; opacity: {saving ? 0.7 : 1};"
      >
        {saving ? 'Saving…' : 'Save & Finish'}
      </button>

      <button
        onclick={() => { showFeedback = false; exitWorkout(); }}
        class="w-full py-3 mt-2 rounded-xl text-sm font-medium"
        style="color: #9B9BA4;"
      >
        Skip & Exit
      </button>
    </div>
  </div>
{/if}

<!-- Summary overlay -->
{#if showSummary}
  <div class="fixed inset-0 z-50 flex items-center justify-center px-4" style="background: rgba(0,0,0,0.85);">
    <div class="w-full rounded-3xl p-8 text-center" style="background: #161618; border: 1px solid #22C55E; max-width: 400px;">
      <!-- Trophy -->
      <div
        class="flex items-center justify-center rounded-full mx-auto mb-5"
        style="width: 72px; height: 72px; background: rgba(34,197,94,0.15);"
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h2 class="text-2xl font-black mb-1" style="color: #F1F1F3;">Workout Done!</h2>
      <p class="text-sm mb-2" style="color: #9B9BA4;">{dayData?.name}</p>
      <p class="text-3xl font-black mb-6" style="color: #22C55E;">{completedSets} sets</p>

      <div class="flex flex-col gap-3">
        <button
          onclick={exitWorkout}
          class="w-full py-3.5 rounded-xl font-bold text-sm"
          style="background: #3B82F6; color: #fff;"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  </div>
{/if}
