<script>
  import { enhance } from '$app/forms';
  import EquipmentPicker from '$lib/components/EquipmentPicker.svelte';
  import RPEGuide from '$lib/components/RPEGuide.svelte';

  let { form } = $props();

  let step = $state(1);
  const totalSteps = 4;

  // Step 1: Account
  let name = $state('');
  let username = $state('');
  let password = $state('');
  let showPassword = $state(false);

  // Step 2: About You + Training
  let age = $state('');
  let bodyWeight = $state('');
  let bodyFat = $state('');
  let trainingAge = $state('');
  let equipment = $state([]);
  let goal = $state('');
  let daysPerWeek = $state(4);

  // Step 3: Personalize
  let focusMuscles = $state([]);
  let cardio = $state('none');
  let cardioType = $state('');
  let cardioDuration = $state(20);
  let mobilityEnabled = $state(false);
  let mobility = $state([]);
  let injuries = $state('');
  let sessionDuration = $state(45);
  let freeformNotes = $state('');

  let loading = $state(false);
  let localError = $state('');

  // Step 4: education tips shown while generating
  let eduIndex = $state(0);
  let eduInterval = $state(null);

  const eduTips = [
    {
      title: 'What is RPE?',
      body: 'RPE (Rate of Perceived Exertion) is a 1\u201310 scale for how hard a set felt. RPE 8 = you could do 2 more reps. We use it to auto-adjust your weights in real time.',
      items: [
        { label: 'RPE 7', desc: 'Could do 3 more reps \u2014 light working set', color: '#84CC16' },
        { label: 'RPE 8', desc: 'Could do 2 more reps \u2014 solid working set', color: '#EAB308' },
        { label: 'RPE 9', desc: 'Could do 1 more rep \u2014 very hard', color: '#F97316' },
        { label: 'RPE 10', desc: 'Absolute failure \u2014 no more reps possible', color: '#EF4444' },
      ]
    },
    {
      title: 'Sets, Reps & Rest',
      body: 'Your plan prescribes exact rep targets (e.g. "8 reps") not ranges. After each set, tell the app how hard it was and it adjusts your next set automatically.',
      items: [
        { label: 'Sets', desc: 'Groups of reps with rest between them', color: '#84CC16' },
        { label: 'Reps', desc: 'Number of times you lift the weight', color: '#84CC16' },
        { label: 'Rest', desc: '60\u2013120 sec between sets for hypertrophy', color: '#84CC16' },
      ]
    },
    {
      title: 'Drop Sets & Supersets',
      body: 'Your plan may include advanced techniques on final sets to save time while getting the same muscle growth.',
      items: [
        { label: 'Drop set', desc: 'Hit failure \u2192 reduce weight 25% \u2192 keep going', color: '#A855F7' },
        { label: 'Superset', desc: 'Two exercises back-to-back with no rest', color: '#A855F7' },
        { label: 'Rest-pause', desc: 'Hit failure \u2192 rest 15 sec \u2192 squeeze out more reps', color: '#A855F7' },
      ]
    },
    {
      title: 'Deload Weeks',
      body: 'Every 5th week is a deload \u2014 lighter weights, fewer sets. This lets your body recover and actually makes you stronger long-term by restoring muscle growth signaling.',
      items: []
    },
  ];

  const goals = [
    { id: 'Build muscle', label: 'Build Muscle' },
    { id: 'Get stronger', label: 'Get Stronger' },
    { id: 'Lose fat', label: 'Lose Fat' },
    { id: 'General fitness', label: 'General Fitness' },
  ];

  const trainingAges = [
    { id: 'none', label: 'Brand new', desc: 'Never trained' },
    { id: 'under1', label: 'Under 1 year', desc: 'Still learning' },
    { id: '1to3', label: '1\u20133 years', desc: 'Consistent' },
    { id: '3to5', label: '3\u20135 years', desc: 'Experienced' },
    { id: '5plus', label: '5+ years', desc: 'Veteran' },
  ];

  const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];
  const cardioOptions = [
    { id: 'none', label: 'None' },
    { id: 'Before lifting (warmup)', label: 'Before Lifting' },
    { id: 'After lifting', label: 'After Lifting' },
    { id: 'Separate cardio days', label: 'Separate Days' },
  ];
  const mobilityAreas = ['Shoulders', 'Lower Back', 'Knees', 'Hips', 'Wrists'];
  const durations = [30, 45, 60];

  // Derive experience from training age for the AI
  let experience = $derived(
    trainingAge === 'none' || trainingAge === 'under1' ? 'Beginner' :
    trainingAge === '1to3' ? 'Intermediate' : 'Advanced'
  );

  function nextStep() {
    localError = '';
    if (step === 1) {
      if (!name.trim()) { localError = 'Enter your name.'; return; }
      if (!username.trim()) { localError = 'Choose a username.'; return; }
      if (!username.match(/^[a-z0-9_]+$/i)) { localError = 'Username: letters, numbers, underscores only.'; return; }
      if (!password || password.length < 6) { localError = 'Password must be at least 6 characters.'; return; }
    }
    if (step === 2) {
      if (!trainingAge) { localError = 'How long have you been training?'; return; }
      if (equipment.length === 0) { localError = 'Select your equipment.'; return; }
      if (!goal) { localError = 'Pick a goal.'; return; }
    }
    step++;
    // Start education carousel on step 4
    if (step === 4) {
      eduIndex = 0;
      eduInterval = setInterval(() => {
        eduIndex = (eduIndex + 1) % eduTips.length;
      }, 4000);
    }
  }

  function prevStep() {
    localError = '';
    if (eduInterval) { clearInterval(eduInterval); eduInterval = null; }
    step--;
  }

  function toggleMuscle(m) {
    if (focusMuscles.includes(m)) {
      focusMuscles = focusMuscles.filter((x) => x !== m);
    } else {
      focusMuscles = [...focusMuscles, m];
    }
  }

  function toggleMobility(area) {
    if (mobility.includes(area)) {
      mobility = mobility.filter((x) => x !== area);
    } else {
      mobility = [...mobility, area];
    }
  }

  const stepLabels = ['Account', 'About You', 'Personalize', 'Generate'];
</script>

<svelte:head>
  <title>KhangLift — Set Up Your Account</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-12" style="background: #0A0A0B;">
  <div class="w-full" style="max-width: 480px;">

    <!-- Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center rounded-2xl mb-4" style="width: 56px; height: 56px; background: #84CC16;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12" />
        </svg>
      </div>
      <h1 class="text-2xl font-black" style="color: #F1F1F3;">Set Up Your Account</h1>
    </div>

    <!-- Step indicator -->
    <div class="flex items-center gap-2 mb-8">
      {#each stepLabels as label, i}
        {@const idx = i + 1}
        <div class="flex items-center gap-2 flex-1">
          <div class="flex items-center gap-2">
            <div
              class="flex items-center justify-center rounded-full text-xs font-bold shrink-0 transition-all duration-300"
              style="
                width: 28px; height: 28px;
                background: {step > idx ? '#22C55E' : step === idx ? '#84CC16' : '#2A2A2E'};
                color: {step >= idx ? '#fff' : '#6B6B75'};
              "
            >
              {step > idx ? '\u2713' : idx}
            </div>
            <span class="text-xs font-medium hidden sm:block" style="color: {step === idx ? '#F1F1F3' : '#6B6B75'};">
              {label}
            </span>
          </div>
          {#if i < stepLabels.length - 1}
            <div class="flex-1 h-px mx-1" style="background: {step > idx ? '#22C55E' : '#2A2A2E'};"></div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Errors -->
    {#if form?.error}
      <div class="mb-4 rounded-xl px-4 py-3 text-base font-medium" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #F87171;">
        {form.error}
      </div>
    {/if}
    {#if localError}
      <div class="mb-4 rounded-xl px-4 py-3 text-base font-medium" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #F87171;">
        {localError}
      </div>
    {/if}

    <form
      method="POST"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          await update();
          loading = false;
        };
      }}
    >
      <!-- Hidden fields for final submit -->
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="username" value={username.toLowerCase()} />
      <input type="hidden" name="password" value={password} />
      <input type="hidden" name="age" value={age} />
      <input type="hidden" name="bodyWeight" value={bodyWeight} />
      <input type="hidden" name="bodyFat" value={bodyFat} />
      <input type="hidden" name="trainingAge" value={trainingAge} />
      <input type="hidden" name="equipment" value={JSON.stringify(equipment)} />
      <input type="hidden" name="goal" value={goal} />
      <input type="hidden" name="daysPerWeek" value={daysPerWeek} />
      <input type="hidden" name="experience" value={experience} />
      <input type="hidden" name="focusMuscles" value={JSON.stringify(focusMuscles)} />
      <input type="hidden" name="cardio" value={cardio} />
      <input type="hidden" name="cardioType" value={cardioType} />
      <input type="hidden" name="cardioDuration" value={cardioDuration} />
      <input type="hidden" name="mobility" value={JSON.stringify(mobility)} />
      <input type="hidden" name="injuries" value={injuries} />
      <input type="hidden" name="sessionDuration" value={sessionDuration} />
      <input type="hidden" name="freeformNotes" value={freeformNotes} />

      <div class="rounded-2xl p-6" style="background: #161618; border: 1px solid #2A2A2E;">

        <!-- STEP 1: Account -->
        {#if step === 1}
          <h2 class="text-lg font-bold mb-5" style="color: #F1F1F3;">Your Account</h2>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-base font-medium" style="color: #9B9BA4;">Name</label>
              <input type="text" bind:value={name} placeholder="Alex" autocomplete="name"
                class="w-full rounded-xl px-4 py-3 text-base outline-none"
                style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-base font-medium" style="color: #9B9BA4;">Username</label>
              <input type="text" bind:value={username} placeholder="alex_lifts" autocomplete="username" autocapitalize="none"
                class="w-full rounded-xl px-4 py-3 text-base outline-none"
                style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;" />
              <p class="text-xs" style="color: #6B6B75;">Used to log in.</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-base font-medium" style="color: #9B9BA4;">Password</label>
              <div class="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  bind:value={password}
                  placeholder="6+ characters"
                  autocomplete="new-password"
                  class="w-full rounded-xl px-4 py-3 pr-16 text-base outline-none"
                  style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;" />
                <button
                  type="button"
                  onclick={() => showPassword = !showPassword}
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                  style="color: #6B6B75;"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- STEP 2: About You + Training -->
        {#if step === 2}
          <h2 class="text-lg font-bold mb-1" style="color: #F1F1F3;">About You</h2>
          <p class="text-xs mb-5" style="color: #6B6B75;">Helps the AI calibrate your program intensity and volume.</p>
          <div class="flex flex-col gap-5">

            <!-- Training history — the key question -->
            <div class="flex flex-col gap-2">
              <label class="text-base font-semibold" style="color: #9B9BA4;">How long have you been lifting?</label>
              <div class="flex flex-col gap-1.5">
                {#each trainingAges as ta}
                  <button type="button" onclick={() => trainingAge = ta.id}
                    class="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                    style="
                      background: {trainingAge === ta.id ? 'rgba(132,204,22,0.1)' : '#0A0A0B'};
                      border: 1px solid {trainingAge === ta.id ? '#84CC16' : '#2A2A2E'};
                    ">
                    <span class="text-base font-semibold" style="color: {trainingAge === ta.id ? '#84CC16' : '#F1F1F3'};">{ta.label}</span>
                    <span class="text-xs" style="color: #6B6B75;">{ta.desc}</span>
                  </button>
                {/each}
              </div>
            </div>

            <!-- Body stats row -->
            <div class="flex flex-col gap-2">
              <label class="text-base font-semibold" style="color: #9B9BA4;">Body Stats <span class="font-normal" style="color: #6B6B75;">(helps with weight recommendations)</span></label>
              <div class="flex gap-3">
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-xs" style="color: #6B6B75;">Age</label>
                  <input type="number" bind:value={age} placeholder="28" min="13" max="99"
                    inputmode="numeric" pattern="[0-9]*"
                    class="w-full rounded-xl px-4 py-3 text-base outline-none"
                    style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;" />
                </div>
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-xs" style="color: #6B6B75;">Weight <span style="color: #4B4B55;">(lbs)</span></label>
                  <input type="number" bind:value={bodyWeight} placeholder="175" min="50" max="500" step="0.5"
                    inputmode="decimal" pattern="[0-9]*"
                    class="w-full rounded-xl px-4 py-3 text-base outline-none"
                    style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;" />
                </div>
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-xs" style="color: #6B6B75;">Body Fat <span style="color: #4B4B55;">(%)</span></label>
                  <input type="number" bind:value={bodyFat} placeholder="18" min="3" max="60" step="0.5"
                    inputmode="decimal" pattern="[0-9]*"
                    class="w-full rounded-xl px-4 py-3 text-base outline-none"
                    style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;" />
                </div>
              </div>
              <p class="text-xs" style="color: #4B4B55;">All optional. Body fat is a rough estimate \u2014 no need to be exact.</p>
            </div>

            <!-- Equipment -->
            <div class="flex flex-col gap-2">
              <label class="text-base font-semibold" style="color: #9B9BA4;">Equipment</label>
              <EquipmentPicker bind:value={equipment} />
            </div>

            <!-- Goal -->
            <div class="flex flex-col gap-2">
              <label class="text-base font-semibold" style="color: #9B9BA4;">Goal</label>
              <div class="flex flex-wrap gap-2">
                {#each goals as g}
                  <button type="button" onclick={() => goal = g.id}
                    class="px-4 py-2.5 rounded-xl text-base font-semibold transition-all"
                    style="background: {goal === g.id ? '#84CC16' : '#1E1E22'}; color: {goal === g.id ? '#fff' : '#9B9BA4'}; border: 1px solid {goal === g.id ? '#84CC16' : '#2A2A2E'};">
                    {g.label}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Days per week -->
            <div class="flex flex-col gap-2">
              <label class="text-base font-semibold" style="color: #9B9BA4;">Days per Week</label>
              <div class="flex gap-2">
                {#each [3, 4, 5, 6] as d}
                  <button type="button" onclick={() => daysPerWeek = d}
                    class="w-14 py-2.5 rounded-xl text-base font-bold text-center transition-all"
                    style="background: {daysPerWeek === d ? '#84CC16' : '#1E1E22'}; color: {daysPerWeek === d ? '#fff' : '#9B9BA4'}; border: 1px solid {daysPerWeek === d ? '#84CC16' : '#2A2A2E'};">
                    {d}
                  </button>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- STEP 3: Personalize -->
        {#if step === 3}
          <h2 class="text-lg font-bold mb-1" style="color: #F1F1F3;">Personalize</h2>
          <p class="text-xs mb-5" style="color: #6B6B75;">All optional \u2014 helps the AI tailor your program.</p>
          <div class="flex flex-col gap-5">
            <!-- Muscle group focus -->
            <div class="flex flex-col gap-2">
              <label class="text-base font-semibold" style="color: #9B9BA4;">Focus Muscles <span class="font-normal" style="color: #6B6B75;">(extra volume)</span></label>
              <div class="flex flex-wrap gap-2">
                {#each muscleGroups as m}
                  <button type="button" onclick={() => toggleMuscle(m)}
                    class="px-3 py-2 rounded-lg text-base font-medium transition-all"
                    style="background: {focusMuscles.includes(m) ? 'rgba(132,204,22,0.15)' : '#1E1E22'}; color: {focusMuscles.includes(m) ? '#84CC16' : '#6B6B75'}; border: 1px solid {focusMuscles.includes(m) ? '#84CC16' : '#2A2A2E'};">
                    {focusMuscles.includes(m) ? '\u2713 ' : ''}{m}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Cardio -->
            <div class="flex flex-col gap-2">
              <label class="text-base font-semibold" style="color: #9B9BA4;">Cardio</label>
              <div class="flex flex-wrap gap-2">
                {#each cardioOptions as c}
                  <button type="button" onclick={() => cardio = c.id}
                    class="px-3 py-2 rounded-lg text-base font-medium transition-all"
                    style="background: {cardio === c.id ? 'rgba(132,204,22,0.15)' : '#1E1E22'}; color: {cardio === c.id ? '#84CC16' : '#6B6B75'}; border: 1px solid {cardio === c.id ? '#84CC16' : '#2A2A2E'};">
                    {c.label}
                  </button>
                {/each}
              </div>
              {#if cardio !== 'none'}
                <div class="flex gap-2 mt-1">
                  <input type="text" bind:value={cardioType} placeholder="Type (cycling, running, any)"
                    class="flex-1 rounded-lg px-3 py-2 text-base outline-none"
                    style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;" />
                  <select bind:value={cardioDuration}
                    class="rounded-lg px-3 py-2 text-base outline-none"
                    style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;">
                    <option value={15}>15 min</option>
                    <option value={20}>20 min</option>
                    <option value={30}>30 min</option>
                  </select>
                </div>
              {/if}
            </div>

            <!-- PT / Mobility -->
            <div class="flex flex-col gap-2">
              <label class="flex items-center gap-2 text-base font-semibold cursor-pointer" style="color: #9B9BA4;">
                <input type="checkbox" bind:checked={mobilityEnabled}
                  class="rounded" style="accent-color: #84CC16;" />
                Include PT / Mobility Work
              </label>
              {#if mobilityEnabled}
                <div class="flex flex-wrap gap-2">
                  {#each mobilityAreas as area}
                    <button type="button" onclick={() => toggleMobility(area)}
                      class="px-3 py-2 rounded-lg text-base font-medium transition-all"
                      style="background: {mobility.includes(area) ? 'rgba(132,204,22,0.15)' : '#1E1E22'}; color: {mobility.includes(area) ? '#84CC16' : '#6B6B75'}; border: 1px solid {mobility.includes(area) ? '#84CC16' : '#2A2A2E'};">
                      {mobility.includes(area) ? '\u2713 ' : ''}{area}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- Injuries -->
            <div class="flex flex-col gap-1.5">
              <label class="text-base font-semibold" style="color: #9B9BA4;">Injuries / Limitations</label>
              <input type="text" bind:value={injuries} placeholder="Bad left shoulder, knee issues..."
                class="w-full rounded-xl px-4 py-3 text-base outline-none"
                style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;" />
            </div>

            <!-- Session duration -->
            <div class="flex flex-col gap-2">
              <label class="text-base font-semibold" style="color: #9B9BA4;">Session Duration</label>
              <div class="flex gap-2">
                {#each durations as d}
                  <button type="button" onclick={() => sessionDuration = d}
                    class="px-4 py-2 rounded-xl text-base font-semibold transition-all"
                    style="background: {sessionDuration === d ? '#84CC16' : '#1E1E22'}; color: {sessionDuration === d ? '#fff' : '#9B9BA4'}; border: 1px solid {sessionDuration === d ? '#84CC16' : '#2A2A2E'};">
                    {d} min
                  </button>
                {/each}
                <button type="button" onclick={() => sessionDuration = 0}
                  class="px-4 py-2 rounded-xl text-base font-semibold transition-all"
                  style="background: {sessionDuration === 0 ? '#84CC16' : '#1E1E22'}; color: {sessionDuration === 0 ? '#fff' : '#9B9BA4'}; border: 1px solid {sessionDuration === 0 ? '#84CC16' : '#2A2A2E'};">
                  No limit
                </button>
              </div>
            </div>

            <!-- Free-form notes -->
            <div class="flex flex-col gap-1.5">
              <label class="text-base font-semibold" style="color: #9B9BA4;">Anything Else?</label>
              <textarea bind:value={freeformNotes} rows="3"
                placeholder="I want to focus on incline pressing, I hate leg extensions, I do BJJ on Wednesdays..."
                class="w-full rounded-xl px-4 py-3 text-base outline-none resize-none"
                style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"></textarea>
              <p class="text-xs" style="color: #6B6B75;">This goes directly to the AI \u2014 be specific!</p>
            </div>
          </div>
        {/if}

        <!-- STEP 4: Generate + Education -->
        {#if step === 4}
          <div class="flex flex-col gap-5 py-4">
            <!-- Loading / ready state -->
            <div class="flex flex-col items-center gap-3">
              {#if loading}
                <div class="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style="border-color: #84CC16; border-top-color: transparent;"></div>
                <p class="text-base font-semibold" style="color: #F1F1F3;">Setting up your program...</p>
                <p class="text-sm" style="color: #6B6B75;">Usually takes about 10 seconds</p>
              {:else}
                <div class="w-12 h-12 rounded-full flex items-center justify-center" style="background: #84CC16;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <p class="text-base font-semibold" style="color: #F1F1F3;">Ready to generate your plan</p>
                <p class="text-sm text-center" style="color: #6B6B75;">
                  {daysPerWeek}-day/week \u00b7 5-week program \u00b7 {goal.toLowerCase()}<br />
                  {equipment.length > 3 ? 'Full gym' : equipment.join(', ')} \u00b7 {trainingAges.find(t => t.id === trainingAge)?.label || ''} lifter
                </p>
              {/if}
            </div>

            <!-- Education card carousel -->
            <div class="rounded-xl p-4 transition-all" style="background: #0A0A0B; border: 1px solid #2A2A2E; min-height: 180px;">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold uppercase tracking-wider" style="color: #84CC16;">{eduTips[eduIndex].title}</span>
                <span class="text-xs" style="color: #4B4B55;">{eduIndex + 1}/{eduTips.length}</span>
              </div>
              <p class="text-xs leading-relaxed mb-3" style="color: #9B9BA4;">{eduTips[eduIndex].body}</p>
              {#if eduTips[eduIndex].items.length > 0}
                <div class="flex flex-col gap-1.5">
                  {#each eduTips[eduIndex].items as item}
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" style="background: #161618;">
                      <span class="text-xs font-bold w-16" style="color: {item.color};">{item.label}</span>
                      <span class="text-xs" style="color: #6B6B75;">{item.desc}</span>
                    </div>
                  {/each}
                </div>
              {/if}
              <!-- Dot indicators -->
              <div class="flex justify-center gap-1.5 mt-3">
                {#each eduTips as _, i}
                  <button type="button" onclick={() => eduIndex = i}
                    class="rounded-full transition-all"
                    style="width: {eduIndex === i ? '16px' : '6px'}; height: 6px; background: {eduIndex === i ? '#84CC16' : '#2A2A2E'};"
                  ></button>
                {/each}
              </div>
            </div>
          </div>
        {/if}

      </div>

      <!-- Navigation -->
      <div class="flex gap-3 mt-5">
        {#if step > 1 && step < 4}
          <button type="button" onclick={prevStep}
            class="flex-1 rounded-xl py-3.5 text-base font-semibold" style="background: #2A2A2E; color: #9B9BA4;">
            Back
          </button>
        {/if}

        {#if step < 3}
          <button type="button" onclick={nextStep}
            class="flex-1 rounded-xl py-3.5 text-base font-bold active:scale-95" style="background: #84CC16; color: #fff;">
            Continue
          </button>
        {:else if step === 3}
          <button type="button" onclick={nextStep}
            class="flex-1 rounded-xl py-3.5 text-base font-bold active:scale-95" style="background: #84CC16; color: #fff;">
            Generate My Plan
          </button>
        {:else}
          <button type="submit" disabled={loading}
            class="flex-1 rounded-xl py-3.5 text-base font-bold active:scale-95"
            style="background: #22C55E; color: #fff; opacity: {loading ? 0.7 : 1};">
            {loading ? 'Setting up...' : 'Create Account'}
          </button>
        {/if}
      </div>
    </form>

    <p class="text-center mt-6 text-base" style="color: #9B9BA4;">
      Already have an account? <a href="/" class="font-semibold" style="color: #84CC16;">Log in</a>
    </p>
  </div>
</div>
