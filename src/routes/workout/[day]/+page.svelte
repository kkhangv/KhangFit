<script>
  import { goto } from '$app/navigation';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import RestTimer from '$lib/components/RestTimer.svelte';
  import RPEFeedback from '$lib/components/RPEFeedback.svelte';
  import { getExerciseInputType } from '$lib/rpeAdjust.js';
  import { ChevronLeft, Clock, Zap, Info, Play, CheckCircle2 } from 'lucide-svelte';

  let { data } = $props();
  let { dayData, dayNum, weekInfo, prevWorkout, doneToday, today } = $derived(data);

  // Snapshot exercises at mount — intentionally non-reactive. User input state
  // must not reset if data changes after the session starts.
  // svelte-ignore state_referenced_locally
  const _initExercises = dayData?.exercises ?? [];

  let setStates = $state(
    Object.fromEntries(
      _initExercises.map((ex, ei) => [
        ei,
        Object.fromEntries(
          Array.from({ length: ex.sets || 3 }, (_, si) => [
            si,
            { done: false, weight: 0, reps: ex.reps || 8, rpe: null }
          ])
        )
      ])
    )
  );

  let readinessChecked = $state(false);
  let readiness = $state({ sleep: 0, stress: 0, soreness: 0, energy: 0 });
  let readinessComplete = $derived(Object.values(readiness).every(v => v > 0));

  // Set wizard state
  let currentExIdx = $state(0);
  let currentSetIdx = $state(0);
  let wizardPhase = $state('input'); // 'input' | 'rpe' | 'rest' | 'exercise-feedback'

  let saving = $state(false);
  let saveError = $state('');
  let sessionComplete = $state(false);
  let startTime = $state(Date.now());

  let exerciseFeedback = $state(
    Object.fromEntries(_initExercises.map((_, i) => [i, 'good']))
  );

  let sessionDifficulty = $state('just_right');

  // ── Derived ────────────────────────────────────────────────────────────────

  let exercises = $derived(dayData?.exercises ?? []);
  let currentEx = $derived(exercises[currentExIdx]);
  let currentExType = $derived(getExerciseInputType(currentEx));
  let isCardioEx = $derived(currentExType?.type === 'cardio');
  let currentSetData = $derived(setStates[currentExIdx]?.[currentSetIdx] || { done: false, weight: 0, reps: 8, rpe: null });
  let totalExSets = $derived(currentEx?.sets || 3);
  let isLastSet = $derived(currentSetIdx >= totalExSets - 1);
  let isLastExercise = $derived(currentExIdx >= exercises.length - 1);

  let totalSets = $derived(exercises.reduce((sum, ex) => sum + (ex.sets || 3), 0));
  let completedSets = $derived(
    Object.values(setStates).reduce(
      (sum, exSets) => sum + Object.values(exSets).filter(s => s.done).length, 0
    )
  );
  let progressPercent = $derived(totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0);
  let allDone = $derived(completedSets === totalSets && totalSets > 0);

  let elapsedMinutes = $state(0);
  $effect(() => {
    const interval = setInterval(() => {
      elapsedMinutes = Math.round((Date.now() - startTime) / 60000);
    }, 30000);
    return () => clearInterval(interval);
  });

  // Check if an exercise is fully done
  function isExDone(exIdx) {
    const exSets = setStates[exIdx] || {};
    return Object.values(exSets).every(s => s.done);
  }

  // ── Weight stepper ─────────────────────────────────────────────────────────

  function adjustWeight(delta) {
    const current = setStates[currentExIdx][currentSetIdx].weight || 0;
    setStates[currentExIdx][currentSetIdx].weight = Math.max(0, current + delta);
  }

  function adjustReps(delta) {
    const current = setStates[currentExIdx][currentSetIdx].reps || 0;
    setStates[currentExIdx][currentSetIdx].reps = Math.max(0, current + delta);
  }

  // ── Wizard actions ─────────────────────────────────────────────────────────

  function markSetDone() {
    setStates[currentExIdx][currentSetIdx].done = true;

    // For cardio, skip RPE and rest
    if (isCardioEx) {
      if (isLastSet) {
        wizardPhase = 'exercise-feedback';
      } else {
        advanceToNextSet();
      }
      return;
    }

    wizardPhase = 'rpe';
  }

  function handleRPESubmit(feedback) {
    setStates[currentExIdx][currentSetIdx].rpe = feedback.rpe;

    // Apply suggested weight to next set silently
    if (!isLastSet) {
      const nextSet = setStates[currentExIdx][currentSetIdx + 1];
      if (nextSet && !nextSet.done) {
        nextSet.weight = feedback.suggestedWeight;
      }
    }

    // Last set of this exercise? Show exercise feedback
    if (isLastSet) {
      wizardPhase = 'exercise-feedback';
      return;
    }

    // Otherwise, show rest timer (skip for last set since exercise feedback follows)
    wizardPhase = 'rest';
  }

  function handleExerciseFeedback(fb) {
    exerciseFeedback[currentExIdx] = fb;

    if (isLastExercise) {
      // All exercises done — check if truly allDone
      return; // allDone will be derived, workout complete UI shows
    }

    // Move to next exercise
    currentExIdx++;
    currentSetIdx = 0;
    wizardPhase = 'input';
  }

  function advanceToNextSet() {
    if (isLastSet) {
      if (isLastExercise) return;
      currentExIdx++;
      currentSetIdx = 0;
    } else {
      currentSetIdx++;
    }
    wizardPhase = 'input';
  }

  function restComplete() {
    advanceToNextSet();
  }

  // Jump to a specific exercise (from the pill strip)
  function jumpToExercise(exIdx) {
    currentExIdx = exIdx;
    // Find the first incomplete set in that exercise
    const exSets = setStates[exIdx] || {};
    const firstIncomplete = Object.entries(exSets).find(([_, s]) => !s.done);
    currentSetIdx = firstIncomplete ? parseInt(firstIncomplete[0]) : 0;
    wizardPhase = 'input';
  }

  // Get next exercise/set label for rest timer
  function getNextLabel() {
    if (isLastSet) {
      if (isLastExercise) return '';
      const nextEx = exercises[currentExIdx + 1];
      return nextEx ? `${nextEx.name} — Set 1` : '';
    }
    return `${currentEx?.name} — Set ${currentSetIdx + 2}`;
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function saveSession() {
    saving = true;
    saveError = '';
    const workoutData = {
      dayNumber: dayNum,
      dayName: dayData.name,
      weekNumber: weekInfo?.weekNumber,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      exercises: exercises.map((ex, ei) => ({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        prescribed: { sets: ex.sets, reps: ex.reps, rpe: ex.rpe },
        actual: Object.values(setStates[ei] || {}).map((s, si) => ({
          setNum: si + 1,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          completed: s.done
        })),
        feedback: exerciseFeedback[ei] || 'good'
      })),
      readiness: readinessChecked ? readiness : null,
      sessionFeedback: {
        difficulty: sessionDifficulty,
        notes: '',
        energyLevel: 'normal'
      }
    };

    try {
      const res = await fetch(`/workout/${dayNum}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workoutData })
      });
      if (res.ok) {
        sessionComplete = true;
      } else {
        saveError = 'Failed to save. Please try again.';
      }
    } catch (e) {
      saveError = `Failed to save: ${e.message}`;
    } finally {
      saving = false;
    }
  }

  const feedbackOptions = [
    { id: 'good', label: 'Good', color: '#22C55E' },
    { id: 'too_easy', label: 'Easy', color: '#10B981' },
    { id: 'too_hard', label: 'Hard', color: '#F97316' },
    { id: 'pain', label: 'Pain', color: '#EF4444' },
  ];
</script>

<svelte:head>
  <title>LIFT — {dayData?.name || 'Workout'}</title>
</svelte:head>

<div style="position: fixed; inset: 0; max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; overflow: hidden; padding: env(safe-area-inset-top, 16px) 16px env(safe-area-inset-bottom, 24px);">

  <!-- Header -->
  <div class="flex items-center justify-between mb-3">
    <button onclick={() => goto('/dashboard')} class="flex items-center gap-1 font-medium px-3 py-2" style="color: #6B6B75;">
      <ChevronLeft size={18} /><span class="text-base">Back</span>
    </button>
    <span class="flex items-center gap-1 text-sm" style="color: #6B6B75;"><Clock size={14} />{elapsedMinutes} min</span>
  </div>

  <div class="mb-4">
    <h1 class="text-xl font-black" style="color: #F1F1F3;">{dayData?.name || 'Workout'}</h1>
    <p class="text-base mt-0.5" style="color: #9B9BA4;">{dayData?.focus || ''}</p>
  </div>

  <!-- Scrollable content area -->
  <div style="flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;">

    <!-- Pre-session readiness check -->
    {#if !readinessChecked && !doneToday}
      <div class="rounded-2xl p-5 mb-6" style="background: #161618; border: 1px solid #2A2A2E;">
        <p class="text-lg font-bold mb-1 flex items-center gap-2" style="color: #F1F1F3;"><Zap size={18} style="color: #10B981;" />How are you feeling?</p>
        <p class="text-sm mb-4" style="color: #6B6B75;">Quick check — helps us fine-tune your program.</p>

        {#each [
          { key: 'sleep', label: 'Sleep', low: 'Rough', high: 'Great' },
          { key: 'stress', label: 'Stress', low: 'Calm', high: 'Stressed' },
          { key: 'soreness', label: 'Soreness', low: 'Fresh', high: 'Sore' },
          { key: 'energy', label: 'Energy', low: 'Tired', high: 'Pumped' }
        ] as item}
          <div class="mb-4">
            <div class="flex items-center justify-between mb-1">
              <span class="text-base font-medium w-20" style="color: #9B9BA4;">{item.label}</span>
              <div class="flex gap-2">
                {#each [1, 2, 3, 4, 5] as val}
                  <button
                    onclick={() => readiness[item.key] = val}
                    class="w-11 h-11 rounded-xl text-base font-bold transition-all"
                    style="background: {readiness[item.key] === val ? '#10B981' : '#1E1E22'}; color: {readiness[item.key] === val ? 'white' : '#6B6B75'};"
                  >{val}</button>
                {/each}
              </div>
            </div>
            <div class="flex justify-end">
              <div class="flex justify-between" style="width: 228px;">
                <span class="text-xs" style="color: #4B4B55;">{item.low}</span>
                <span class="text-xs" style="color: #4B4B55;">{item.high}</span>
              </div>
            </div>
          </div>
        {/each}

        <button
          onclick={() => { readinessChecked = true; startTime = Date.now(); }}
          disabled={!readinessComplete}
          class="w-full py-4 rounded-xl text-base font-bold mt-2 active:scale-95 flex items-center justify-center gap-2"
          style="background: {readinessComplete ? '#10B981' : '#2A2A2E'}; color: {readinessComplete ? 'white' : '#4B4B55'}; transition: all 0.2s;">
          <Play size={18} />Start Workout
        </button>
      </div>

    {:else if sessionComplete}
      <!-- Session complete screen -->
      <div class="rounded-2xl p-8 text-center" style="background: #161618; border: 1px solid #22C55E44;">
        <h2 class="text-2xl font-black mb-2 flex items-center justify-center gap-2" style="color: #22C55E;"><CheckCircle2 size={28} />Workout Complete!</h2>
        <p class="text-base mb-1" style="color: #9B9BA4;">{dayData?.name}</p>
        <p class="text-lg font-bold mb-4" style="color: #6B6B75;">
          {completedSets} sets in {elapsedMinutes} minutes
        </p>
        <button onclick={() => goto('/dashboard')}
          class="px-6 py-4 rounded-xl text-base font-bold active:scale-95" style="background: #10B981; color: white;">
          Back to Dashboard
        </button>
      </div>

    {:else}
      <!-- Progress bar -->
      <div class="mb-4">
        <ProgressBar value={progressPercent} color={allDone ? '#22C55E' : '#10B981'} />
        <p class="text-sm mt-1 text-right" style="color: #6B6B75;">{completedSets}/{totalSets} sets</p>
      </div>

      <!-- Exercise pills strip -->
      <div class="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
        {#each exercises as ex, idx}
          {@const exDone = isExDone(idx)}
          {@const isCurrent = idx === currentExIdx}
          <button
            onclick={() => jumpToExercise(idx)}
            class="flex items-center gap-1.5 px-3 py-2 rounded-full shrink-0 transition-all"
            style="
              background: {isCurrent ? 'rgba(16,185,129,0.15)' : exDone ? 'rgba(34,197,94,0.1)' : '#1E1E22'};
              border: 1px solid {isCurrent ? '#10B981' : exDone ? '#22C55E44' : '#2A2A2E'};
            "
          >
            <span class="w-2 h-2 rounded-full" style="background: {exDone ? '#22C55E' : isCurrent ? '#10B981' : '#4B4B55'};"></span>
            <span class="text-sm font-medium whitespace-nowrap" style="color: {isCurrent ? '#10B981' : exDone ? '#22C55E' : '#6B6B75'};">
              {ex.name.length > 16 ? ex.name.slice(0, 14) + '...' : ex.name}
            </span>
          </button>
        {/each}
      </div>

      <!-- All exercises done — save section -->
      {#if allDone}
        <div class="flex flex-col gap-4">
          <div class="rounded-2xl p-6 text-center" style="background: #161618; border: 1px solid #22C55E44;">
            <h2 class="text-xl font-black mb-2" style="color: #22C55E;">All Sets Done!</h2>
            <p class="text-base" style="color: #9B9BA4;">How was the session overall?</p>
          </div>

          <div class="flex gap-2">
            {#each [{ id: 'too_easy', label: 'Too Easy' }, { id: 'just_right', label: 'Just Right' }, { id: 'too_hard', label: 'Too Hard' }] as opt}
              <button
                type="button"
                onclick={() => sessionDifficulty = opt.id}
                class="flex-1 py-3 rounded-xl text-base font-semibold transition-all"
                style="
                  background: {sessionDifficulty === opt.id ? '#10B981' : '#1E1E22'};
                  color: {sessionDifficulty === opt.id ? '#fff' : '#9B9BA4'};
                  border: 1px solid {sessionDifficulty === opt.id ? '#10B981' : '#2A2A2E'};
                "
              >
                {opt.label}
              </button>
            {/each}
          </div>

          {#if saveError}
            <p class="text-base text-center" style="color: #EF4444;">{saveError}</p>
          {/if}

          <button
            onclick={saveSession}
            disabled={saving}
            class="w-full py-4 rounded-xl text-lg font-bold transition-all active:scale-95"
            style="background: #22C55E; color: white; opacity: {saving ? 0.7 : 1};"
          >
            {saving ? 'Saving...' : 'Complete Workout'}
          </button>
        </div>

      {:else if currentEx}
        <!-- ═══ SET WIZARD ═══ -->
        <div class="rounded-2xl overflow-hidden" style="background: #161618; border: 1px solid {wizardPhase === 'rest' ? '#F97316' : '#10B981'};">

          <!-- Exercise header -->
          <div class="px-5 pt-5 pb-3">
            <p class="text-xs font-semibold uppercase tracking-wider mb-1" style="color: #6B6B75;">
              Exercise {currentExIdx + 1} of {exercises.length}
            </p>
            <h2 class="text-xl font-black" style="color: #F1F1F3;">{currentEx.name}</h2>
            <p class="text-base mt-0.5" style="color: #9B9BA4;">
              {currentEx.muscleGroup}
              {#if !isCardioEx}
                — {currentEx.sets} sets of {currentEx.reps} reps
              {/if}
            </p>

            <!-- Collapsible exercise info -->
            {#if currentEx.cue}
              <div class="rounded-lg px-3 py-2 mt-3" style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);">
                <p class="text-sm flex items-start gap-1.5" style="color: #10B981;"><Info size={14} class="shrink-0 mt-0.5" />{currentEx.cue}</p>
              </div>
            {/if}
          </div>

          <!-- PHASE: Input -->
          {#if wizardPhase === 'input'}
            <div class="px-5 pb-5">
              <p class="text-base font-bold mb-4" style="color: #9B9BA4;">
                {isCardioEx ? 'Session' : `Set ${currentSetIdx + 1} of ${totalExSets}`}
              </p>

              {#if isCardioEx}
                <!-- Cardio: just duration -->
                <div class="flex flex-col items-center gap-4 mb-5">
                  <p class="text-sm" style="color: #6B6B75;">Duration (minutes)</p>
                  <div class="flex items-center gap-4">
                    <button onclick={() => adjustReps(-5)}
                      class="w-14 h-14 rounded-xl text-xl font-bold active:scale-90"
                      style="background: #2A2A2E; color: #9B9BA4;">-5</button>
                    <span class="text-4xl font-black tabular-nums" style="color: #F1F1F3; min-width: 80px; text-align: center;">
                      {currentSetData.reps}
                    </span>
                    <button onclick={() => adjustReps(5)}
                      class="w-14 h-14 rounded-xl text-xl font-bold active:scale-90"
                      style="background: #2A2A2E; color: #9B9BA4;">+5</button>
                  </div>
                </div>
              {:else}
                <!-- Strength: weight + reps -->
                <div class="flex flex-col gap-5 mb-5">
                  <!-- Weight stepper -->
                  <div>
                    <p class="text-sm mb-2 text-center" style="color: #6B6B75;">Weight (lbs)</p>
                    <div class="flex items-center justify-center gap-3">
                      <button onclick={() => adjustWeight(-5)}
                        class="w-14 h-14 rounded-xl text-lg font-bold active:scale-90"
                        style="background: #2A2A2E; color: #9B9BA4;">-5</button>
                      <button onclick={() => adjustWeight(-2.5)}
                        class="w-12 h-14 rounded-xl text-base font-bold active:scale-90"
                        style="background: #2A2A2E; color: #6B6B75;">-2.5</button>
                      <span class="text-3xl font-black tabular-nums" style="color: #F1F1F3; min-width: 90px; text-align: center;">
                        {currentSetData.weight}
                      </span>
                      <button onclick={() => adjustWeight(2.5)}
                        class="w-12 h-14 rounded-xl text-base font-bold active:scale-90"
                        style="background: #2A2A2E; color: #6B6B75;">+2.5</button>
                      <button onclick={() => adjustWeight(5)}
                        class="w-14 h-14 rounded-xl text-lg font-bold active:scale-90"
                        style="background: #2A2A2E; color: #9B9BA4;">+5</button>
                    </div>
                  </div>

                  <!-- Reps stepper -->
                  <div>
                    <p class="text-sm mb-2 text-center" style="color: #6B6B75;">Reps (target: {currentEx.reps})</p>
                    <div class="flex items-center justify-center gap-4">
                      <button onclick={() => adjustReps(-1)}
                        class="w-14 h-14 rounded-xl text-xl font-bold active:scale-90"
                        style="background: #2A2A2E; color: #9B9BA4;">-1</button>
                      <span class="text-3xl font-black tabular-nums" style="color: #F1F1F3; min-width: 70px; text-align: center;">
                        {currentSetData.reps}
                      </span>
                      <button onclick={() => adjustReps(1)}
                        class="w-14 h-14 rounded-xl text-xl font-bold active:scale-90"
                        style="background: #2A2A2E; color: #9B9BA4;">+1</button>
                    </div>
                  </div>
                </div>

                <!-- Technique hint for final set -->
                {#if isLastSet && currentEx.technique}
                  <div class="rounded-lg px-3 py-2 mb-4" style="background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.2);">
                    <p class="text-sm font-medium" style="color: #F97316;">
                      Final set tip: {currentEx.technique}{currentEx.techniqueNote ? ` — ${currentEx.techniqueNote}` : ''}
                    </p>
                  </div>
                {/if}
              {/if}

              <button
                onclick={markSetDone}
                class="w-full py-4 rounded-xl text-lg font-bold active:scale-95"
                style="background: #10B981; color: white;"
              >
                {isCardioEx ? 'Complete' : 'Done'}
              </button>
            </div>

          <!-- PHASE: RPE -->
          {:else if wizardPhase === 'rpe'}
            <div class="px-5 pb-5">
              <RPEFeedback
                currentWeight={currentSetData.weight}
                targetRPE={currentEx.rpe}
                targetReps={currentEx.reps}
                actualReps={currentSetData.reps}
                isCardio={isCardioEx}
                onSubmit={handleRPESubmit}
              />
            </div>

          <!-- PHASE: Rest -->
          {:else if wizardPhase === 'rest'}
            <div class="px-5 pb-5">
              <RestTimer
                seconds={currentEx.rest || 90}
                onComplete={restComplete}
                inline={true}
                nextLabel={getNextLabel()}
              />
            </div>

          <!-- PHASE: Exercise feedback -->
          {:else if wizardPhase === 'exercise-feedback'}
            <div class="px-5 pb-5">
              <p class="text-base font-semibold mb-3 text-center" style="color: #9B9BA4;">
                How was {currentEx.name}?
              </p>
              <div class="flex flex-col gap-2">
                {#each feedbackOptions as opt}
                  <button
                    type="button"
                    onclick={() => handleExerciseFeedback(opt.id)}
                    class="w-full py-4 rounded-xl text-base font-semibold transition-all active:scale-95"
                    style="background: #1E1E22; border: 2px solid #2A2A2E; color: {opt.color};"
                  >
                    {opt.label}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    {/if}

  </div>
</div>

<style>
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
