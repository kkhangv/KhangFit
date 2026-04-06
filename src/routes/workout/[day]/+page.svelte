<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import RestTimer from '$lib/components/RestTimer.svelte';
  import SetRow from '$lib/components/SetRow.svelte';

  let { data } = $props();
  let { dayData, weekInfo, prevWorkout, recommendations, hasPeloton, today } = $derived(data);

  // All exercises from DB for the picker
  let allExercises = $derived(data.allExercises || []);
  let showExercisePicker = $state(false);
  let exerciseSearch = $state('');
  let filteredExercises = $derived(
    allExercises.filter(ex =>
      ex.name?.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      (ex.primaryMuscles || []).some(m => m.toLowerCase().includes(exerciseSearch.toLowerCase())) ||
      (ex.muscleGroup || '').toLowerCase().includes(exerciseSearch.toLowerCase())
    )
  );

  // Group filtered exercises by muscle group for picker display
  let groupedExercises = $derived(() => {
    const groups = {};
    for (const ex of filteredExercises) {
      const group = ex.primaryMuscles?.[0] || ex.muscleGroup || 'Other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(ex);
    }
    return groups;
  });

  // Removed exercises with undo support
  let removedExercises = $state({});
  let undoToast = $state(null);
  let undoTimer = $state(null);

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

  // Elapsed timer
  let startTime = $state(Date.now());
  let elapsed = $state('0:00');

  $effect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const min = Math.floor(diff / 60);
      const sec = diff % 60;
      elapsed = `${min}:${sec.toString().padStart(2, '0')}`;
    }, 1000);
    return () => clearInterval(interval);
  });

  // Debounced auto-save
  let autoSaveTimer = null;

  // ── Derived ────────────────────────────────────────────────────────────────

  let exercises = $derived(dayData?.exercises ?? []);

  // Exclude skipped and removed exercises from counts
  let totalSets = $derived(
    exercises.reduce((acc, ex, ei) => {
      if (skippedExercises[ei] || removedExercises[ei]) return acc;
      return acc + Object.keys(setStates[ei] ?? {}).length;
    }, 0) + customExercises.reduce((acc, ce) => acc + ce.sets.length, 0)
  );

  let completedSets = $derived(
    exercises.reduce((acc, ex, ei) => {
      if (skippedExercises[ei] || removedExercises[ei]) return acc;
      return acc + Object.values(setStates[ei] ?? {}).filter(s => s.done).length;
    }, 0) + customExercises.reduce((acc, ce) => acc + ce.sets.filter(s => s.done).length, 0)
  );

  let progressPct = $derived(totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0);

  // At least 1 set completed (for showing Finish Workout button)
  let hasAnyCompletion = $derived(completedSets > 0);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function muscleIcon(group) {
    const g = (group || '').toLowerCase();
    if (g.includes('chest')) return '\u{1FAC1}';
    if (g.includes('back') || g.includes('lat')) return '\u{1F519}';
    if (g.includes('shoulder') || g.includes('delt')) return '\u{1F4AA}';
    if (g.includes('bicep') || g.includes('curl')) return '\u{1F4AA}';
    if (g.includes('tricep')) return '\u{1F4AA}';
    if (g.includes('ab') || g.includes('core')) return '\u{1F3AF}';
    if (g.includes('quad') || g.includes('leg')) return '\u{1F9B5}';
    if (g.includes('ham') || g.includes('glute')) return '\u{1F351}';
    if (g.includes('calf') || g.includes('calv')) return '\u{1F9B6}';
    return '\u{1F3CB}\uFE0F';
  }

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

  // Remove exercise from session
  function handleRemoveExercise(exIdx) {
    const ex = exercises[exIdx];
    removedExercises[exIdx] = true;
    removedExercises = { ...removedExercises };

    // Show undo toast
    if (undoTimer) clearTimeout(undoTimer);
    undoToast = { exIdx, name: ex.name };
    undoTimer = setTimeout(() => {
      undoToast = null;
    }, 5000);

    debouncedAutoSave();
  }

  function handleUndoRemoveExercise(exIdx) {
    delete removedExercises[exIdx];
    removedExercises = { ...removedExercises };
    undoToast = null;
    if (undoTimer) clearTimeout(undoTimer);
    debouncedAutoSave();
  }

  // Add exercise from picker
  function addExerciseFromPicker(ex) {
    const defaultSets = [];
    for (let i = 0; i < 3; i++) {
      defaultSets.push({ weight: 0, reps: 10, rpe: null, done: false, setNum: i + 1 });
    }
    customExercises = [...customExercises, {
      id: ex.id || 'picked-' + Date.now(),
      name: ex.name,
      muscleGroup: ex.primaryMuscles?.[0] || ex.muscleGroup || 'Other',
      equipment: ex.equipment || null,
      custom: false,
      sets: defaultSets
    }];
    showExercisePicker = false;
    exerciseSearch = '';
    debouncedAutoSave();
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
    const prescribedExercises = exercises
      .map((ex, ei) => {
        if (removedExercises[ei]) return null;
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
      })
      .filter(Boolean);

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
    <span class="text-xs font-mono font-bold" style="color: #9B9BA4;">&#9201; {elapsed}</span>
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
      {@const isRemoved = !!removedExercises[exIdx]}
      {#if isRemoved}
        <!-- removed exercise: skip rendering -->
      {:else}
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
          <!-- Status dot + muscle icon -->
          <div class="shrink-0 flex items-center gap-1.5">
            <div
              class="rounded-full"
              style="
                width: 10px; height: 10px;
                background: {isSkipped ? '#F59E0B' : exSetsDone ? '#22C55E' : exDoneCount > 0 ? '#F97316' : isExpanded ? '#3B82F6' : '#2A2A2E'};
              "
            ></div>
            <span style="font-size: 16px; line-height: 1;">{muscleIcon(exercise.muscleGroup)}</span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-bold truncate" style="color: #F1F1F3;">{exercise.name}</p>
              {#if isSkipped}
                <span class="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style="background: #F59E0B22; color: #F59E0B; border: 1px solid #F59E0B44;">Skipped</span>
              {/if}
              {#if exercise.technique === 'superset' || exercise.supersetWith}
                <span style="background: #7C3AED22; color: #A78BFA; border: 1px solid #7C3AED44;" class="text-xs font-bold px-2 py-0.5 rounded-full">&#9889; Superset</span>
              {/if}
              {#if exercise.technique === 'dropset'}
                <span style="background: #F9731622; color: #FB923C; border: 1px solid #F9731644;" class="text-xs font-bold px-2 py-0.5 rounded-full">&#11015; Drop Set</span>
              {/if}
              {#if exercise.technique === 'restpause'}
                <span style="background: #EF444422; color: #F87171; border: 1px solid #EF444444;" class="text-xs font-bold px-2 py-0.5 rounded-full">&#9208; Rest-Pause</span>
              {/if}
            </div>
            {#if exercise.equipment}
              <span class="text-xs px-2 py-0.5 rounded-full inline-block mt-0.5" style="background: #2A2A2E; color: #6B6B75;">
                &#128295; {exercise.equipment}
              </span>
            {/if}
            <p class="text-xs mt-0.5" style="color: #9B9BA4;">
              {sets.length} sets
              {#if exercise.repRange}· {exercise.repRange} reps{/if}
              {#if exercise.restSeconds}· {exercise.restSeconds}s rest{/if}
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <!-- Remove exercise button -->
            <span
              role="button" tabindex="0"
              onclick={(e) => { e.stopPropagation(); handleRemoveExercise(exIdx); }}
              onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleRemoveExercise(exIdx); } }}
              class="rounded-lg cursor-pointer flex items-center justify-center"
              style="background: #2A2A2E; color: #EF4444; width: 32px; height: 32px;"
              aria-label="Remove exercise"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </span>

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
              <div class="flex gap-1">
                {#each Array(exSetsCount) as _, i}
                  <div
                    class="rounded-full"
                    style="width: 8px; height: 8px; background: {i < exDoneCount ? '#22C55E' : '#2A2A2E'}; transition: background 0.3s;"
                  ></div>
                {/each}
              </div>
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
            <!-- Exercise cue -->
            {#if exercise.cue}
              <div class="mt-3 px-3 py-2.5 rounded-xl" style="background: rgba(59,130,246,0.06); border-left: 3px solid #3B82F6;">
                <p class="text-xs font-medium" style="color: #93C5FD;">&#128161; {exercise.cue}</p>
              </div>
            {/if}

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
      {/if}
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
                class="ml-auto rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
                style="width: 48px; height: 48px; background: {cset.done ? '#22C55E' : '#2A2A2E'}; color: {cset.done ? '#fff' : '#9B9BA4'}; {cset.done ? 'animation: pulse-done 0.3s ease-out;' : ''}"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/each}

    <!-- Add Exercise Button / Picker -->
    {#if !showExercisePicker && !showAddForm}
      <button
        onclick={() => (showExercisePicker = true)}
        class="w-full rounded-2xl py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
        style="background: #161618; border: 2px dashed #3B82F644; color: #3B82F6; min-height: 56px;"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        Add Exercise
      </button>
    {:else if showExercisePicker}
      <!-- Exercise Picker -->
      <div class="rounded-2xl p-4 flex flex-col gap-3" style="background: #161618; border: 1px solid #3B82F6;">
        <div class="flex items-center justify-between">
          <p class="text-sm font-bold" style="color: #F1F1F3;">Add Exercise</p>
          <button
            onclick={() => { showExercisePicker = false; exerciseSearch = ''; }}
            class="text-xs font-semibold px-2 py-1 rounded-lg"
            style="color: #9B9BA4; background: #2A2A2E;"
          >Close</button>
        </div>

        <!-- Search input -->
        <input
          type="text"
          bind:value={exerciseSearch}
          placeholder="Search by name or muscle group..."
          class="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3; min-height: 44px;"
        />

        <!-- Exercise list -->
        <div class="flex flex-col gap-1" style="max-height: 320px; overflow-y: auto;">
          {#each filteredExercises as ex}
            <button
              onclick={() => addExerciseFromPicker(ex)}
              class="w-full rounded-xl px-3 py-3 text-left transition-all duration-150 active:scale-98"
              style="background: #0A0A0B; border: 1px solid #2A2A2E;"
            >
              <p class="text-sm font-semibold" style="color: #F1F1F3;">{ex.name}</p>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                {#if ex.primaryMuscles?.[0] || ex.muscleGroup}
                  <span class="text-xs px-1.5 py-0.5 rounded-full" style="background: rgba(59,130,246,0.15); color: #3B82F6;">
                    {ex.primaryMuscles?.[0] || ex.muscleGroup}
                  </span>
                {/if}
                {#if ex.equipment}
                  <span class="text-xs px-1.5 py-0.5 rounded-full" style="background: #2A2A2E; color: #6B6B75;">
                    {ex.equipment}
                  </span>
                {/if}
                {#if ex.difficulty}
                  <span class="text-xs px-1.5 py-0.5 rounded-full" style="background: rgba(34,197,94,0.1); color: #22C55E;">
                    {ex.difficulty}
                  </span>
                {/if}
              </div>
            </button>
          {/each}

          {#if filteredExercises.length === 0 && exerciseSearch}
            <p class="text-xs text-center py-4" style="color: #6B6B75;">No exercises found for "{exerciseSearch}"</p>
          {/if}

          <!-- Custom exercise option -->
          <button
            onclick={() => { showExercisePicker = false; showAddForm = true; exerciseSearch = ''; }}
            class="w-full rounded-xl px-3 py-3 text-left mt-1"
            style="background: transparent; border: 1px dashed #3B82F644;"
          >
            <div class="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span class="text-sm font-semibold" style="color: #3B82F6;">Custom exercise...</span>
            </div>
          </button>
        </div>
      </div>
    {:else}
      <!-- Custom Exercise Form (fallback) -->
      <div class="rounded-2xl p-4 flex flex-col gap-3" style="background: #161618; border: 1px solid #2A2A2E;">
        <p class="text-sm font-bold" style="color: #F1F1F3;">Add Custom Exercise</p>

        <input
          type="text"
          bind:value={newExName}
          placeholder="Exercise name"
          class="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3; min-height: 44px;"
        />

        <select
          bind:value={newExMuscle}
          class="w-full rounded-xl px-4 py-3 text-sm outline-none appearance-none"
          style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3; min-height: 44px;"
        >
          {#each ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 'Quads', 'Hamstrings', 'Calves', 'Other'] as mg}
            <option value={mg}>{mg}</option>
          {/each}
        </select>

        <p class="text-xs font-semibold mt-1" style="color: #9B9BA4;">Sets</p>
        {#each newExSets as nset, si}
          <div class="flex items-center gap-2 rounded-xl px-3 py-2" style="background: #0A0A0B; border: 1px solid #2A2A2E;">
            <span class="text-xs font-bold shrink-0" style="color: #6B6B75;">S{si + 1}</span>
            <input type="number" bind:value={nset.weight} class="w-16 text-center text-sm rounded-lg px-1 py-1.5 outline-none" style="background: #161618; color: #F1F1F3; border: 1px solid #2A2A2E;" placeholder="lbs" />
            <span class="text-xs" style="color: #6B6B75;">x</span>
            <input type="number" bind:value={nset.reps} class="w-14 text-center text-sm rounded-lg px-1 py-1.5 outline-none" style="background: #161618; color: #F1F1F3; border: 1px solid #2A2A2E;" placeholder="reps" />
            <span class="text-xs" style="color: #6B6B75;">RPE</span>
            <select bind:value={nset.rpe} class="w-14 text-center text-sm rounded-lg px-1 py-1.5 outline-none appearance-none" style="background: #161618; color: #F1F1F3; border: 1px solid #2A2A2E;">
              <option value={null}>-</option>
              {#each [6,7,8,9,10] as rpe}<option value={rpe}>{rpe}</option>{/each}
            </select>
            {#if newExSets.length > 1}
              <button onclick={() => removeNewSetRow(si)} class="text-xs rounded-lg px-2 py-1" style="color: #EF4444; min-height: 44px; display: flex; align-items: center;">X</button>
            {/if}
          </div>
        {/each}
        <button onclick={addNewSetRow} class="text-xs font-semibold py-2 rounded-lg" style="color: #3B82F6; background: #3B82F611; min-height: 44px;">+ Add Set</button>

        <div class="flex gap-2 mt-1">
          <button onclick={() => (showAddForm = false)} class="flex-1 py-3 rounded-xl text-sm font-semibold" style="background: #2A2A2E; color: #9B9BA4; min-height: 44px;">Cancel</button>
          <button onclick={addCustomExercise} disabled={!newExName.trim()} class="flex-1 py-3 rounded-xl text-sm font-bold" style="background: {newExName.trim() ? '#3B82F6' : '#2A2A2E'}; color: {newExName.trim() ? '#fff' : '#6B6B75'}; min-height: 44px;">Add Exercise</button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Undo remove toast -->
{#if undoToast}
  <div class="fixed bottom-20 left-0 right-0 flex justify-center z-30 px-4" style="pointer-events: none;">
    <div
      class="flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg"
      style="background: #2A2A2E; border: 1px solid #3B82F6; pointer-events: auto; max-width: 400px;"
    >
      <p class="text-sm flex-1" style="color: #F1F1F3;">
        Removed <strong>{undoToast.name}</strong>
      </p>
      <button
        onclick={() => handleUndoRemoveExercise(undoToast.exIdx)}
        class="text-xs font-bold px-3 py-1.5 rounded-lg"
        style="background: #3B82F6; color: #fff;"
      >Undo</button>
    </div>
  </div>
{/if}

<!-- Floating Finish Workout button -->
{#if hasAnyCompletion && !showFeedback && !showSummary}
  <div class="fixed bottom-6 left-0 right-0 flex justify-center z-20 px-4">
    <button
      onclick={handleFinishWorkout}
      class="rounded-2xl px-8 py-4 text-base font-bold shadow-2xl transition-all active:scale-95 flex items-center gap-2"
      style="background: #22C55E; color: #fff; box-shadow: 0 4px 20px rgba(34,197,94,0.4); min-height: 56px; max-width: 600px; width: 100%;"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <span class="flex-1 text-center">Finish Workout &middot; {completedSets}/{totalSets} sets</span>
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
  {@const totalVolume = exercises.reduce((acc, ex, ei) => {
    if (skippedExercises[ei] || removedExercises[ei]) return acc;
    return acc + Object.values(setStates[ei] ?? {}).reduce((a, s) => {
      if (!s.done) return a;
      const w = typeof s.weight === 'number' ? s.weight : 0;
      return a + (w * (s.reps || 0));
    }, 0);
  }, 0) + customExercises.reduce((acc, ce) => acc + ce.sets.reduce((a, s) => s.done ? a + ((typeof s.weight === 'number' ? s.weight : 0) * (s.reps || 0)) : a, 0), 0)}
  {@const completedExerciseNames = [
    ...exercises.map((ex, ei) => ({ name: ex.name, ei })).filter(({ ei }) => !skippedExercises[ei] && !removedExercises[ei] && Object.values(setStates[ei] ?? {}).some(s => s.done)).map(({ name, ei }) => ({ name, done: Object.values(setStates[ei] ?? {}).filter(s => s.done).length })),
    ...customExercises.filter(ce => ce.sets.some(s => s.done)).map(ce => ({ name: ce.name, done: ce.sets.filter(s => s.done).length }))
  ]}
  <div class="fixed inset-0 z-50 flex items-center justify-center px-4" style="background: rgba(0,0,0,0.85);">
    <div class="w-full rounded-3xl p-8 text-center" style="background: #161618; border: 1px solid #22C55E; max-width: 400px; max-height: 90vh; overflow-y: auto;">
      <!-- Celebration -->
      <div class="text-5xl mb-3">&#127881;</div>
      <h2 class="text-2xl font-black mb-1" style="color: #F1F1F3;">Workout Complete!</h2>
      <p class="text-sm mb-5" style="color: #9B9BA4;">{dayData?.name}</p>

      <!-- Stats row -->
      <div class="flex justify-center gap-6 mb-5">
        <div class="text-center">
          <p class="text-2xl font-black" style="color: #22C55E;">{completedSets}</p>
          <p class="text-xs" style="color: #9B9BA4;">Sets</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-black" style="color: #3B82F6;">{totalVolume > 0 ? (totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume) : '—'}</p>
          <p class="text-xs" style="color: #9B9BA4;">Volume (lbs)</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-black" style="color: #A78BFA;">{elapsed}</p>
          <p class="text-xs" style="color: #9B9BA4;">Duration</p>
        </div>
      </div>

      <!-- Completed exercises list -->
      {#if completedExerciseNames.length > 0}
        <div class="rounded-xl p-3 mb-5 text-left" style="background: #0A0A0B; border: 1px solid #2A2A2E;">
          {#each completedExerciseNames as cex}
            <div class="flex items-center justify-between py-1.5">
              <span class="text-xs font-medium" style="color: #F1F1F3;">{cex.name}</span>
              <span class="text-xs font-bold" style="color: #22C55E;">{cex.done} sets</span>
            </div>
          {/each}
        </div>
      {/if}

      <div class="flex flex-col gap-3">
        <button
          onclick={exitWorkout}
          class="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
          style="background: #3B82F6; color: #fff; min-height: 48px;"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Back to Dashboard
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes -global-pulse-done {
    0% { transform: scale(1); }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }
</style>
