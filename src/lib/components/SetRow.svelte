<script>
  let {
    set,
    exerciseId,
    weekIsDeload = false,
    lastWeekActual = null,
    recommendation = null,
    onComplete,
    onUndo,
    isActive = false
  } = $props();

  // Local editable values (pre-seeded from set)
  let weight = $state(set.weight ?? 0);
  let reps = $state(set.reps ?? 10);
  let rpe = $state(set.rpe ?? null);
  let done = $state(set.done ?? false);

  const weightStep = 2.5;
  const repsStep = 1;
  const rpeOptions = [6, 7, 8, 9, 10];

  const techniqueColors = {
    'drop set': { bg: '#F97316', text: '#0A0A0B' },
    'rest-pause': { bg: '#3B82F6', text: '#F1F1F3' },
    superset: { bg: '#8B5CF6', text: '#F1F1F3' }
  };

  function isBW() {
    return set.weight === 'BW' || weight === 'BW';
  }

  function adjustWeight(delta) {
    if (isBW()) return;
    weight = Math.max(0, (Number(weight) || 0) + delta);
  }

  function adjustReps(delta) {
    reps = Math.max(0, (Number(reps) || 0) + delta);
  }

  function handleComplete() {
    done = true;
    onComplete?.(isBW() ? 'BW' : weight, reps, rpe);
  }

  function handleUndo() {
    done = false;
    onUndo?.();
  }

  let rowBg = $derived(
    done
      ? 'rgba(34, 197, 94, 0.08)'
      : isActive
      ? 'rgba(59, 130, 246, 0.07)'
      : 'transparent'
  );

  let rowBorder = $derived(
    done
      ? '1px solid rgba(34, 197, 94, 0.3)'
      : isActive
      ? '1px solid rgba(59, 130, 246, 0.25)'
      : '1px solid transparent'
  );
</script>

<div
  class="rounded-xl px-3 py-3 flex flex-col gap-2 transition-all duration-300"
  style="background: {rowBg}; border: {rowBorder}; opacity: {done || isActive ? 1 : 0.65};"
>
  <!-- Top row: set badge + inputs + check -->
  <div class="flex items-center gap-3">
    <!-- Set number badge -->
    <div
      class="flex items-center justify-center rounded-full text-xs font-bold shrink-0"
      style="width: 28px; height: 28px; background: {done ? '#22C55E' : '#2A2A2E'}; color: {done ? '#0A0A0B' : '#9B9BA4'};"
    >
      {done ? '✓' : set.setNum}
    </div>

    {#if done}
      <!-- Done state summary -->
      <div class="flex-1 flex items-center gap-2">
        <span class="text-base font-semibold" style="color: #22C55E;">
          {isBW() ? 'BW' : weight} × {reps}
        </span>
        {#if rpe}
          <span class="text-xs px-2 py-0.5 rounded-full" style="background: #2A2A2E; color: #9B9BA4;">
            RPE {rpe}
          </span>
        {/if}
      </div>
      <button
        onclick={handleUndo}
        class="text-xs px-3 py-1.5 rounded-lg"
        style="background: #2A2A2E; color: #9B9BA4; min-height: 44px;"
      >
        Undo
      </button>
    {:else}
      <!-- Inputs -->
      <div class="flex-1 flex items-end gap-2">
        <!-- Weight stepper -->
        <div class="flex flex-col gap-0.5 flex-1">
          {#if lastWeekActual}
            <span class="text-xs" style="color: #6B6B75;">
              Last: {lastWeekActual.weight ?? 'BW'}×{lastWeekActual.reps}
            </span>
          {/if}
          {#if recommendation}
            <span class="text-xs font-medium" style="color: #3B82F6;">{recommendation}</span>
          {/if}
          <div class="flex items-center rounded-lg overflow-hidden" style="background: #2A2A2E; height: 44px;">
            <button
              onclick={() => adjustWeight(-weightStep)}
              class="flex items-center justify-center text-lg font-bold"
              style="width: 40px; height: 44px; color: #9B9BA4; flex-shrink: 0;"
              disabled={isBW()}
            >−</button>
            <span class="flex-1 text-center text-sm font-semibold" style="color: #F1F1F3;">
              {isBW() ? 'BW' : weight}<span class="text-xs font-normal" style="color: #6B6B75;"> lbs</span>
            </span>
            <button
              onclick={() => adjustWeight(weightStep)}
              class="flex items-center justify-center text-lg font-bold"
              style="width: 40px; height: 44px; color: #9B9BA4; flex-shrink: 0;"
              disabled={isBW()}
            >+</button>
          </div>
        </div>

        <!-- Reps stepper -->
        <div class="flex flex-col gap-0.5" style="min-width: 90px;">
          {#if lastWeekActual || recommendation}
            <!-- spacer to align -->
            <span class="text-xs opacity-0">-</span>
            {#if recommendation}
              <span class="text-xs opacity-0">-</span>
            {/if}
          {/if}
          <div class="flex items-center rounded-lg overflow-hidden" style="background: #2A2A2E; height: 44px;">
            <button
              onclick={() => adjustReps(-repsStep)}
              class="flex items-center justify-center text-lg font-bold"
              style="width: 36px; height: 44px; color: #9B9BA4; flex-shrink: 0;"
            >−</button>
            <span class="flex-1 text-center text-sm font-semibold" style="color: #F1F1F3;">
              {reps}<span class="text-xs font-normal" style="color: #6B6B75;"> reps</span>
            </span>
            <button
              onclick={() => adjustReps(repsStep)}
              class="flex items-center justify-center text-lg font-bold"
              style="width: 36px; height: 44px; color: #9B9BA4; flex-shrink: 0;"
            >+</button>
          </div>
        </div>
      </div>

      <!-- Complete button -->
      <button
        onclick={handleComplete}
        class="flex items-center justify-center rounded-xl shrink-0 transition-all duration-200 active:scale-95"
        style="width: 48px; height: 48px; background: {isActive ? '#3B82F6' : '#2A2A2E'}; color: {isActive ? '#fff' : '#6B6B75'};"
        aria-label="Mark set complete"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
    {/if}
  </div>

  <!-- RPE selector (only when not done) -->
  {#if !done}
    <div class="flex items-center gap-1.5 pl-9">
      <span class="text-xs mr-1" style="color: #6B6B75;">RPE</span>
      {#each rpeOptions as r}
        <button
          onclick={() => (rpe = rpe === r ? null : r)}
          class="rounded-full text-xs font-semibold transition-all duration-150"
          style="
            min-width: 32px; height: 32px; padding: 0 6px;
            background: {rpe === r ? '#3B82F6' : '#2A2A2E'};
            color: {rpe === r ? '#fff' : '#9B9BA4'};
          "
        >
          {r}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Technique badges -->
  {#if set.technique && set.technique.length > 0}
    <div class="flex flex-wrap gap-1.5 pl-9">
      {#each (Array.isArray(set.technique) ? set.technique : [set.technique]) as t}
        {@const tc = techniqueColors[t] ?? { bg: '#2A2A2E', text: '#9B9BA4' }}
        <span
          class="text-xs font-semibold px-2 py-0.5 rounded-full"
          style="background: {tc.bg}; color: {tc.text};"
        >
          {t}
        </span>
      {/each}
      {#if set.techniqueNote}
        <span class="text-xs" style="color: #6B6B75;">{set.techniqueNote}</span>
      {/if}
    </div>
  {/if}

  <!-- Notes -->
  {#if set.weightNote}
    <p class="text-xs pl-9" style="color: #6B6B75;">{set.weightNote}</p>
  {/if}
</div>
