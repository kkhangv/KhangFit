<script>
  import InfoTip from './InfoTip.svelte';

  let {
    currentWeek = 1,
    autoWeek = 1,
    isDeload = false,
    onWeekChange,
    onReset
  } = $props();

  let autoMode = $state(true);
  let manualWeek = $state(currentWeek);

  let displayWeek = $derived(autoMode ? autoWeek : manualWeek);
  let showAutoHint = $derived(!autoMode && manualWeek !== autoWeek);

  function decrement() {
    if (autoMode) return;
    manualWeek = Math.max(1, manualWeek - 1);
    onWeekChange?.(manualWeek);
  }

  function increment() {
    if (autoMode) return;
    manualWeek = Math.min(5, manualWeek + 1);
    onWeekChange?.(manualWeek);
  }

  function toggleAuto() {
    autoMode = !autoMode;
    if (autoMode) {
      manualWeek = autoWeek;
      onWeekChange?.(autoWeek);
    }
  }

  function handleReset() {
    autoMode = true;
    manualWeek = autoWeek;
    onReset?.();
  }
</script>

<div class="flex flex-col gap-1.5">
  <div class="flex items-center gap-3 flex-wrap">
    <!-- Week badge / deload badge -->
    {#if isDeload}
      <span
        class="text-sm font-bold px-3 py-1.5 rounded-full"
        style="background: rgba(249, 115, 22, 0.15); color: #F97316; border: 1px solid rgba(249, 115, 22, 0.35);"
      >
        DELOAD WEEK
      </span>
      <InfoTip
        text="Deload weeks reduce weight to 60% and volume to 2 sets per exercise. This restores mTOR signaling responsiveness and prevents overreaching."
        citation="Ogasawara et al., 2013 — mTOR resensitization after ~1 week rest; Schoenfeld et al., 2024"
      />
    {:else}
      <span class="text-base font-bold" style="color: #F1F1F3;">
        Week {displayWeek} <span style="color: #6B6B75;">of 4</span>
      </span>
    {/if}

    <!-- Manual nav arrows (shown when not auto) -->
    {#if !autoMode}
      <div class="flex items-center gap-1">
        <button
          onclick={decrement}
          disabled={manualWeek <= 1}
          class="flex items-center justify-center rounded-lg transition-opacity"
          style="width: 36px; height: 36px; background: #2A2A2E; color: #9B9BA4; opacity: {manualWeek <= 1 ? 0.4 : 1};"
          aria-label="Previous week"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onclick={increment}
          disabled={manualWeek >= 5}
          class="flex items-center justify-center rounded-lg transition-opacity"
          style="width: 36px; height: 36px; background: #2A2A2E; color: #9B9BA4; opacity: {manualWeek >= 5 ? 0.4 : 1};"
          aria-label="Next week"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    {/if}

    <!-- Auto toggle -->
    <button
      onclick={toggleAuto}
      class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all"
      style="
        background: {autoMode ? 'rgba(16, 185, 129, 0.15)' : '#2A2A2E'};
        color: {autoMode ? '#10B981' : '#9B9BA4'};
        border: 1px solid {autoMode ? 'rgba(16, 185, 129, 0.4)' : '#2A2A2E'};
        min-height: 36px;
      "
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
      Auto
    </button>

    <!-- Reset button -->
    {#if !autoMode}
      <button
        onclick={handleReset}
        class="flex items-center justify-center rounded-lg text-lg"
        style="width: 36px; height: 36px; background: #2A2A2E; color: #9B9BA4;"
        aria-label="Reset to auto week"
        title="Reset to auto"
      >
        ↺
      </button>
    {/if}
  </div>

  <!-- Auto hint when manual differs -->
  {#if showAutoHint}
    <p class="text-sm" style="color: #6B6B75;">Auto: Week {autoWeek}</p>
  {/if}
</div>
