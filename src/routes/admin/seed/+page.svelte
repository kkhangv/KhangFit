<script>
  let loading = $state(false);
  let result = $state(null);
  let error = $state(null);

  async function seedDatabase() {
    loading = true;
    result = null;
    error = null;

    try {
      const res = await fetch('/admin/seed', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        error = data.error || `HTTP ${res.status}`;
        return;
      }

      result = data;
    } catch (err) {
      error = err.message || 'Network error';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Seed Database | Admin</title>
</svelte:head>

<div class="page">
  <div class="card">
    <h1>Seed Database</h1>
    <p class="subtitle">
      Populate Redis with all programs, exercises, cardio data, and training config.
      This is safe to run multiple times &mdash; existing keys will be overwritten.
    </p>

    <button class="seed-btn" onclick={seedDatabase} disabled={loading}>
      {#if loading}
        <span class="spinner"></span>
        Seeding&hellip;
      {:else}
        Seed Database
      {/if}
    </button>

    {#if error}
      <div class="message error">
        <strong>Error:</strong> {error}
      </div>
    {/if}

    {#if result}
      <div class="message success">
        <strong>Success!</strong> Database seeded.
      </div>

      <div class="counts">
        <div class="count-row">
          <span class="count-label">Programs</span>
          <span class="count-value">{result.counts.programs}</span>
        </div>
        <div class="count-row">
          <span class="count-label">Day arrays</span>
          <span class="count-value">{result.counts.dayArrays}</span>
        </div>
        <div class="count-row">
          <span class="count-label">Exercises</span>
          <span class="count-value">{result.counts.exercises}</span>
        </div>
        <div class="count-row">
          <span class="count-label">Cardio types</span>
          <span class="count-value">{result.counts.cardioTypes}</span>
        </div>
        <div class="count-row">
          <span class="count-label">Cardio templates</span>
          <span class="count-value">{result.counts.cardioTemplates}</span>
        </div>
        <div class="count-row">
          <span class="count-label">Peloton protocols</span>
          <span class="count-value">{result.counts.pelotonProtocols}</span>
        </div>
        <div class="count-row">
          <span class="count-label">Cardio schedules</span>
          <span class="count-value">{result.counts.cardioSchedules}</span>
        </div>
        <div class="count-row">
          <span class="count-label">Config keys</span>
          <span class="count-value">{result.counts.configKeys}</span>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    background: #0A0A0B;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .card {
    background: #161618;
    border: 1px solid #2a2a2e;
    border-radius: 12px;
    padding: 2.5rem;
    max-width: 480px;
    width: 100%;
  }

  h1 {
    color: #F1F1F3;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
  }

  .subtitle {
    color: #888;
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0 0 1.5rem;
  }

  .seed-btn {
    width: 100%;
    padding: 0.75rem 1.5rem;
    background: #3B82F6;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .seed-btn:hover:not(:disabled) {
    background: #2563EB;
  }

  .seed-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .message {
    margin-top: 1.25rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
  }

  .message.success {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #4ade80;
  }

  .message.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
  }

  .counts {
    margin-top: 1rem;
    border: 1px solid #2a2a2e;
    border-radius: 8px;
    overflow: hidden;
  }

  .count-row {
    display: flex;
    justify-content: space-between;
    padding: 0.625rem 1rem;
    border-bottom: 1px solid #2a2a2e;
  }

  .count-row:last-child {
    border-bottom: none;
  }

  .count-label {
    color: #888;
    font-size: 0.8125rem;
  }

  .count-value {
    color: #F1F1F3;
    font-weight: 600;
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
  }
</style>
