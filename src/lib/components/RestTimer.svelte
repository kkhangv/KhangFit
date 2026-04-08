<script>
  let { seconds = 90, onComplete, inline = false, nextLabel = '' } = $props();

  let remaining = $state(seconds);
  let done = $state(false);
  let pulsing = $state(false);

  const RADIUS = inline ? 50 : 36;
  const SIZE = inline ? 120 : 52;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  let progress = $derived(remaining / seconds);
  let dashOffset = $derived(CIRCUMFERENCE * (1 - progress));

  let minutes = $derived(Math.floor(remaining / 60));
  let secs = $derived(remaining % 60);
  let timeLabel = $derived(
    `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  );

  let intervalId;

  $effect(() => {
    remaining = seconds;
    done = false;
    pulsing = false;

    intervalId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        remaining = 0;
        clearInterval(intervalId);
        done = true;
        pulsing = true;
        setTimeout(() => {
          pulsing = false;
          onComplete?.();
        }, 1200);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  });

  function skip() {
    clearInterval(intervalId);
    done = true;
    onComplete?.();
  }
</script>

{#if inline}
  <!-- Inline mode: centered in the page flow -->
  <div class="flex flex-col items-center gap-4 py-6">
    <p class="text-sm font-semibold" style="color: #9B9BA4;">
      {done ? 'Rest complete!' : 'Take a breather'}
    </p>

    <!-- Large circular timer -->
    <div class="relative flex items-center justify-center" style="width: {SIZE}px; height: {SIZE}px;" class:pulse={pulsing}>
      <svg width={SIZE} height={SIZE} style="transform: rotate(-90deg);">
        <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none" stroke="#2A2A2E" stroke-width="5" />
        <circle
          cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none"
          stroke={done ? '#22C55E' : '#F97316'}
          stroke-width="5" stroke-linecap="round"
          stroke-dasharray={CIRCUMFERENCE}
          stroke-dashoffset={dashOffset}
          style="transition: stroke-dashoffset 0.9s linear, stroke 0.3s ease;"
        />
      </svg>
      <span class="absolute text-2xl font-black tabular-nums" style="color: {done ? '#22C55E' : '#F97316'};">
        {timeLabel}
      </span>
    </div>

    {#if nextLabel}
      <p class="text-xs" style="color: #6B6B75;">Next: {nextLabel}</p>
    {/if}

    {#if !done}
      <button onclick={skip}
        class="px-6 py-3 rounded-xl text-sm font-bold"
        style="background: #2A2A2E; color: #9B9BA4;">
        Skip Rest
      </button>
    {/if}
  </div>
{:else}
  <!-- Fixed position (legacy) -->
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 rounded-full shadow-2xl"
    style="background: #161618; border: 1px solid {done ? '#22C55E' : '#F97316'};"
    class:pulse={pulsing}
  >
    <div class="relative flex items-center justify-center" style="width: 52px; height: 52px;">
      <svg width="52" height="52" style="transform: rotate(-90deg);">
        <circle cx="26" cy="26" r="36" fill="none" stroke="#2A2A2E" stroke-width="4" />
        <circle cx="26" cy="26" r="36" fill="none"
          stroke={done ? '#22C55E' : '#F97316'}
          stroke-width="4" stroke-linecap="round"
          stroke-dasharray={CIRCUMFERENCE}
          stroke-dashoffset={dashOffset}
          style="transition: stroke-dashoffset 0.9s linear, stroke 0.3s ease;"
        />
      </svg>
      <span class="absolute text-sm font-bold tabular-nums" style="color: {done ? '#22C55E' : '#F97316'};">
        {timeLabel}
      </span>
    </div>
    <div class="flex flex-col leading-tight">
      <span class="text-xs font-medium" style="color: #9B9BA4;">{done ? 'Rest done!' : 'Resting'}</span>
      <span class="text-sm font-semibold" style="color: #F1F1F3;">{done ? 'Resume when ready' : 'Take a breather'}</span>
    </div>
    {#if !done}
      <button onclick={skip} class="rounded-full px-3 py-1 text-xs font-semibold"
        style="background: #2A2A2E; color: #9B9BA4; min-height: 32px;">Skip</button>
    {/if}
  </div>
{/if}

<style>
  @keyframes pulse-border {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
    50% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
  }
  .pulse {
    animation: pulse-border 0.6s ease-out 2;
  }
</style>
