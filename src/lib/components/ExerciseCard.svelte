<script>
  import SetRow from './SetRow.svelte';
  import InfoTip from './InfoTip.svelte';

  let {
    exercise,
    expanded = false,
    weekIsDeload = false,
    prevWorkoutData = null,
    recommendations = {},
    onToggle,
    onSetComplete,
    onSetUndo,
    onRestStart,
    onSkip,
    currentSetIndex = -1
  } = $props();

  let tipOpen = $state(false);
  let skipped = $state(false);

  let sets = $derived(exercise.sets ?? []);

  let doneSets = $derived(sets.filter((s) => s.done).length);
  let allDone = $derived(doneSets === sets.length && sets.length > 0);

  function handleSkip(e) {
    e.stopPropagation();
    skipped = true;
    onSkip?.(exercise.id);
  }

  function handleUndoSkip(e) {
    e.stopPropagation();
    skipped = false;
  }

  function getLastWeekActual(setIndex) {
    if (!prevWorkoutData || !prevWorkoutData.sets) return null;
    return prevWorkoutData.sets[setIndex] ?? null;
  }

  function handleSetComplete(setIndex, weight, reps, rpe) {
    onSetComplete?.(setIndex, weight, reps, rpe);
    const nextSet = sets[setIndex];
    if (nextSet?.rest) {
      onRestStart?.(nextSet.rest);
    }
  }

  function handleSetUndo(setIndex) {
    onSetUndo?.(setIndex);
  }

  const muscleGroupColors = {
    chest: '#F97316',
    back: '#84CC16',
    legs: '#22C55E',
    shoulders: '#8B5CF6',
    arms: '#F59E0B',
    core: '#EF4444',
    cardio: '#06B6D4'
  };

  let chipColor = $derived(
    muscleGroupColors[(exercise.muscleGroup ?? '').toLowerCase()] ?? '#6B6B75'
  );
</script>

<div
  class="rounded-2xl overflow-hidden transition-all duration-300"
  style="
    background: #161618;
    border: 1px solid {skipped ? '#F59E0B' : allDone ? '#22C55E' : '#2A2A2E'};
    opacity: {skipped ? 0.6 : 1};
    transition: border-color 0.4s ease, opacity 0.3s ease;
  "
>
  <!-- Header (always visible) -->
  <button
    onclick={onToggle}
    class="w-full flex items-center gap-3 px-4 py-3 text-left"
    style="min-height: 60px;"
  >
    <!-- Muscle group chip -->
    <span
      class="text-sm font-bold px-2 py-0.5 rounded-full shrink-0"
      style="background: {chipColor}22; color: {chipColor}; border: 1px solid {chipColor}44;"
    >
      {exercise.muscleGroup ?? 'Exercise'}
    </span>

    <!-- Name + SS badge -->
    <div class="flex-1 flex items-center gap-2 min-w-0">
      <span class="font-semibold truncate" style="color: #F1F1F3;">{exercise.name}</span>
      {#if exercise.supersetWith}
        <span
          class="text-sm font-bold px-1.5 py-0.5 rounded shrink-0"
          style="background: #8B5CF622; color: #8B5CF6; border: 1px solid #8B5CF644;"
        >SS</span>
      {/if}
      {#if skipped}
        <span
          class="text-sm font-bold px-2 py-0.5 rounded-full shrink-0"
          style="background: #F59E0B22; color: #F59E0B; border: 1px solid #F59E0B44;"
        >Skipped</span>
      {:else if allDone}
        <span
          class="text-sm font-bold px-2 py-0.5 rounded-full shrink-0"
          style="background: #22C55E22; color: #22C55E; border: 1px solid #22C55E44;"
        >✓ Complete</span>
      {/if}
      {#if weekIsDeload}
        <span
          class="text-sm font-bold px-2 py-0.5 rounded-full shrink-0"
          style="background: #F9731622; color: #F97316;"
        >DELOAD</span>
      {/if}
    </div>

    <!-- Skip / Undo Skip button -->
    {#if skipped}
      <button
        onclick={handleUndoSkip}
        class="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
        style="background: #F59E0B22; color: #F59E0B; min-height: 44px; display: flex; align-items: center;"
      >Undo</button>
    {:else}
      <button
        onclick={handleSkip}
        class="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
        style="background: #2A2A2E; color: #9B9BA4; min-height: 44px; display: flex; align-items: center;"
      >Skip</button>
    {/if}

    <!-- Completion dots -->
    {#if !skipped}
    <div class="flex items-center gap-1 shrink-0">
      {#each sets as s, i}
        <span
          class="rounded-full"
          style="
            width: 8px; height: 8px;
            background: {s.done ? '#22C55E' : i === currentSetIndex ? '#84CC16' : '#2A2A2E'};
            transition: background 0.3s ease;
          "
        ></span>
      {/each}
    </div>
    {/if}

    <!-- Chevron -->
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#6B6B75"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      style="transform: rotate({expanded ? 180 : 0}deg); transition: transform 0.25s ease; flex-shrink: 0;"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>

  <!-- Expanded content -->
  {#if expanded}
    <div class="px-4 pb-4 flex flex-col gap-3">
      <!-- Equipment info -->
      {#if exercise.equipment}
        <div class="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6B75" stroke-width="2">
            <path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4" />
          </svg>
          <span class="text-sm" style="color: #9B9BA4;">{exercise.equipment}</span>
        </div>
      {/if}

      <!-- Cue block -->
      {#if exercise.cue}
        <div
          class="rounded-xl p-3"
          style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2);"
        >
          <p class="text-sm leading-relaxed" style="color: #93C5FD;">{exercise.cue}</p>
        </div>
      {/if}

      <!-- Science tip (collapsible) with research citation -->
      {#if exercise.tip || exercise.scienceTip}
        <div class="rounded-xl overflow-hidden" style="border: 1px solid #2A2A2E;">
          <button
            onclick={() => (tipOpen = !tipOpen)}
            class="w-full flex items-center justify-between px-3 py-2.5 text-left"
            style="background: #0A0A0B;"
          >
            <span class="flex items-center gap-2">
              <span class="text-sm font-semibold" style="color: #6B6B75;">Research insight</span>
              <InfoTip
                text={exercise.scienceTip || exercise.tip}
                citation={exercise.scienceCitation || null}
                formula={exercise.scienceFormula || null}
              />
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B6B75"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="transform: rotate({tipOpen ? 180 : 0}deg); transition: transform 0.2s ease;"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {#if tipOpen}
            <div class="px-3 py-2.5" style="background: #0A0A0B; border-top: 1px solid #2A2A2E;">
              <p class="text-sm leading-relaxed" style="color: #9B9BA4;">{exercise.tip || exercise.scienceTip}</p>
              {#if exercise.scienceCitation}
                <p class="text-sm mt-2" style="color: #6B6B75;">{exercise.scienceCitation}</p>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Set rows -->
      <div class="flex flex-col gap-2">
        {#each sets as s, i}
          <SetRow
            set={s}
            {exerciseId}
            {weekIsDeload}
            lastWeekActual={getLastWeekActual(i)}
            recommendation={recommendations[exercise.id] ?? null}
            onComplete={(w, r, rpe) => handleSetComplete(i, w, r, rpe)}
            onUndo={() => handleSetUndo(i)}
            isActive={i === currentSetIndex}
          />
        {/each}
      </div>
    </div>
  {/if}
</div>
