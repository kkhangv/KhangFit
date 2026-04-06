<script>
  import { enhance } from '$app/forms';

  let { data } = $props();

  let { name, weekInfo, last6Weeks, latestStats, dayStatuses, sessionsCompleted, nextDay, days, config } = $derived(data);

  const dayColors = {
    today:    { bg: 'rgba(59,130,246,0.12)', border: '#3B82F6',  label: 'TODAY',    labelColor: '#3B82F6'  },
    done:     { bg: 'rgba(34,197,94,0.08)',  border: '#22C55E',  label: 'DONE',     labelColor: '#22C55E'  },
    missed:   { bg: 'rgba(249,115,22,0.08)', border: '#F97316',  label: 'MISSED',   labelColor: '#F97316'  },
    upcoming: { bg: 'transparent',           border: '#2A2A2E',  label: 'UPCOMING', labelColor: '#9B9BA4'  }
  };

  const weekLabels = ['', 'Foundation', 'Progression', 'Overload', 'Peak', 'Deload'];

  // Volume chart max for scaling
  let maxVolume = $derived(
    last6Weeks.length > 0
      ? Math.max(...last6Weeks.map(w => w.totalVolume || 0), 1)
      : 1
  );

  // Stats last updated
  let statsDate = $derived(latestStats?.date
    ? new Date(latestStats.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null
  );

  let showWeekMenu = $state(false);
</script>

<svelte:head>
  <title>LIFT — Dashboard</title>
</svelte:head>

<div class="px-4 py-6 pb-24" style="max-width: 600px; margin: 0 auto;">

  <!-- Header -->
  <div class="flex items-start justify-between mb-6">
    <div>
      <h1 class="text-2xl font-black" style="color: #F1F1F3;">Hey {name}! 👋</h1>
      <p class="text-sm mt-0.5" style="color: #9B9BA4;">
        {weekInfo?.isDeload ? 'Deload week — recover hard.' : 'Time to make progress.'}
      </p>
    </div>
    <div class="flex flex-col items-end gap-1">
      <span
        class="text-xs font-bold px-3 py-1.5 rounded-full"
        style="background: {weekInfo?.isDeload ? 'rgba(249,115,22,0.15)' : 'rgba(59,130,246,0.15)'}; color: {weekInfo?.isDeload ? '#F97316' : '#3B82F6'};"
      >
        Week {weekInfo?.cycleWeek ?? '?'}
        {weekInfo?.isDeload ? ' — Deload' : ''}
      </span>
      <button
        onclick={() => (showWeekMenu = !showWeekMenu)}
        class="text-xs"
        style="color: #6B6B75;"
      >
        Adjust week ↓
      </button>
    </div>
  </div>

  <!-- Week override menu -->
  {#if showWeekMenu}
    <div class="mb-5 rounded-xl p-4" style="background: #161618; border: 1px solid #2A2A2E;">
      <p class="text-xs font-semibold mb-3" style="color: #9B9BA4;">OVERRIDE CURRENT WEEK</p>
      <div class="flex gap-2 flex-wrap">
        {#each [1,2,3,4,5] as w}
          <form method="POST" action="?/updateWeek" use:enhance>
            <input type="hidden" name="week" value={w} />
            <button
              type="submit"
              class="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style="
                background: {weekInfo?.cycleWeek === w ? '#3B82F6' : '#2A2A2E'};
                color: {weekInfo?.cycleWeek === w ? '#fff' : '#9B9BA4'};
              "
              onclick={() => (showWeekMenu = false)}
            >
              {w === 5 ? 'Deload' : `Wk ${w}`}
            </button>
          </form>
        {/each}
        {#if config?.weekOverride}
          <form method="POST" action="?/resetWeek" use:enhance>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg text-sm font-semibold"
              style="background: #2A2A2E; color: #F97316;"
              onclick={() => (showWeekMenu = false)}
            >
              Auto
            </button>
          </form>
        {/if}
      </div>
      <p class="text-xs mt-3" style="color: #6B6B75;">
        {config?.weekOverride ? 'Manual override active.' : 'Auto-calculating from start date.'}
      </p>
    </div>
  {/if}

  <!-- Deload banner -->
  {#if weekInfo?.isDeload}
    <div class="mb-5 rounded-xl px-4 py-3 flex items-center gap-3" style="background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.3);">
      <span style="font-size: 20px;">🔄</span>
      <div>
        <p class="text-sm font-bold" style="color: #F97316;">Deload Week</p>
        <p class="text-xs" style="color: #9B9BA4;">60% of working weights · 2 sets per exercise · Focus on recovery</p>
      </div>
    </div>
  {/if}

  <!-- Day cards grid -->
  <div class="grid grid-cols-2 gap-3 mb-8">
    {#each days as day}
      {@const status = dayStatuses[day.id] ?? 'upcoming'}
      {@const colors = dayColors[status]}
      <a
        href="/workout/{day.id.replace('day', '')}"
        class="rounded-2xl p-4 flex flex-col gap-2 transition-all duration-200 active:scale-95"
        style="background: {colors.bg}; border: 1px solid {colors.border}; text-decoration: none;"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold" style="color: {colors.labelColor};">{colors.label}</span>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full" style="background: rgba(255,255,255,0.05); color: #9B9BA4;">
            Day {day.id.replace('day', '')}
          </span>
        </div>
        <p class="text-sm font-bold leading-tight" style="color: #F1F1F3;">{day.name}</p>
        <p class="text-xs" style="color: #9B9BA4;">{day.exercises?.length ?? 0} exercises</p>
        {#if status === 'today'}
          <div class="mt-1 text-xs font-bold text-center py-1.5 rounded-lg" style="background: #3B82F6; color: #fff;">
            Start Workout →
          </div>
        {/if}
      </a>
    {/each}
  </div>

  <!-- Stats row -->
  <div class="grid grid-cols-3 gap-3 mb-8">
    <div class="rounded-xl p-3 flex flex-col gap-1" style="background: #161618; border: 1px solid #2A2A2E;">
      <span class="text-xs" style="color: #9B9BA4;">Sessions</span>
      <span class="text-2xl font-black" style="color: #F1F1F3;">{sessionsCompleted}</span>
      <span class="text-xs" style="color: #6B6B75;">this week</span>
    </div>
    <div class="rounded-xl p-3 flex flex-col gap-1" style="background: #161618; border: 1px solid #2A2A2E;">
      <span class="text-xs" style="color: #9B9BA4;">Cycle Week</span>
      <span class="text-2xl font-black" style="color: {weekInfo?.isDeload ? '#F97316' : '#3B82F6'};">
        {weekInfo?.cycleWeek ?? '—'}
      </span>
      <span class="text-xs" style="color: #6B6B75;">{weekLabels[weekInfo?.cycleWeek] ?? ''}</span>
    </div>
    <div class="rounded-xl p-3 flex flex-col gap-1" style="background: #161618; border: 1px solid #2A2A2E;">
      <span class="text-xs" style="color: #9B9BA4;">Next Up</span>
      <span class="text-sm font-black leading-tight" style="color: #F1F1F3;">
        {nextDay ? nextDay.name.split(' ')[0] : '—'}
      </span>
      <span class="text-xs" style="color: #6B6B75;">{nextDay ? `Day ${nextDay.id.replace('day','')}` : 'All done!'}</span>
    </div>
  </div>

  <!-- Volume chart -->
  {#if last6Weeks.length > 0}
    <div class="rounded-2xl p-5 mb-6" style="background: #161618; border: 1px solid #2A2A2E;">
      <p class="text-sm font-bold mb-4" style="color: #F1F1F3;">Volume — Last 6 Weeks</p>
      <div class="flex items-end gap-2" style="height: 80px;">
        {#each last6Weeks as week, i}
          {@const pct = maxVolume > 0 ? ((week.totalVolume || 0) / maxVolume) * 100 : 0}
          {@const isLast = i === last6Weeks.length - 1}
          <div class="flex-1 flex flex-col items-center gap-1.5" style="height: 100%;">
            <div class="w-full flex items-end" style="height: 64px;">
              <div
                class="w-full rounded-t-md transition-all duration-500"
                style="
                  height: {Math.max(pct, 4)}%;
                  background: {isLast ? '#3B82F6' : '#2A2A2E'};
                  min-height: 4px;
                "
              ></div>
            </div>
            <span class="text-xs" style="color: #6B6B75;">W{week.weekNum ?? (i + 1)}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Body stats -->
  <div class="rounded-2xl p-5 mb-6" style="background: #161618; border: 1px solid #2A2A2E;">
    <div class="flex items-center justify-between mb-4">
      <p class="text-sm font-bold" style="color: #F1F1F3;">Body Stats</p>
      <a href="/profile" class="text-xs font-semibold" style="color: #3B82F6;">Update →</a>
    </div>
    {#if latestStats}
      <div class="flex gap-4">
        {#if latestStats.bodyWeight}
          <div class="flex flex-col gap-0.5">
            <span class="text-2xl font-black" style="color: #F1F1F3;">{latestStats.bodyWeight}</span>
            <span class="text-xs" style="color: #9B9BA4;">lbs</span>
          </div>
        {/if}
        {#if latestStats.bodyFat}
          <div class="flex flex-col gap-0.5">
            <span class="text-2xl font-black" style="color: #F1F1F3;">{latestStats.bodyFat}%</span>
            <span class="text-xs" style="color: #9B9BA4;">body fat</span>
          </div>
        {/if}
        {#if latestStats.maxBench}
          <div class="flex flex-col gap-0.5">
            <span class="text-2xl font-black" style="color: #F1F1F3;">{latestStats.maxBench}</span>
            <span class="text-xs" style="color: #9B9BA4;">bench 1RM</span>
          </div>
        {/if}
      </div>
      {#if statsDate}
        <p class="text-xs mt-3" style="color: #6B6B75;">Updated {statsDate}</p>
      {/if}
    {:else}
      <p class="text-sm" style="color: #9B9BA4;">No stats recorded yet. <a href="/profile" style="color: #3B82F6;">Add them →</a></p>
    {/if}
  </div>

  <!-- Bottom nav -->
  <nav
    class="fixed bottom-0 left-0 right-0 flex items-center justify-around py-3 px-4"
    style="background: #161618; border-top: 1px solid #2A2A2E; z-index: 40;"
  >
    <a href="/dashboard" class="flex flex-col items-center gap-1 text-xs font-medium" style="color: #3B82F6;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
      Dashboard
    </a>
    {#if nextDay}
      <a
        href="/workout/{nextDay.id.replace('day', '')}"
        class="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold"
        style="background: #3B82F6; color: #fff;"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Train
      </a>
    {/if}
    <a href="/profile" class="flex flex-col items-center gap-1 text-xs font-medium" style="color: #9B9BA4;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      Profile
    </a>
  </nav>
</div>
