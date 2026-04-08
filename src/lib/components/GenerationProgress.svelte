<script>
  let { estimatedSeconds = 20, label = 'Generating...', error = '', onRetry = null } = $props();

  let progress = $state(0);
  let startTime = $state(Date.now());
  let elapsed = $state(0);

  $effect(() => {
    if (error) return; // stop animating on error
    const interval = setInterval(() => {
      elapsed = (Date.now() - startTime) / 1000;
      const ratio = elapsed / estimatedSeconds;
      if (ratio < 0.5) {
        progress = ratio * 120; // 0→60% in first half
      } else if (ratio < 1) {
        progress = 60 + (ratio - 0.5) * 60; // 60→90% in second half
      } else {
        progress = 90 + Math.min((ratio - 1) * 2, 5); // crawl to 95%
      }
    }, 200);
    return () => clearInterval(interval);
  });
</script>

<div class="rounded-2xl p-6" style="background: #161618; border: 1px solid {error ? '#EF4444' : '#2A2A2E'};">
  {#if error}
    <!-- Error state -->
    <div class="flex flex-col items-center gap-3 text-center">
      <div class="w-12 h-12 rounded-full flex items-center justify-center" style="background: rgba(239,68,68,0.15);">
        <span class="text-xl">!</span>
      </div>
      <p class="text-sm font-semibold" style="color: #EF4444;">Something went wrong</p>
      <p class="text-xs" style="color: #9B9BA4;">{error}</p>
      {#if onRetry}
        <button onclick={onRetry}
          class="px-5 py-2.5 rounded-xl text-sm font-bold mt-1"
          style="background: #3B82F6; color: white;">
          Try Again
        </button>
      {/if}
    </div>
  {:else}
    <!-- Loading state -->
    <div class="flex flex-col items-center gap-3">
      <!-- Spinner -->
      <div class="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin"
        style="border-color: #3B82F6; border-top-color: transparent; border-width: 3px;"></div>

      <p class="text-sm font-semibold text-center" style="color: #F1F1F3;">{label}</p>

      <!-- Progress bar -->
      <div class="w-full rounded-full h-1.5 overflow-hidden" style="background: #2A2A2E;">
        <div class="h-full rounded-full transition-all duration-500"
          style="width: {Math.min(progress, 95)}%; background: #3B82F6;"></div>
      </div>

      <p class="text-xs" style="color: #6B6B75;">
        Usually takes about {estimatedSeconds} seconds
      </p>
    </div>

    <!-- Shimmer placeholders -->
    <div class="flex flex-col gap-2 mt-4">
      {#each [1, 2, 3] as _}
        <div class="rounded-xl h-12 shimmer" style="background: #1E1E22;"></div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .shimmer {
    background: linear-gradient(90deg, #1E1E22 25%, #2A2A2E 50%, #1E1E22 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
