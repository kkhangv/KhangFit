<script>
  import ProgressBar from './ProgressBar.svelte';

  let {
    day,
    status = 'upcoming',
    completionPercent = 0,
    completedAt = null,
    weekIsDeload = false,
    onClick
  } = $props();

  let formattedTime = $derived.by(() => {
    if (!completedAt) return null;
    const d = new Date(completedAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let dayLabel = $derived(
    typeof day.dayOfWeek === 'number' ? dayLabels[day.dayOfWeek] : (day.dayOfWeek ?? '')
  );

  let borderColor = $derived(
    status === 'today'
      ? '#84CC16'
      : status === 'done'
      ? '#22C55E'
      : '#2A2A2E'
  );

  let glowStyle = $derived(
    status === 'today'
      ? 'box-shadow: 0 0 0 1px #84CC16, 0 0 20px rgba(16, 185, 129, 0.25);'
      : status === 'done'
      ? 'box-shadow: 0 0 0 1px #22C55E44;'
      : ''
  );
</script>

<button
  onclick={onClick}
  class="w-full text-left rounded-2xl overflow-hidden flex flex-col relative transition-all duration-300 active:scale-98"
  style="
    background: #161618;
    border: 1px solid {borderColor};
    {glowStyle}
    opacity: {status === 'missed' ? 0.5 : 1};
    min-height: 100px;
  "
>
  <!-- Deload badge overlay -->
  {#if weekIsDeload}
    <div
      class="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full z-10"
      style="background: rgba(249, 115, 22, 0.2); color: #F97316; border: 1px solid rgba(249, 115, 22, 0.4);"
    >
      DELOAD
    </div>
  {/if}

  <!-- Card body -->
  <div class="flex-1 px-4 pt-4 pb-3 flex flex-col gap-1">
    <!-- Day of week label -->
    <span class="text-sm font-medium uppercase tracking-wider" style="color: #6B6B75;">{dayLabel}</span>

    <!-- Day name -->
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-base font-bold" style="color: #F1F1F3;">{day.name}</span>

      <!-- Status badges -->
      {#if status === 'done'}
        <span
          class="text-sm font-semibold px-2 py-0.5 rounded-full"
          style="background: rgba(34, 197, 94, 0.15); color: #22C55E;"
        >✓ Completed</span>
      {:else if status === 'missed'}
        <span
          class="text-sm font-semibold px-2 py-0.5 rounded-full"
          style="background: rgba(239, 68, 68, 0.15); color: #EF4444;"
        >Missed</span>
      {:else if status === 'today'}
        <span
          class="text-sm font-semibold px-2 py-0.5 rounded-full"
          style="background: rgba(16, 185, 129, 0.15); color: #84CC16;"
        >Today</span>
      {/if}
    </div>

    <!-- Subtitle / workout type -->
    {#if day.subtitle}
      <span class="text-sm" style="color: #9B9BA4;">{day.subtitle}</span>
    {/if}

    <!-- Completed at time -->
    {#if status === 'done' && formattedTime}
      <span class="text-sm" style="color: #6B6B75;">Completed at {formattedTime}</span>
    {/if}

    <!-- CTA for today -->
    {#if status === 'today'}
      <span class="text-base font-semibold mt-1" style="color: #84CC16;">Start Workout →</span>
    {/if}
  </div>

  <!-- Progress bar at bottom -->
  <div class="px-4 pb-3">
    <ProgressBar
      value={completionPercent}
      color={status === 'done' ? '#22C55E' : status === 'today' ? '#84CC16' : '#6B6B75'}
    />
  </div>
</button>
