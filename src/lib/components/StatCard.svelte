<script>
  let { label = '', value = '', unit = '', trend = '', trendGood = true } = $props();

  let trendPositive = $derived(typeof trend === 'string' && trend.startsWith('+'));
  let trendColor = $derived(
    trendGood
      ? trendPositive ? '#22C55E' : '#EF4444'
      : trendPositive ? '#EF4444' : '#22C55E'
  );
</script>

<div
  class="rounded-2xl px-4 py-4 flex flex-col gap-2"
  style="background: #161618; border: 1px solid #2A2A2E;"
>
  <span class="text-xs font-medium uppercase tracking-wider" style="color: #6B6B75;">{label}</span>

  <div class="flex items-end gap-2 flex-wrap">
    <span class="text-3xl font-bold leading-none" style="color: #F1F1F3;">{value}</span>
    {#if unit}
      <span class="text-base font-medium pb-0.5" style="color: #9B9BA4;">{unit}</span>
    {/if}
  </div>

  {#if trend}
    <div class="flex items-center">
      <span
        class="text-xs font-semibold px-2 py-0.5 rounded-full"
        style="background: {trendColor}22; color: {trendColor}; border: 1px solid {trendColor}44;"
      >
        {trend}
      </span>
    </div>
  {/if}
</div>
