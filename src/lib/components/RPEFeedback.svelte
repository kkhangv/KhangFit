<script>
  import { getWeightSuggestion } from '$lib/rpeAdjust.js';

  let {
    currentWeight = 0,
    targetRPE = 8,
    targetReps = 8,
    actualReps = $bindable(0),
    onSubmit
  } = $props();

  let selectedRPE = $state(null);
  let suggestion = $state(null);
  let showSuggestion = $state(false);

  const options = [
    { rpe: 7, label: 'Too Easy', icon: '🟢', color: '#22C55E' },
    { rpe: 8, label: 'Just Right', icon: '🟡', color: '#EAB308' },
    { rpe: 9, label: 'Hard', icon: '🟠', color: '#F97316' },
    { rpe: 10, label: 'Maxed Out', icon: '🔴', color: '#EF4444' },
  ];

  function selectRPE(rpe) {
    selectedRPE = rpe;
    const reps = actualReps || targetReps;
    suggestion = getWeightSuggestion(currentWeight, rpe, targetRPE, targetReps, reps);
    showSuggestion = true;
  }

  function confirm() {
    onSubmit?.({
      rpe: selectedRPE,
      suggestedWeight: suggestion?.suggestedWeight ?? currentWeight,
      adjustment: suggestion?.adjustment ?? 'maintain'
    });
    // Reset
    selectedRPE = null;
    suggestion = null;
    showSuggestion = false;
  }
</script>

<div class="flex flex-col gap-3">
  <!-- RPE buttons -->
  <div class="flex gap-2">
    {#each options as opt}
      <button
        type="button"
        onclick={() => selectRPE(opt.rpe)}
        class="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
        style="
          background: {selectedRPE === opt.rpe ? `${opt.color}20` : '#1E1E22'};
          color: {selectedRPE === opt.rpe ? opt.color : '#6B6B75'};
          border: 1px solid {selectedRPE === opt.rpe ? opt.color : '#2A2A2E'};
        "
      >
        <span class="text-base">{opt.icon}</span>
        <span>{opt.label}</span>
      </button>
    {/each}
  </div>

  <!-- Weight suggestion -->
  {#if showSuggestion && suggestion}
    <div
      class="flex items-center justify-between px-4 py-3 rounded-xl"
      style="
        background: {suggestion.adjustment === 'increase' ? 'rgba(34, 197, 94, 0.1)' : suggestion.adjustment === 'decrease' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)'};
        border: 1px solid {suggestion.adjustment === 'increase' ? '#22C55E44' : suggestion.adjustment === 'decrease' ? '#EF444444' : '#EAB30844'};
      "
    >
      <div class="flex flex-col">
        <span class="text-sm font-semibold" style="color: #F1F1F3;">
          Next set: {suggestion.suggestedWeight} lbs
        </span>
        <span class="text-xs" style="color: #9B9BA4;">
          {suggestion.message}
        </span>
      </div>
      <button
        type="button"
        onclick={confirm}
        class="px-4 py-2 rounded-lg text-sm font-bold"
        style="background: #3B82F6; color: white;"
      >
        Got it
      </button>
    </div>
  {/if}
</div>
