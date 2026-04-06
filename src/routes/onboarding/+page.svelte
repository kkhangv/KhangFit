<script>
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  let step = $state(1);
  const totalSteps = 4;

  // Step 1
  let name = $state('');
  let username = $state('');
  let phone = $state('');
  let password = $state('');
  let confirmPassword = $state('');

  // Step 2
  let bodyWeight = $state('');
  let bodyFat = $state('');
  let maxBench = $state('');
  let maxOHP = $state('');
  let notes = $state('');

  // Step 3
  const todayStr = new Date().toISOString().split('T')[0];
  let startDate = $state(todayStr);

  // Step 4 — Program selection
  let selectedProgramId = $state('chest-focus-4day');
  let programs = $derived(data.programs || []);

  let loading = $state(false);
  let localError = $state('');

  function nextStep() {
    localError = '';
    if (step === 1) {
      if (!name.trim()) { localError = 'Please enter your name.'; return; }
      if (!username.trim()) { localError = 'Please choose a username.'; return; }
      if (!username.match(/^[a-z0-9_]+$/i)) { localError = 'Username can only contain letters, numbers, and underscores.'; return; }
      if (!password) { localError = 'Please enter a password.'; return; }
      if (password.length < 6) { localError = 'Password must be at least 6 characters.'; return; }
      if (password !== confirmPassword) { localError = 'Passwords do not match.'; return; }
    }
    if (step === 2) {
      if (!maxBench) { localError = 'Please enter your current max bench press.'; return; }
    }
    step++;
  }

  function prevStep() {
    localError = '';
    step--;
  }

  const stepLabels = ['Profile', 'Stats', 'Start', 'Program'];
</script>

<svelte:head>
  <title>LIFT — Set Up Your Account</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-12" style="background: #0A0A0B;">
  <div class="w-full" style="max-width: 440px;">

    <!-- Header -->
    <div class="text-center mb-8">
      <a href="/" class="inline-flex items-center justify-center rounded-2xl mb-4" style="width: 56px; height: 56px; background: #3B82F6;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12" />
        </svg>
      </a>
      <h1 class="text-2xl font-black" style="color: #F1F1F3;">Set Up Your Account</h1>
      <p class="text-sm mt-1" style="color: #9B9BA4;">Takes about 2 minutes</p>
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
                background: {step > idx ? '#22C55E' : step === idx ? '#3B82F6' : '#2A2A2E'};
                color: {step >= idx ? '#fff' : '#6B6B75'};
              "
            >
              {step > idx ? '✓' : idx}
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

    <!-- Error (from server action) -->
    {#if form?.error}
      <div class="mb-4 rounded-xl px-4 py-3 text-sm font-medium" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #F87171;">
        {form.error}
      </div>
    {/if}

    <!-- Local validation error -->
    {#if localError}
      <div class="mb-4 rounded-xl px-4 py-3 text-sm font-medium" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #F87171;">
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
      <!-- Hidden fields to pass all data on final submit -->
      {#if step > 1}
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="username" value={username.toLowerCase()} />
        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="password" value={password} />
        <input type="hidden" name="confirmPassword" value={confirmPassword} />
      {/if}
      {#if step > 2}
        <input type="hidden" name="bodyWeight" value={bodyWeight} />
        <input type="hidden" name="bodyFat" value={bodyFat} />
        <input type="hidden" name="maxBench" value={maxBench} />
        <input type="hidden" name="maxOHP" value={maxOHP} />
        <input type="hidden" name="notes" value={notes} />
      {/if}
      {#if step > 3}
        <input type="hidden" name="startDate" value={startDate} />
        <input type="hidden" name="programId" value={selectedProgramId} />
      {/if}

      <div class="rounded-2xl p-6" style="background: #161618; border: 1px solid #2A2A2E;">

        <!-- STEP 1: Profile -->
        {#if step === 1}
          <h2 class="text-lg font-bold mb-5" style="color: #F1F1F3;">Your Profile</h2>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium" style="color: #9B9BA4;">Full Name</label>
              <input
                type="text"
                bind:value={name}
                placeholder="Alex Johnson"
                autocomplete="name"
                class="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
                onfocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium" style="color: #9B9BA4;">Username</label>
              <input
                type="text"
                bind:value={username}
                placeholder="alex_lifts"
                autocomplete="username"
                autocapitalize="none"
                class="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
                onfocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
              />
              <p class="text-xs" style="color: #6B6B75;">Letters, numbers, underscores only. Used to log in.</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium" style="color: #9B9BA4;">Phone Number <span style="color: #6B6B75;">(optional)</span></label>
              <input
                type="tel"
                bind:value={phone}
                placeholder="+1 (555) 123-4567"
                autocomplete="tel"
                class="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
                onfocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium" style="color: #9B9BA4;">Password</label>
              <input
                type="password"
                bind:value={password}
                placeholder="••••••••"
                autocomplete="new-password"
                class="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
                onfocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium" style="color: #9B9BA4;">Confirm Password</label>
              <input
                type="password"
                bind:value={confirmPassword}
                placeholder="••••••••"
                autocomplete="new-password"
                class="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
                onfocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
              />
            </div>
          </div>
        {/if}

        <!-- STEP 2: Stats -->
        {#if step === 2}
          <h2 class="text-lg font-bold mb-1" style="color: #F1F1F3;">Your Stats</h2>
          <p class="text-xs mb-5" style="color: #9B9BA4;">Used to calibrate starting weights and track progress.</p>
          <div class="flex flex-col gap-4">
            <div class="flex gap-3">
              <div class="flex flex-col gap-1.5 flex-1">
                <label class="text-sm font-medium" style="color: #9B9BA4;">Body Weight <span style="color: #6B6B75;">(lbs)</span></label>
                <input
                  type="number"
                  bind:value={bodyWeight}
                  placeholder="175"
                  min="50" max="500" step="0.5"
                  class="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
                  onfocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                  onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
                />
              </div>
              <div class="flex flex-col gap-1.5 flex-1">
                <label class="text-sm font-medium" style="color: #9B9BA4;">Body Fat <span style="color: #6B6B75;">% (opt)</span></label>
                <input
                  type="number"
                  bind:value={bodyFat}
                  placeholder="18"
                  min="3" max="60" step="0.5"
                  class="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
                  onfocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                  onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
                />
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium" style="color: #9B9BA4;">
                Max Bench Press <span style="color: #6B6B75;">(lbs, 1RM or heavy set)</span>
                <span style="color: #F97316; margin-left: 2px;">*</span>
              </label>
              <input
                type="number"
                bind:value={maxBench}
                placeholder="225"
                min="0" max="1000" step="2.5"
                class="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
                onfocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium" style="color: #9B9BA4;">
                Seated DB Press <span style="color: #6B6B75;">(lbs each hand, 8-10 reps)</span>
              </label>
              <input
                type="number"
                bind:value={maxOHP}
                placeholder="55"
                min="0" max="200" step="2.5"
                class="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
                onfocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium" style="color: #9B9BA4;">Notes <span style="color: #6B6B75;">(optional)</span></label>
              <textarea
                bind:value={notes}
                placeholder="Any injuries, limitations, or context…"
                rows="3"
                class="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
                onfocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
              ></textarea>
            </div>
          </div>
        {/if}

        <!-- STEP 3: Program Start -->
        {#if step === 3}
          <h2 class="text-lg font-bold mb-1" style="color: #F1F1F3;">Program Start</h2>
          <p class="text-sm mb-5" style="color: #9B9BA4;">
            Choose when your program begins. Your schedule auto-cycles through 4 working weeks then a deload week. You can always adjust manually from your profile.
          </p>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label for="startDate" class="text-sm font-medium" style="color: #9B9BA4;">Program Start Date</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                bind:value={startDate}
                class="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3; color-scheme: dark;"
                onfocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
              />
            </div>

            <!-- Program overview -->
            <div class="rounded-xl p-4 flex flex-col gap-3" style="background: #0A0A0B; border: 1px solid #2A2A2E;">
              <p class="text-xs font-semibold uppercase tracking-widest" style="color: #9B9BA4;">Your 5-week cycle</p>
              {#each ['Week 1 — Foundation', 'Week 2 — Progression', 'Week 3 — Overload', 'Week 4 — Peak', 'Week 5 — Deload'] as w, i}
                <div class="flex items-center gap-3">
                  <div
                    class="flex items-center justify-center rounded-full text-xs font-bold shrink-0"
                    style="width: 24px; height: 24px; background: {i === 4 ? '#F97316' : '#3B82F6'}; color: #fff;"
                  >
                    {i + 1}
                  </div>
                  <span class="text-sm" style="color: {i === 4 ? '#F97316' : '#F1F1F3'};">{w}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- STEP 4: Choose Your Program -->
        {#if step === 4}
          <h2 class="text-lg font-bold mb-1" style="color: #F1F1F3;">Choose Your Program</h2>
          <p class="text-sm mb-5" style="color: #9B9BA4;">
            Pick a training program that matches your goals. You can switch anytime from your dashboard.
          </p>

          {#if programs.length === 0}
            <div class="rounded-xl p-4 text-center" style="background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.3);">
              <p class="text-sm font-medium" style="color: #F97316;">Programs not yet loaded. Please ask an admin to seed the database.</p>
              <p class="text-xs mt-2" style="color: #9B9BA4;">A default program will be assigned automatically.</p>
            </div>
          {:else}
            <div class="flex flex-col gap-3" style="max-height: 340px; overflow-y: auto;">
              {#each programs as program}
                {@const isSelected = selectedProgramId === program.id}
                <button
                  type="button"
                  onclick={() => (selectedProgramId = program.id)}
                  class="w-full rounded-xl p-4 text-left transition-all duration-200"
                  style="
                    background: {isSelected ? 'rgba(59,130,246,0.1)' : '#0A0A0B'};
                    border: 1.5px solid {isSelected ? '#3B82F6' : '#2A2A2E'};
                  "
                >
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <p class="text-sm font-bold" style="color: #F1F1F3;">{program.name}</p>
                    <div
                      class="flex items-center justify-center rounded-full shrink-0 transition-all"
                      style="
                        width: 20px; height: 20px;
                        border: 2px solid {isSelected ? '#3B82F6' : '#2A2A2E'};
                        background: {isSelected ? '#3B82F6' : 'transparent'};
                      "
                    >
                      {#if isSelected}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      {/if}
                    </div>
                  </div>
                  <p class="text-xs mb-2" style="color: #9B9BA4;">{program.description?.slice(0, 120)}{(program.description?.length ?? 0) > 120 ? '...' : ''}</p>
                  <div class="flex flex-wrap gap-1.5">
                    {#if program.frequency}
                      <span class="text-xs px-2 py-0.5 rounded-full" style="background: rgba(59,130,246,0.15); color: #3B82F6;">{program.frequency}x/week</span>
                    {/if}
                    {#if program.goal}
                      <span class="text-xs px-2 py-0.5 rounded-full" style="background: rgba(34,197,94,0.15); color: #22C55E;">{program.goal.split(' — ')[0]}</span>
                    {/if}
                    {#if program.difficulty}
                      <span class="text-xs px-2 py-0.5 rounded-full" style="background: rgba(249,115,22,0.15); color: #F97316;">{program.difficulty}</span>
                    {/if}
                  </div>
                  {#if program.tags?.length}
                    <div class="flex flex-wrap gap-1 mt-2">
                      {#each program.tags.slice(0, 4) as tag}
                        <span class="text-xs px-1.5 py-0.5 rounded" style="background: #2A2A2E; color: #6B6B75;">{tag}</span>
                      {/each}
                    </div>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        {/if}

      </div>

      <!-- Navigation buttons -->
      <div class="flex gap-3 mt-5">
        {#if step > 1}
          <button
            type="button"
            onclick={prevStep}
            class="flex-1 rounded-xl py-3.5 text-sm font-semibold transition-all"
            style="background: #2A2A2E; color: #9B9BA4;"
          >
            ← Back
          </button>
        {/if}

        {#if step < totalSteps}
          <button
            type="button"
            onclick={nextStep}
            class="flex-1 rounded-xl py-3.5 text-sm font-bold transition-all duration-200 active:scale-95"
            style="background: #3B82F6; color: #fff;"
          >
            Continue →
          </button>
        {:else}
          <button
            type="submit"
            disabled={loading}
            class="flex-1 rounded-xl py-3.5 text-sm font-bold transition-all duration-200 active:scale-95"
            style="background: #22C55E; color: #fff; opacity: {loading ? 0.7 : 1};"
          >
            {loading ? 'Setting up…' : 'Start My Program →'}
          </button>
        {/if}
      </div>
    </form>

    <p class="text-center mt-6 text-sm" style="color: #9B9BA4;">
      Already have an account?
      <a href="/" class="font-semibold ml-1" style="color: #3B82F6;">Log in →</a>
    </p>
  </div>
</div>
