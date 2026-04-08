<script>
  let { value = 0, label = '', color = '#84CC16' } = $props();

  let clampedValue = $derived(Math.min(100, Math.max(0, value)));
</script>

<div class="flex items-center gap-3 w-full">
  <div
    class="flex-1 rounded-full overflow-hidden"
    style="height: 6px; background: #2A2A2E;"
    role="progressbar"
    aria-valuenow={clampedValue}
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div
      class="h-full rounded-full"
      style="width: {clampedValue}%; background: {color}; transition: width 0.4s ease;"
    ></div>
  </div>
  {#if label}
    <span class="text-sm shrink-0" style="color: #9B9BA4; min-width: 2.5rem; text-align: right;">
      {label}
    </span>
  {/if}
</div>
