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

  // Skip tracking: { [exIdx]: true }
  let skippedExercises = $state({});

  // Custom exercises
  let customExercises = $state([]);
  let showAddForm = $state(false);
  let newExName = $state('');
  let newExMuscle = $state('Other');
  let newExSets = $state([{ weight: 0, reps: 10, rpe: null, done: false }]);

  // Debounced auto-save
  let autoSaveTimer = null;

  // ── Derived ────────────────────────────────────────────────────────────────

  let exercises = $derived(dayData?.exercises ?? []);

  // Exclude skipped exercises from counts
  let totalSets = $derived(
    exercises.reduce((acc, ex, ei) => {
      if (skippedExercises[ei]) return acc;
      return acc + Object.keys(setStates[ei] ?? {}).length;
    }, 0) + customExercises.reduce((acc, ce) => acc + ce.sets.length, 0)
  );

  let completedSets = $derived(
    exercises.reduce((acc, ex, ei) => {
      if (skippedExercises[ei]) return acc;
      return acc + Object.values(setStates[ei] ?? {}).filter(s => s.done).length;
    }, 0) + customExercises.reduce((acc, ce) => acc + ce.sets.filter(s => s.done).length, 0)
  );

  let progressPct = $derived(totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0);

  // At least 1 set completed (for showing Finish Workout button)
  let hasAnyCompletion = $derived(completedSets > 0);

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
      setTimeout(() => {
        expandedEx = exIdx + 1;
      }, 400);
    }

    // Debounced auto-save
    debouncedAutoSave();
  }

  function handleSetUndo(exIdx, setIdx) {
    setStates[exIdx][setIdx] = { ...setStates[exIdx][setIdx], done: false };
    showRestTimer = false;
    debouncedAutoSave();
  }

  function onRestComplete() {
    showRestTimer = false;
  }

  // Skip exercise handler
  function handleSkipExercise(exIdx) {
    skippedExercises[exIdx] = true;
    debouncedAutoSave();
  }

  function handleUndoSkipExercise(exIdx) {
    delete skippedExercises[exIdx];
    skippedExercises = { ...skippedExercises };
    debouncedAutoSave();
  }

  // Custom exercise handlers
  function addCustomExercise() {
    if (!newExName.trim()) return;
    customExercises = [...customExercises, {
      id: 'custom-' + Date.now(),
      name: newExName.trim(),
      muscleGroup: newExMuscle,
      custom: true,
      sets: newExSets.map((s, i) => ({ ...s, setNum: i + 1 }))
    }];
    // Reset form
    newExName = '';
    newExMuscle = 'Other';
    newExSets = [{ weight: 0, reps: 10, rpe: null, done: false }];
    showAddForm = false;
    debouncedAutoSave();
  }

  function addNewSetRow() {
    newExSets = [...newExSets, { weight: 0, reps: 10, rpe: null, done: false }];
  }

  function removeNewSetRow(idx) {
    if (newExSets.length <= 1) return;
    newExSets = newExSets.filter((_, i) => i !== idx);
  }

  function toggleCustomSetDone(ceIdx, setIdx) {
    customExercises[ceIdx].sets[setIdx].done = !customExercises[ceIdx].sets[setIdx].done;
    customExercises = [...customExercises];
    debouncedAutoSave();
  }

  function updateCustomSet(ceIdx, setIdx, field, value) {
    customExercises[ceIdx].sets[setIdx][field] = value;
    customExercises = [...customExercises];
    debouncedAutoSave();
  }

  // Finish Workout handler
  function handleFinishWorkout() {
    showRestTimer = false;
    showFeedback = true;
  }

  // Debounced auto-save (300ms)
  function debouncedAutoSave() {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => doAutoSave(), 300);
  }

  async function doAutoSave() {
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
    const prescribedExercises = exercises.map((ex, ei) => {
      if (skippedExercises[ei]) {
        return { id: ex.id, skipped: true, reason: 'user_choice' };
      }
      return {
        id: ex.id,
        name: ex.name,
        sets: Object.entries(setStates[ei]).map(([si, s]) => ({
          setNum: parseInt(si) + 1,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          done: s.done
        }))
      };
    });

    const customExData = customExercises.map(ce => ({
      id: ce.id,
      name: ce.name,
      muscleGroup: ce.muscleGroup,
      custom: true,
      sets: ce.sets.map((s, i) => ({
        setNum: i + 1,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
        done: s.done
      }))
    }));

    return {
      day: parseInt($page.params.day),
      date: today,
      cycleWeek: weekInfo?.cycleWeek,
      isDeload,
      exercises: [...prescribedExercises, ...customExData],
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
      {@const isSkipped = !!skippedExercises[exIdx]}
      {@const exSetsDone = !isSkipped && Object.values(setStates[exIdx] ?? {}).every(s => s.done)}
      {@const exSetsCount = Object.keys(setStates[exIdx] ?? {}).length}
      {@const exDoneCount = Object.values(setStates[exIdx] ?? {}).filter(s => s.done).length}
      {@const isExpanded = expandedEx === exIdx}
      {@const rec = recommendations?.[exercise.id]}

      <div
        class="rounded-2xl overflow-hidden transition-all duration-300"
        style="
          background: #161618;
          border: 1px solid {isSkipped ? '#F59E0B' : exSetsDone ? '#22C55E' : isExpanded ? '#3B82F6' : '#2A2A2E'};
          opacity: {isSkipped ? 0.6 : 1};
          transition: border-color 0.3s ease, opacity 0.3s ease;
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
              background: {isSkipped ? '#F59E0B' : exSetsDone ? '#22C55E' : exDoneCount > 0 ? '#F97316' : isExpanded ? '#3B82F6' : '#2A2A2E'};
            "
          ></div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-bold truncate" style="color: #F1F1F3;">{exercise.name}</p>
              {#if isSkipped}
                <span class="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style="background: #F59E0B22; color: #F59E0B; border: 1px solid #F59E0B44;">Skipped</span>
              {/if}
            </div>
            <p class="text-xs" style="color: #9B9BA4;">
              {sets.length} sets
              {#if exercise.repRange}· {exercise.repRange} reps{/if}
              {#if exercise.restSeconds}· {exercise.restSeconds}s rest{/if}
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <!-- Skip / Undo Skip button -->
            {#if isSkipped}
              <span
                role="button" tabindex="0"
                onclick={(e) => { e.stopPropagation(); handleUndoSkipExercise(exIdx); }}
                onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleUndoSkipExercise(exIdx); } }}
                class="text-xs font-semibold px-2.5 rounded-lg cursor-pointer"
                style="background: #F59E0B22; color: #F59E0B; min-height: 32px; display: flex; align-items: center;"
              >Undo</span>
            {:else}
              <span
                role="button" tabindex="0"
                onclick={(e) => { e.stopPropagation(); handleSkipExercise(exIdx); }}
                onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleSkipExercise(exIdx); } }}
                class="text-xs font-semibold px-2.5 rounded-lg cursor-pointer"
                style="background: #2A2A2E; color: #9B9BA4; min-height: 32px; display: flex; align-items: center;"
              >Skip</span>
            {/if}

            {#if !isSkipped}
              <span class="text-xs font-semibold" style="color: {exSetsDone ? '#22C55E' : '#9B9BA4'};">
                {exDoneCount}/{exSetsCount}
              </span>
            {/if}
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#9B9BA4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              style="transform: rotate({isExpanded ? 180 : 0}deg); transition: transform 0.2s;"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </button>

        <!-- Expanded content (hidden when skipped) -->
        {#if isExpanded && !isSkipped}
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

    <!-- Custom Exercises -->
    {#each customExercises as ce, ceIdx}
      {@const ceAllDone = ce.sets.every(s => s.done)}
      {@const ceDoneCount = ce.sets.filter(s => s.done).length}
      <div
        class="rounded-2xl overflow-hidden"
        style="background: #161618; border: 1px solid {ceAllDone ? '#22C55E' : '#3B82F6'};"
      >
        <div class="px-4 py-4 flex items-center gap-3">
          <div class="shrink-0 rounded-full" style="width: 10px; height: 10px; background: {ceAllDone ? '#22C55E' : ceDoneCount > 0 ? '#F97316' : '#3B82F6'};"></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-bold truncate" style="color: #F1F1F3;">{ce.name}</p>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style="background: #3B82F622; color: #3B82F6; border: 1px solid #3B82F644;">Custom</span>
            </div>
            <p class="text-xs" style="color: #9B9BA4;">{ce.muscleGroup} · {ce.sets.length} sets</p>
          </div>
          <span class="text-xs font-semibold shrink-0" style="color: {ceAllDone ? '#22C55E' : '#9B9BA4'};">{ceDoneCount}/{ce.sets.length}</span>
        </div>
        <div class="px-4 pb-4 flex flex-col gap-2 border-t" style="border-color: #2A2A2E;">
          {#each ce.sets as cset, si}
            <div class="flex items-center gap-2 mt-2 rounded-xl px-3 py-2" style="background: #0A0A0B; border: 1px solid #2A2A2E;">
              <span class="text-xs font-bold shrink-0" style="color: #6B6B75;">S{si + 1}</span>
              <input
                type="number"
                value={cset.weight}
                oninput={(e) => updateCustomSet(ceIdx, si, 'weight', parseFloat(e.target.value) || 0)}
                class="w-16 text-center text-sm rounded-lg px-1 py-1.5 outline-none"
                style="background: #161618; color: #F1F1F3; border: 1px solid #2A2A2E;"
                placeholder="lbs"
              />
              <span class="text-xs" style="color: #6B6B75;">x</span>
              <input
                type="number"
                value={cset.reps}
                oninput={(e) => updateCustomSet(ceIdx, si, 'reps', parseInt(e.target.value) || 0)}
                class="w-14 text-center text-sm rounded-lg px-1 py-1.5 outline-none"
                style="background: #161618; color: #F1F1F3; border: 1px solid #2A2A2E;"
                placeholder="reps"
              />
              <button
                onclick={() => toggleCustomSetDone(ceIdx, si)}
                class="ml-auto rounded-lg px-3 py-1.5 text-xs font-bold"
                style="min-height: 44px; background: {cset.done ? '#22C55E' : '#2A2A2E'}; color: {cset.done ? '#fff' : '#9B9BA4'};"
              >{cset.done ? '✓' : 'Done'}</button>
            </div>
          {/each}
        </div>
      </div>
    {/each}

    <!-- Add Exercise Button / Form -->
    {#if !showAddForm}
      <button
        onclick={() => (showAddForm = true)}
        class="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
        style="background: #161618; border: 2px dashed #2A2A2E; color: #3B82F6; min-height: 56px;"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Exercise
      </button>
    {:else}
      <div class="rounded-2xl p-4 flex flex-col gap-3" style="background: #161618; border: 1px solid #2A2A2E;">
        <p class="text-sm font-bold" style="color: #F1F1F3;">Add Custom Exercise</p>

        <!-- Exercise name -->
        <input
          type="text"
          bind:value={newExName}
          placeholder="Exercise name"
          class="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3; min-height: 44px;"
        />

        <!-- Muscle group -->
        <select
          bind:value={newExMuscle}
          class="w-full rounded-xl px-4 py-3 text-sm outline-none appearance-none"
          style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3; min-height: 44px;"
        >
          {#each ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 'Quads', 'Hamstrings', 'Calves', 'Other'] as mg}
            <option value={mg}>{mg}</option>
          {/each}
        </select>

        <!-- Sets builder -->
        <p class="text-xs font-semibold mt-1" style="color: #9B9BA4;">Sets</p>
        {#each newExSets as nset, si}
          <div class="flex items-center gap-2 rounded-xl px-3 py-2" style="background: #0A0A0B; border: 1px solid #2A2A2E;">
            <span class="text-xs font-bold shrink-0" style="color: #6B6B75;">S{si + 1}</span>
            <input
              type="number"
              bind:value={nset.weight}
              class="w-16 text-center text-sm rounded-lg px-1 py-1.5 outline-none"
              style="background: #161618; color: #F1F1F3; border: 1px solid #2A2A2E;"
              placeholder="lbs"
            />
            <span class="text-xs" style="color: #6B6B75;">x</span>
            <input
              type="number"
              bind:value={nset.reps}
              class="w-14 text-center text-sm rounded-lg px-1 py-1.5 outline-none"
              style="background: #161618; color: #F1F1F3; border: 1px solid #2A2A2E;"
              placeholder="reps"
            />
            <span class="text-xs" style="color: #6B6B75;">RPE</span>
            <select
              bind:value={nset.rpe}
              class="w-14 text-center text-sm rounded-lg px-1 py-1.5 outline-none appearance-none"
              style="background: #161618; color: #F1F1F3; border: 1px solid #2A2A2E;"
            >
              <option value={null}>-</option>
              {#each [6,7,8,9,10] as rpe}
                <option value={rpe}>{rpe}</option>
              {/each}
            </select>
            {#if newExSets.length > 1}
              <button
                onclick={() => removeNewSetRow(si)}
                class="text-xs rounded-lg px-2 py-1"
                style="color: #EF4444; min-height: 44px; display: flex; align-items: center;"
              >X</button>
            {/if}
          </div>
        {/each}
        <button
          onclick={addNewSetRow}
          class="text-xs font-semibold py-2 rounded-lg"
          style="color: #3B82F6; background: #3B82F611; min-height: 44px;"
        >+ Add Set</button>

        <!-- Form actions -->
        <div class="flex gap-2 mt-1">
          <button
            onclick={() => (showAddForm = false)}
            class="flex-1 py-3 rounded-xl text-sm font-semibold"
            style="background: #2A2A2E; color: #9B9BA4; min-height: 44px;"
          >Cancel</button>
          <button
            onclick={addCustomExercise}
            disabled={!newExName.trim()}
            class="flex-1 py-3 rounded-xl text-sm font-bold"
            style="background: {newExName.trim() ? '#3B82F6' : '#2A2A2E'}; color: {newExName.trim() ? '#fff' : '#6B6B75'}; min-height: 44px;"
          >Add Exercise</button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Floating Finish Workout button -->
{#if hasAnyCompletion && !showFeedback && !showSummary}
  <div class="fixed bottom-6 left-0 right-0 z-20 flex justify-center px-4" style="pointer-events: none;">
    <button
      onclick={handleFinishWorkout}
      class="rounded-2xl px-8 py-4 font-bold text-sm shadow-lg active:scale-95 transition-all duration-200"
      style="background: #22C55E; color: #fff; min-height: 56px; pointer-events: auto; max-width: 600px; width: 100%; box-shadow: 0 4px 24px rgba(34,197,94,0.3);"
    >
      Finish Workout
    </button>
  </div>
{/if}

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
