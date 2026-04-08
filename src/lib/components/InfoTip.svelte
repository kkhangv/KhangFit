<script>
  let { text, citation = null, formula = null } = $props();
  let open = $state(false);
</script>

<span class="inline-flex items-center" style="position: relative;">
  <span
    role="button"
    tabindex="0"
    onclick={(e) => { e.stopPropagation(); open = !open; }}
    onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); open = !open; } }}
    class="inline-flex items-center justify-center rounded-full cursor-pointer shrink-0"
    style="
      width: 18px; height: 18px; font-size: 11px; font-weight: 700;
      background: {open ? '#84CC16' : '#2A2A2E'};
      color: {open ? '#fff' : '#9B9BA4'};
      transition: all 0.15s;
      line-height: 1;
    "
    title="More info"
  >i</span>

  {#if open}
    <!-- Backdrop -->
    <div
      style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 49;"
      onclick={() => (open = false)}
    ></div>

    <!-- Popover -->
    <div
      style="
        position: absolute; left: 24px; top: -8px; z-index: 50;
        background: #1E1E22; border: 1px solid #84CC16; border-radius: 12px;
        padding: 12px 14px; min-width: 260px; max-width: 320px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      "
    >
      <p style="color: #F1F1F3; font-size: 13px; line-height: 1.5; margin: 0;">
        {text}
      </p>

      {#if formula}
        <div
          style="
            margin-top: 8px; padding: 6px 10px; border-radius: 8px;
            background: #0A0A0B; font-family: monospace; font-size: 12px;
            color: #F97316;
          "
        >{formula}</div>
      {/if}

      {#if citation}
        <p style="color: #6B6B75; font-size: 11px; margin-top: 8px; margin-bottom: 0; line-height: 1.4;">
          {citation}
        </p>
      {/if}
    </div>
  {/if}
</span>
