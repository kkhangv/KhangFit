<script>
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div style="background:#0A0A0B; min-height:100vh; color:#F1F1F3; font-family: system-ui, sans-serif;">
  {@render children()}
</div>
