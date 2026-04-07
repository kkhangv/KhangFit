<script>
  let { expanded = $bindable(false) } = $props();

  const scale = [
    { rpe: 6, label: 'Light', desc: 'Could do 4+ more reps. Warm-up weight.', color: '#22C55E' },
    { rpe: 7, label: 'Moderate', desc: 'Could do 3 more reps. Light working set.', color: '#84CC16' },
    { rpe: 8, label: 'Solid', desc: 'Could do 2 more reps. Good working set.', color: '#EAB308' },
    { rpe: 9, label: 'Hard', desc: 'Could do 1 more rep. Very challenging.', color: '#F97316' },
    { rpe: 10, label: 'Max Effort', desc: 'Absolute failure. Could not do another rep.', color: '#EF4444' },
  ];
</script>

<div class="rounded-xl overflow-hidden" style="background: #1E1E22; border: 1px solid #2A2A2E;">
  <button
    type="button"
    onclick={() => expanded = !expanded}
    class="w-full px-4 py-3 flex items-center justify-between text-left"
  >
    <span class="text-sm font-semibold" style="color: #9B9BA4;">
      What's RPE?
    </span>
    <span class="text-xs" style="color: #6B6B75;">
      {expanded ? '▲' : '▼'}
    </span>
  </button>

  {#if expanded}
    <div class="px-4 pb-4 flex flex-col gap-3">
      <p class="text-xs leading-relaxed" style="color: #9B9BA4;">
        RPE (Rate of Perceived Exertion) measures how hard a set feels on a 1-10 scale.
        It helps adjust your weights in real-time so every set is productive.
      </p>

      <div class="flex flex-col gap-1.5">
        {#each scale as item}
          <div class="flex items-center gap-3 py-1.5 px-3 rounded-lg" style="background: #161618;">
            <span
              class="text-sm font-bold w-8 text-center"
              style="color: {item.color};"
            >
              {item.rpe}
            </span>
            <div class="flex-1">
              <span class="text-sm font-semibold" style="color: #F1F1F3;">{item.label}</span>
              <span class="text-xs ml-1.5" style="color: #6B6B75;">{item.desc}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
