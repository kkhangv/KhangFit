<script>
  import { getWeightSuggestion } from '$lib/rpeAdjust.js';

  let {
    currentWeight = 0,
    targetRPE = 8,
    targetReps = 8,
    actualReps = $bindable(0),
    isCardio = false,
    onSubmit
  } = $props();

  let options = $derived(isCardio
    ? [
        { rpe: 7, label: 'Easy', desc: 'Could keep going', color: '#22C55E' },
        { rpe: 8, label: 'Good', desc: 'Right effort', color: '#EAB308' },
        { rpe: 9, label: 'Hard', desc: 'Pushed it', color: '#F97316' },
      ]
    : [
        { rpe: 7, label: 'Could do 3 more', desc: 'Felt light', color: '#22C55E' },
        { rpe: 8, label: 'Could do 2 more', desc: 'Solid effort', color: '#EAB308' },
        { rpe: 9, label: 'Could do 1 more', desc: 'Very hard', color: '#F97316' },
        { rpe: 10, label: 'Nothing left', desc: 'Max effort', color: '#EF4444' },
      ]);

  function selectRPE(rpe) {
    const reps = actualReps || targetReps;
    const suggestion = getWeightSuggestion(currentWeight, rpe, targetRPE, targetReps, reps, isCardio);
    onSubmit?.({
      rpe,
      suggestedWeight: suggestion?.suggestedWeight ?? currentWeight,
      adjustment: suggestion?.adjustment ?? 'maintain'
    });
  }
</script>

<div class="flex flex-col gap-2">
  <p class="text-sm font-semibold text-center" style="color: #9B9BA4;">How hard was that?</p>
  <div class="flex flex-col gap-2">
    {#each options as opt (opt.rpe)}
      <button
        type="button"
        onclick={() => selectRPE(opt.rpe)}
        class="w-full flex items-center justify-between px-5 py-4 rounded-xl text-left transition-all active:scale-95"
        style="background: #1E1E22; border: 2px solid #2A2A2E;"
      >
        <div>
          <span class="text-base font-bold" style="color: {opt.color};">{opt.label}</span>
          <span class="text-sm ml-2" style="color: #6B6B75;">{opt.desc}</span>
        </div>
      </button>
    {/each}
  </div>
</div>
