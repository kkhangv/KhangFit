<script>
  import { enhance } from '$app/forms';

  let { form } = $props();

  let loading = $state(false);
</script>

<svelte:head>
  <title>KhangLift — Log In</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-12" style="background: #0A0A0B;">
  <div class="w-full" style="max-width: 400px;">

    <!-- Logo / Title -->
    <div class="text-center mb-10">
      <div
        class="inline-flex items-center justify-center rounded-2xl mb-4"
        style="width: 64px; height: 64px; background: #84CC16;"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12" />
        </svg>
      </div>
      <h1 class="text-4xl font-black tracking-tight" style="color: #F1F1F3;">KhangLift</h1>
      <p class="mt-1 text-base font-semibold" style="color: #84CC16;">Adaptive AI Fitness Coach</p>
      <div class="mt-4 flex flex-col gap-2 text-left" style="max-width: 320px; margin: 0 auto;">
        <div class="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#84CC16" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span class="text-sm" style="color: #9B9BA4;">Auto rest timer — just train, we'll count</span>
        </div>
        <div class="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#84CC16" stroke-width="2" stroke-linecap="round"><path d="M12 20V10M6 20V4M18 20v-6"/></svg>
          <span class="text-sm" style="color: #9B9BA4;">Weights adjust in real-time to how you feel</span>
        </div>
        <div class="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#84CC16" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <span class="text-sm" style="color: #9B9BA4;">Every day is planned — never guess again</span>
        </div>
        <div class="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#84CC16" stroke-width="2" stroke-linecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span class="text-sm" style="color: #9B9BA4;">Program adapts each week from your data</span>
        </div>
      </div>
    </div>

    <!-- Card -->
    <div class="rounded-2xl p-6" style="background: #161618; border: 1px solid #2A2A2E;">

      <!-- Error -->
      {#if form?.error}
        <div class="mb-5 rounded-xl px-4 py-3 text-base font-medium" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #F87171;">
          {form.error}
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
        class="flex flex-col gap-5"
      >
        <!-- Username -->
        <div class="flex flex-col gap-1.5">
          <label for="username" class="text-base font-medium" style="color: #9B9BA4;">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autocomplete="username"
            autocapitalize="none"
            required
            placeholder="your_username"
            class="w-full rounded-xl px-4 py-3 text-base outline-none transition-all"
            style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
            onfocus={(e) => (e.currentTarget.style.borderColor = '#84CC16')}
            onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
          />
        </div>

        <!-- Password -->
        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-base font-medium" style="color: #9B9BA4;">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="••••••••"
            class="w-full rounded-xl px-4 py-3 text-base outline-none transition-all"
            style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
            onfocus={(e) => (e.currentTarget.style.borderColor = '#84CC16')}
            onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          disabled={loading}
          class="w-full rounded-xl py-3.5 text-base font-bold tracking-wide transition-all duration-200 active:scale-95"
          style="background: #84CC16; color: #fff; opacity: {loading ? 0.7 : 1};"
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>
    </div>

    <!-- Onboarding link -->
    <p class="text-center mt-6 text-base" style="color: #9B9BA4;">
      First time?
      <a href="/onboarding" class="font-semibold ml-1" style="color: #84CC16;">
        Set up your account →
      </a>
    </p>
  </div>
</div>
