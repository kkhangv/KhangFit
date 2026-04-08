<script>
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  let { username, name, createdAt, config, latestStats, statsHistory } = $derived(data);

  let editingStats  = $state(false);
  let editingConfig = $state(false);

  // Editable stat fields (pre-seeded)
  let bw     = $state(latestStats?.bodyWeight ?? '');
  let bf     = $state(latestStats?.bodyFat    ?? '');
  let bench  = $state(latestStats?.maxBench   ?? '');
  let ohp    = $state(latestStats?.maxOHP     ?? '');
  let snotes = $state(latestStats?.notes      ?? '');

  // Config fields
  let startDate    = $state(config?.startDate    ?? '');
  let weekOverride = $state(config?.weekOverride  ?? '');
  let hasPeloton   = $state(config?.hasPeloton   ?? false);

  let memberSince = $derived(
    createdAt
      ? new Date(createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : null
  );

  // Body weight mini chart data
  let chartData = $derived(
    statsHistory
      .filter(s => s.bodyWeight)
      .slice(-10)
      .map(s => ({ w: s.bodyWeight, date: s.date }))
  );

  let maxW = $derived(chartData.length ? Math.max(...chartData.map(d => d.w)) : 0);
  let minW = $derived(chartData.length ? Math.min(...chartData.map(d => d.w)) : 0);

  function chartY(w) {
    if (maxW === minW) return 30;
    return 60 - ((w - minW) / (maxW - minW)) * 50;
  }

  let polyPoints = $derived(
    chartData.length > 1
      ? chartData.map((d, i) => `${(i / (chartData.length - 1)) * 260},${chartY(d.w)}`).join(' ')
      : ''
  );

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
</script>

<svelte:head>
  <title>LIFT — Profile</title>
</svelte:head>

<div class="px-4 py-6 pb-24" style="max-width: 600px; margin: 0 auto;">

  <!-- Header -->
  <div class="flex items-center gap-3 mb-8">
    <div
      class="flex items-center justify-center rounded-full font-black text-xl"
      style="width: 56px; height: 56px; background: #10B981; color: #fff; flex-shrink: 0;"
    >
      {name.charAt(0).toUpperCase()}
    </div>
    <div>
      <h1 class="text-2xl font-black" style="color: #F1F1F3;">{name}</h1>
      <p class="text-base" style="color: #9B9BA4;">@{username}</p>
      {#if memberSince}
        <p class="text-xs" style="color: #6B6B75;">Member since {memberSince}</p>
      {/if}
    </div>
  </div>

  <!-- Success message -->
  {#if form?.success}
    <div class="mb-5 rounded-xl px-4 py-3 text-base font-medium" style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); color: #22C55E;">
      {form.action === 'updateStats' ? 'Stats updated!' : 'Settings saved!'}
    </div>
  {/if}

  <!-- Body Stats -->
  <section class="rounded-2xl p-5 mb-5" style="background: #161618; border: 1px solid #2A2A2E;">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold" style="color: #F1F1F3;">Body Stats</h2>
      <button
        onclick={() => (editingStats = !editingStats)}
        class="text-xs font-semibold px-3 py-1.5 rounded-lg"
        style="background: #2A2A2E; color: #10B981;"
      >
        {editingStats ? 'Cancel' : 'Edit'}
      </button>
    </div>

    {#if editingStats}
      <form
        method="POST"
        action="?/updateStats"
        use:enhance={({ formData }) => {
          return async ({ update }) => {
            await update({ reset: false });
            editingStats = false;
          };
        }}
        class="flex flex-col gap-4"
      >
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium" style="color: #9B9BA4;">Body Weight (lbs)</label>
            <input
              name="bodyWeight"
              type="number"
              bind:value={bw}
              placeholder="175"
              step="0.5"
              inputmode="decimal"
              pattern="[0-9]*"
              class="w-full rounded-xl px-3 py-2.5 text-base outline-none"
              style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium" style="color: #9B9BA4;">Body Fat %</label>
            <input
              name="bodyFat"
              type="number"
              bind:value={bf}
              placeholder="18"
              step="0.5"
              inputmode="decimal"
              pattern="[0-9]*"
              class="w-full rounded-xl px-3 py-2.5 text-base outline-none"
              style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium" style="color: #9B9BA4;">Max Bench (lbs)</label>
            <input
              name="maxBench"
              type="number"
              bind:value={bench}
              placeholder="225"
              step="2.5"
              inputmode="decimal"
              pattern="[0-9]*"
              class="w-full rounded-xl px-3 py-2.5 text-base outline-none"
              style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium" style="color: #9B9BA4;">Seated DB Press (lbs)</label>
            <input
              name="maxOHP"
              type="number"
              bind:value={ohp}
              placeholder="55"
              step="2.5"
              inputmode="decimal"
              pattern="[0-9]*"
              class="w-full rounded-xl px-3 py-2.5 text-base outline-none"
              style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
            />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium" style="color: #9B9BA4;">Notes</label>
          <textarea
            name="notes"
            bind:value={snotes}
            placeholder="Any notes…"
            rows="2"
            class="w-full rounded-xl px-3 py-2.5 text-base outline-none resize-none"
            style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
          ></textarea>
        </div>
        <button
          type="submit"
          class="w-full py-3 rounded-xl text-base font-bold"
          style="background: #10B981; color: #fff;"
        >
          Save Stats
        </button>
      </form>
    {:else}
      <!-- Display mode -->
      {#if latestStats}
        <div class="grid grid-cols-2 gap-4 mb-3">
          {#if latestStats.bodyWeight}
            <div>
              <p class="text-2xl font-black" style="color: #F1F1F3;">{latestStats.bodyWeight} <span class="text-sm font-normal" style="color: #9B9BA4;">lbs</span></p>
              <p class="text-xs" style="color: #6B6B75;">Body weight</p>
            </div>
          {/if}
          {#if latestStats.bodyFat}
            <div>
              <p class="text-2xl font-black" style="color: #F1F1F3;">{latestStats.bodyFat}<span class="text-sm font-normal" style="color: #9B9BA4;">%</span></p>
              <p class="text-xs" style="color: #6B6B75;">Body fat</p>
            </div>
          {/if}
          {#if latestStats.maxBench}
            <div>
              <p class="text-2xl font-black" style="color: #F1F1F3;">{latestStats.maxBench} <span class="text-sm font-normal" style="color: #9B9BA4;">lbs</span></p>
              <p class="text-xs" style="color: #6B6B75;">Max bench</p>
            </div>
          {/if}
          {#if latestStats.maxOHP}
            <div>
              <p class="text-2xl font-black" style="color: #F1F1F3;">{latestStats.maxOHP} <span class="text-sm font-normal" style="color: #9B9BA4;">lbs</span></p>
              <p class="text-xs" style="color: #6B6B75;">DB press</p>
            </div>
          {/if}
        </div>
        {#if latestStats.date}
          <p class="text-xs" style="color: #6B6B75;">Updated {formatDate(latestStats.date)}</p>
        {/if}
        {#if latestStats.notes}
          <p class="text-xs mt-2 italic" style="color: #9B9BA4;">{latestStats.notes}</p>
        {/if}
      {:else}
        <p class="text-base" style="color: #9B9BA4;">No stats yet. Tap Edit to add them.</p>
      {/if}
    {/if}
  </section>

  <!-- Body weight history chart -->
  {#if chartData.length > 1}
    <section class="rounded-2xl p-5 mb-5" style="background: #161618; border: 1px solid #2A2A2E;">
      <h2 class="text-base font-bold mb-4" style="color: #F1F1F3;">Weight History</h2>
      <svg viewBox="0 0 260 70" class="w-full" style="overflow: visible;">
        <!-- Grid lines -->
        {#each [0, 1, 2] as i}
          <line x1="0" y1={10 + i * 25} x2="260" y2={10 + i * 25} stroke="#2A2A2E" stroke-width="1"/>
        {/each}
        <!-- Line -->
        <polyline
          points={polyPoints}
          fill="none"
          stroke="#10B981"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- Dots -->
        {#each chartData as d, i}
          <circle
            cx={(i / (chartData.length - 1)) * 260}
            cy={chartY(d.w)}
            r="3"
            fill="#10B981"
          />
        {/each}
      </svg>
      <div class="flex justify-between mt-1">
        <span class="text-xs" style="color: #6B6B75;">{formatDate(chartData[0]?.date)}</span>
        <span class="text-xs" style="color: #6B6B75;">{formatDate(chartData[chartData.length - 1]?.date)}</span>
      </div>
    </section>
  {/if}

  <!-- Program settings -->
  <section class="rounded-2xl p-5 mb-5" style="background: #161618; border: 1px solid #2A2A2E;">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold" style="color: #F1F1F3;">Program Settings</h2>
      <button
        onclick={() => (editingConfig = !editingConfig)}
        class="text-xs font-semibold px-3 py-1.5 rounded-lg"
        style="background: #2A2A2E; color: #10B981;"
      >
        {editingConfig ? 'Cancel' : 'Edit'}
      </button>
    </div>

    {#if editingConfig}
      <form
        method="POST"
        action="?/updateConfig"
        use:enhance={({ formData }) => {
          return async ({ update }) => {
            await update({ reset: false });
            editingConfig = false;
          };
        }}
        class="flex flex-col gap-4"
      >
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium" style="color: #9B9BA4;">Program Start Date</label>
          <input
            name="startDate"
            type="date"
            bind:value={startDate}
            class="w-full rounded-xl px-3 py-2.5 text-base outline-none"
            style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3; color-scheme: dark;"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium" style="color: #9B9BA4;">Week Override <span style="color: #6B6B75;">(blank = auto)</span></label>
          <input
            name="weekOverride"
            type="number"
            bind:value={weekOverride}
            placeholder="1–5 (blank for auto)"
            min="1" max="5"
            inputmode="numeric"
            pattern="[0-9]*"
            class="w-full rounded-xl px-3 py-2.5 text-base outline-none"
            style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
          />
        </div>
        <label class="flex items-center gap-3 cursor-pointer">
          <div class="relative">
            <input
              name="hasPeloton"
              type="checkbox"
              bind:checked={hasPeloton}
              class="sr-only"
            />
            <div
              class="w-10 h-6 rounded-full transition-all"
              style="background: {hasPeloton ? '#10B981' : '#2A2A2E'};"
            ></div>
            <div
              class="absolute top-1 left-1 w-4 h-4 rounded-full transition-all"
              style="background: #fff; transform: translateX({hasPeloton ? '16px' : '0'});"
            ></div>
          </div>
          <span class="text-base" style="color: #F1F1F3;">Include Peloton reminders</span>
        </label>
        <button
          type="submit"
          class="w-full py-3 rounded-xl text-base font-bold"
          style="background: #10B981; color: #fff;"
        >
          Save Settings
        </button>
      </form>
    {:else}
      <div class="flex flex-col gap-2">
        <div class="flex justify-between">
          <span class="text-base" style="color: #9B9BA4;">Start date</span>
          <span class="text-base font-semibold" style="color: #F1F1F3;">{formatDate(config?.startDate)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-base" style="color: #9B9BA4;">Week control</span>
          <span class="text-base font-semibold" style="color: {config?.weekOverride ? '#F97316' : '#22C55E'};">
            {config?.weekOverride ? `Manual (Week ${config.weekOverride})` : 'Auto'}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-base" style="color: #9B9BA4;">Peloton</span>
          <span class="text-base font-semibold" style="color: {config?.hasPeloton ? '#10B981' : '#9B9BA4'};">
            {config?.hasPeloton ? 'Enabled' : 'Off'}
          </span>
        </div>
      </div>
    {/if}
  </section>

  <!-- Logout -->
  <section class="rounded-2xl p-5" style="background: #161618; border: 1px solid #2A2A2E;">
    <form method="POST" action="?/logout" use:enhance>
      <button
        type="submit"
        class="w-full py-3 rounded-xl text-base font-bold transition-all duration-200 active:scale-95"
        style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #F87171;"
      >
        Log Out
      </button>
    </form>
  </section>

</div>

<!-- Bottom nav -->
<nav
  class="fixed bottom-0 left-0 right-0 flex items-center justify-around py-3 px-4"
  style="background: #161618; border-top: 1px solid #2A2A2E; z-index: 40;"
>
  <a href="/dashboard" class="flex flex-col items-center gap-1 text-xs font-medium" style="color: #9B9BA4;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
    Dashboard
  </a>
  <a href="/profile" class="flex flex-col items-center gap-1 text-xs font-medium" style="color: #10B981;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
    Profile
  </a>
</nav>
