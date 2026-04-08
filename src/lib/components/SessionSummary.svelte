<script>
  import StatCard from './StatCard.svelte';

  let { session, nextDay = null, onContinue } = $props();

  let totalVolume = $derived.by(() => {
    if (!session?.sets) return 0;
    return session.sets.reduce((sum, s) => {
      const w = s.weight === 'BW' ? 0 : Number(s.weight ?? 0);
      return sum + w * Number(s.reps ?? 0);
    }, 0);
  });

  let setsCompleted = $derived.by(() => {
    if (!session?.sets) return 0;
    return session.sets.filter((s) => s.done).length;
  });

  let totalSets = $derived(session?.sets?.length ?? 0);

  let duration = $derived.by(() => {
    if (!session?.startedAt || !session?.completedAt) return null;
    const diffMs = new Date(session.completedAt) - new Date(session.startedAt);
    const mins = Math.round(diffMs / 60000);
    return mins;
  });

  let prs = $derived(session?.prs ?? []);
  let adjustments = $derived(session?.adjustments ?? []);
</script>

<div class="flex flex-col gap-6 pb-8">
  <!-- Header -->
  <div class="text-center flex flex-col gap-1">
    <div
      class="mx-auto flex items-center justify-center rounded-full"
      style="width: 64px; height: 64px; background: rgba(34, 197, 94, 0.15); border: 2px solid #22C55E;"
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
    <h2 class="text-xl font-bold mt-2" style="color: #F1F1F3;">Workout Complete!</h2>
    {#if session?.name}
      <p class="text-sm" style="color: #9B9BA4;">{session.name}</p>
    {/if}
  </div>

  <!-- Stats grid -->
  <div class="grid grid-cols-2 gap-3">
    <StatCard
      label="Volume"
      value={totalVolume.toLocaleString()}
      unit="lbs"
    />
    <StatCard
      label="Sets"
      value="{setsCompleted}/{totalSets}"
    />
    {#if duration !== null}
      <StatCard
        label="Duration"
        value={duration}
        unit="min"
      />
    {/if}
    {#if prs.length > 0}
      <StatCard
        label="PRs Hit"
        value={prs.length}
      />
    {/if}
  </div>

  <!-- PRs list -->
  {#if prs.length > 0}
    <div class="flex flex-col gap-2">
      <h3 class="text-sm font-semibold uppercase tracking-wider" style="color: #F97316;">Personal Records</h3>
      <div class="flex flex-col gap-1.5">
        {#each prs as pr}
          <div
            class="flex items-center gap-3 rounded-xl px-4 py-3"
            style="background: rgba(249, 115, 22, 0.08); border: 1px solid rgba(249, 115, 22, 0.25);"
          >
            <span class="text-base">🏆</span>
            <span class="text-sm font-medium" style="color: #F1F1F3;">{pr.exercise}</span>
            <span class="ml-auto text-sm font-bold" style="color: #F97316;">{pr.value}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Suggested adjustments -->
  {#if adjustments.length > 0}
    <div class="flex flex-col gap-2">
      <h3 class="text-base font-semibold uppercase tracking-wider" style="color: #84CC16;">Next Session Suggestions</h3>
      <div class="flex flex-col gap-1.5">
        {#each adjustments as adj}
          <div
            class="flex items-center gap-3 rounded-xl px-4 py-3"
            style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2);"
          >
            <span class="text-sm font-medium flex-1" style="color: #F1F1F3;">{adj.exercise}</span>
            <span class="text-base font-semibold" style="color: #84CC16;">{adj.recommendation}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Next day teaser -->
  {#if nextDay}
    <div
      class="rounded-2xl px-4 py-4 flex flex-col gap-1"
      style="background: #161618; border: 1px solid #2A2A2E;"
    >
      <span class="text-sm font-medium uppercase tracking-wider" style="color: #6B6B75;">Up Next</span>
      <span class="text-base font-bold" style="color: #F1F1F3;">{nextDay.name}</span>
      {#if nextDay.subtitle}
        <span class="text-sm" style="color: #9B9BA4;">{nextDay.subtitle}</span>
      {/if}
    </div>
  {/if}

  <!-- Back to Dashboard -->
  <button
    onclick={onContinue}
    class="w-full rounded-xl py-4 text-base font-bold transition-all active:scale-98"
    style="background: #84CC16; color: #fff; min-height: 56px;"
  >
    Back to Dashboard
  </button>
</div>
