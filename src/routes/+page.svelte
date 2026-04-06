<script>
  import { enhance } from '$app/forms';

  let { form } = $props();

  let loading = $state(false);
</script>

<svelte:head>
  <title>LIFT — Log In</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-12" style="background: #0A0A0B;">
  <div class="w-full" style="max-width: 400px;">

    <!-- Logo / Title -->
    <div class="text-center mb-10">
      <div
        class="inline-flex items-center justify-center rounded-2xl mb-4"
        style="width: 64px; height: 64px; background: #3B82F6;"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12" />
        </svg>
      </div>
      <h1 class="text-4xl font-black tracking-tight" style="color: #F1F1F3;">LIFT</h1>
      <p class="mt-2 text-sm" style="color: #9B9BA4;">Your 4-day hypertrophy program</p>
    </div>

    <!-- Card -->
    <div class="rounded-2xl p-6" style="background: #161618; border: 1px solid #2A2A2E;">

      <!-- Error -->
      {#if form?.error}
        <div class="mb-5 rounded-xl px-4 py-3 text-sm font-medium" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #F87171;">
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
          <label for="username" class="text-sm font-medium" style="color: #9B9BA4;">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autocomplete="username"
            autocapitalize="none"
            required
            placeholder="your_username"
            class="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
            onfocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
            onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
          />
        </div>

        <!-- Password -->
        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-sm font-medium" style="color: #9B9BA4;">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="••••••••"
            class="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style="background: #0A0A0B; border: 1px solid #2A2A2E; color: #F1F1F3;"
            onfocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
            onblur={(e) => (e.currentTarget.style.borderColor = '#2A2A2E')}
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          disabled={loading}
          class="w-full rounded-xl py-3.5 text-sm font-bold tracking-wide transition-all duration-200 active:scale-95"
          style="background: #3B82F6; color: #fff; opacity: {loading ? 0.7 : 1};"
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>
    </div>

    <!-- Onboarding link -->
    <p class="text-center mt-6 text-sm" style="color: #9B9BA4;">
      First time?
      <a href="/onboarding" class="font-semibold ml-1" style="color: #3B82F6;">
        Set up your account →
      </a>
    </p>
  </div>
</div>
