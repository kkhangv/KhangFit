<script>
  let { value = $bindable([]), onchange } = $props();

  const presets = [
    { label: 'Full Gym', equipment: ['Barbell', 'Dumbbells', 'Cable Machine', 'Pull-up Bar', 'Bench', 'Resistance Bands', 'Kettlebells', 'Machines'] },
    { label: 'Home Dumbbells', equipment: ['Dumbbells', 'Bench', 'Pull-up Bar'] },
    { label: 'Bodyweight Only', equipment: ['Pull-up Bar'] },
  ];

  const allEquipment = ['Barbell', 'Dumbbells', 'Cable Machine', 'Pull-up Bar', 'Bench', 'Resistance Bands', 'Kettlebells', 'Machines'];

  let showCustom = $state(false);
  let activePreset = $state(null);

  function selectPreset(preset) {
    activePreset = preset.label;
    showCustom = false;
    value = [...preset.equipment];
    onchange?.(value);
  }

  function toggleCustom() {
    activePreset = 'Custom';
    showCustom = true;
  }

  function toggleEquipment(item) {
    if (value.includes(item)) {
      value = value.filter((e) => e !== item);
    } else {
      value = [...value, item];
    }
    activePreset = 'Custom';
    onchange?.(value);
  }
</script>

<div class="flex flex-col gap-3">
  <div class="flex flex-wrap gap-2">
    {#each presets as preset}
      <button
        type="button"
        onclick={() => selectPreset(preset)}
        class="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style="
          background: {activePreset === preset.label ? '#3B82F6' : '#1E1E22'};
          color: {activePreset === preset.label ? '#FFFFFF' : '#9B9BA4'};
          border: 1px solid {activePreset === preset.label ? '#3B82F6' : '#2A2A2E'};
        "
      >
        {preset.label}
      </button>
    {/each}
    <button
      type="button"
      onclick={toggleCustom}
      class="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
      style="
        background: {activePreset === 'Custom' ? '#3B82F6' : '#1E1E22'};
        color: {activePreset === 'Custom' ? '#FFFFFF' : '#9B9BA4'};
        border: 1px solid {activePreset === 'Custom' ? '#3B82F6' : '#2A2A2E'};
      "
    >
      Custom...
    </button>
  </div>

  {#if showCustom}
    <div class="grid grid-cols-2 gap-2 mt-1">
      {#each allEquipment as item}
        <button
          type="button"
          onclick={() => toggleEquipment(item)}
          class="px-3 py-2 rounded-lg text-sm text-left transition-all"
          style="
            background: {value.includes(item) ? 'rgba(59, 130, 246, 0.15)' : '#1E1E22'};
            color: {value.includes(item) ? '#3B82F6' : '#9B9BA4'};
            border: 1px solid {value.includes(item) ? '#3B82F6' : '#2A2A2E'};
          "
        >
          {value.includes(item) ? '✓ ' : ''}{item}
        </button>
      {/each}
    </div>
  {/if}

  {#if value.length > 0 && !showCustom}
    <p class="text-xs" style="color: #6B6B75;">
      Includes: {value.join(', ')}
    </p>
  {/if}
</div>
