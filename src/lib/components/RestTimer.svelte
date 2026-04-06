<script>
  let { seconds = 90, onComplete } = $props();

  let remaining = $state(seconds);
  let done = $state(false);
  let pulsing = $state(false);

  const RADIUS = 36;
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

<div
  class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 rounded-full shadow-2xl"
  style="background: #161618; border: 1px solid {done ? '#22C55E' : '#F97316'}; transition: border-color 0.3s ease;"
  class:pulse={pulsing}
>
  <!-- Circular progress ring -->
  <div class="relative flex items-center justify-center" style="width: 52px; height: 52px;">
    <svg width="52" height="52" style="transform: rotate(-90deg);">
      <!-- Track -->
      <circle
        cx="26"
        cy="26"
        r={RADIUS}
        fill="none"
        stroke="#2A2A2E"
        stroke-width="4"
      />
      <!-- Progress arc -->
      <circle
        cx="26"
        cy="26"
        r={RADIUS}
        fill="none"
        stroke={done ? '#22C55E' : '#F97316'}
        stroke-width="4"
        stroke-linecap="round"
        stroke-dasharray={CIRCUMFERENCE}
        stroke-dashoffset={dashOffset}
        style="transition: stroke-dashoffset 0.9s linear, stroke 0.3s ease;"
      />
    </svg>
    <!-- Time label inside ring -->
    <span
      class="absolute text-sm font-bold tabular-nums"
      style="color: {done ? '#22C55E' : '#F97316'}; transition: color 0.3s ease;"
    >
      {timeLabel}
    </span>
  </div>

  <!-- Label -->
  <div class="flex flex-col leading-tight">
    <span class="text-xs font-medium" style="color: #9B9BA4;">
      {done ? 'Rest done!' : 'Resting'}
    </span>
    <span class="text-sm font-semibold" style="color: #F1F1F3;">
      {done ? 'Resume when ready' : 'Take a breather'}
    </span>
  </div>

  <!-- Skip button -->
  {#if !done}
    <button
      onclick={skip}
      class="rounded-full px-3 py-1 text-xs font-semibold"
      style="background: #2A2A2E; color: #9B9BA4; min-height: 32px;"
    >
      Skip
    </button>
  {/if}
</div>

<style>
  @keyframes pulse-border {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
    50% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
  }
  .pulse {
    animation: pulse-border 0.6s ease-out 2;
  }
</style>
