<script>
  let { exercises = [], onSubmit } = $props();

  const energyEmojis = ['😴', '😕', '😐', '🙂', '💪'];
  const difficultyLabels = ['Too Easy', 'Easy', 'Perfect', 'Hard', 'Too Hard'];
  const sorenessLabels = ['None', 'Mild', 'Moderate', 'Sore', 'Very Sore'];

  let energyLevel = $state(null);
  let overallDifficulty = $state(null);
  let soreness = $state(null);
  let notes = $state('');
  let exerciseFeedback = $state(
    Object.fromEntries((exercises ?? []).map((ex) => [ex.id, null]))
  );

  function setExFeedback(id, val) {
    exerciseFeedback = {
      ...exerciseFeedback,
      [id]: exerciseFeedback[id] === val ? null : val
    };
  }

  let canSubmit = $derived(
    energyLevel !== null && overallDifficulty !== null && soreness !== null
  );

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit?.({
      energyLevel,
      overallDifficulty,
      soreness,
      notes,
      exerciseFeedback
    });
  }
</script>

<div
  class="rounded-2xl p-5 flex flex-col gap-6"
  style="background: #161618; border: 1px solid #2A2A2E;"
>
  <h2 class="text-lg font-bold" style="color: #F1F1F3;">How did that feel?</h2>

  <!-- Energy Level -->
  <section class="flex flex-col gap-3">
    <label class="text-sm font-semibold" style="color: #9B9BA4;">Energy Level</label>
    <div class="flex items-center gap-2">
      {#each energyEmojis as emoji, i}
        <button
          onclick={() => (energyLevel = i + 1)}
          class="flex items-center justify-center rounded-xl transition-all duration-150 text-2xl"
          style="
            width: 52px; height: 52px; flex: 1;
            background: {energyLevel === i + 1 ? 'rgba(59, 130, 246, 0.2)' : '#2A2A2E'};
            border: 1px solid {energyLevel === i + 1 ? '#3B82F6' : 'transparent'};
          "
          aria-label="Energy {i + 1}"
        >
          {emoji}
        </button>
      {/each}
    </div>
  </section>

  <!-- Overall Difficulty -->
  <section class="flex flex-col gap-3">
    <label class="text-sm font-semibold" style="color: #9B9BA4;">Overall Difficulty</label>
    <div class="flex flex-col gap-2">
      {#each difficultyLabels as label, i}
        <button
          onclick={() => (overallDifficulty = i + 1)}
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-150"
          style="
            background: {overallDifficulty === i + 1 ? 'rgba(59, 130, 246, 0.15)' : '#2A2A2E'};
            border: 1px solid {overallDifficulty === i + 1 ? '#3B82F6' : 'transparent'};
            min-height: 48px;
          "
        >
          <span
            class="text-sm font-semibold shrink-0"
            style="color: {overallDifficulty === i + 1 ? '#3B82F6' : '#9B9BA4'};"
          >{i + 1}</span>
          <span class="text-sm" style="color: {overallDifficulty === i + 1 ? '#F1F1F3' : '#9B9BA4'};">{label}</span>
        </button>
      {/each}
    </div>
  </section>

  <!-- Soreness -->
  <section class="flex flex-col gap-3">
    <label class="text-sm font-semibold" style="color: #9B9BA4;">Soreness</label>
    <div class="flex items-center gap-2">
      {#each sorenessLabels as sl, i}
        <button
          onclick={() => (soreness = i + 1)}
          class="flex-1 rounded-xl py-2 text-xs font-semibold transition-all duration-150 text-center"
          style="
            background: {soreness === i + 1 ? 'rgba(239, 68, 68, 0.2)' : '#2A2A2E'};
            color: {soreness === i + 1 ? '#EF4444' : '#9B9BA4'};
            border: 1px solid {soreness === i + 1 ? '#EF4444' : 'transparent'};
            min-height: 52px;
          "
        >
          {sl}
        </button>
      {/each}
    </div>
  </section>

  <!-- Per-exercise feedback -->
  {#if exercises && exercises.length > 0}
    <section class="flex flex-col gap-3">
      <label class="text-sm font-semibold" style="color: #9B9BA4;">Exercise Feedback</label>
      <div class="flex flex-col gap-2">
        {#each exercises as ex}
          <div
            class="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style="background: #0A0A0B; border: 1px solid #2A2A2E;"
          >
            <span class="flex-1 text-sm" style="color: #F1F1F3;">{ex.name}</span>
            <div class="flex gap-2">
              <button
                onclick={() => setExFeedback(ex.id, 'too_easy')}
                class="rounded-full px-3 py-1 text-xs font-semibold transition-all"
                style="
                  background: {exerciseFeedback[ex.id] === 'too_easy' ? 'rgba(34, 197, 94, 0.2)' : '#2A2A2E'};
                  color: {exerciseFeedback[ex.id] === 'too_easy' ? '#22C55E' : '#9B9BA4'};
                  border: 1px solid {exerciseFeedback[ex.id] === 'too_easy' ? '#22C55E' : 'transparent'};
                  min-height: 32px;
                "
              >Too Easy</button>
              <button
                onclick={() => setExFeedback(ex.id, 'too_hard')}
                class="rounded-full px-3 py-1 text-xs font-semibold transition-all"
                style="
                  background: {exerciseFeedback[ex.id] === 'too_hard' ? 'rgba(239, 68, 68, 0.2)' : '#2A2A2E'};
                  color: {exerciseFeedback[ex.id] === 'too_hard' ? '#EF4444' : '#9B9BA4'};
                  border: 1px solid {exerciseFeedback[ex.id] === 'too_hard' ? '#EF4444' : 'transparent'};
                  min-height: 32px;
                "
              >Too Hard</button>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Notes -->
  <section class="flex flex-col gap-2">
    <label class="text-sm font-semibold" for="feedback-notes" style="color: #9B9BA4;">Notes (optional)</label>
    <textarea
      id="feedback-notes"
      bind:value={notes}
      placeholder="Anything else to note…"
      rows="3"
      class="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
      style="
        background: #2A2A2E;
        color: #F1F1F3;
        border: 1px solid #2A2A2E;
        caret-color: #3B82F6;
      "
    ></textarea>
  </section>

  <!-- Submit -->
  <button
    onclick={handleSubmit}
    disabled={!canSubmit}
    class="w-full rounded-xl py-4 text-base font-bold transition-all duration-200 active:scale-98"
    style="
      background: {canSubmit ? '#3B82F6' : '#2A2A2E'};
      color: {canSubmit ? '#fff' : '#6B6B75'};
      min-height: 56px;
    "
  >
    Submit Feedback
  </button>
</div>
