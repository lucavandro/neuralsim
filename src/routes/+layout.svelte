<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { anim, initWeights, fwd } from '$lib/network.svelte.js';
  import { loadWeights } from '$lib/persistence.js';
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();

  $effect(() => {
    if ($page.url.pathname !== '/' && anim.running) anim.running = false;
  });

  onMount(() => {
    initWeights();
    if (!loadWeights()) initWeights();
    fwd(175, 70);
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>Rete Neurale Interattiva</title>
</svelte:head>

<header>
  <div class="header-left">
    <h1>Rete Neurale <span>Interattiva</span></h1>
    <nav id="tabs">
      <a href="/" class="tab-btn" class:active={$page.url.pathname === '/'}>Rete</a>
      <a href="/training-data" class="tab-btn" class:active={$page.url.pathname === '/training-data'}>Dati Training</a>
      <a href="/matrix-training" class="tab-btn" class:active={$page.url.pathname === '/matrix-training'}>Training Matrix</a>
    </nav>
  </div>
</header>

<main>
  {@render children()}
</main>

<style>
  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #0f0f1a; color: #e0e0e0; height: 100vh; overflow: hidden; display: flex; justify-content: center; align-items: center; }
  :global(#app) { display: flex; flex-direction: column; width: 100vw; height: 100vh; background: #1a1a2e; }
  :global(main) { display: flex; flex: 1; min-height: 0; }

  header { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: #16213e; border-bottom: 1px solid #0f3460; flex-shrink: 0; }
  .header-left { display: flex; align-items: center; gap: 32px; }
  header h1 { font-size: 20px; font-weight: 600; color: #e94560; }
  header h1 span { color: #a0a0c0; font-weight: 300; }
  :global(#tabs) { display: flex; gap: 4px; }
  .tab-btn { padding: 6px 18px; border: none; border-radius: 6px; background: transparent; color: #666688; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .2s; text-decoration: none; }
  .tab-btn:hover { color: #a0a0c0; background: rgba(255, 255, 255, 0.05); }
  .tab-btn.active { color: #4fc3f7; background: rgba(79, 195, 247, 0.1); }

  @media (max-width: 820px) {
    header { flex-wrap: wrap; gap: 8px; padding: 10px 16px; }
    header h1 { font-size: 17px; }
    .header-left { gap: 16px; flex-wrap: wrap; }
    .tab-btn { font-size: 12px; padding: 5px 12px; }
  }
  @media (max-width: 640px) {
    :global(main) { flex-direction: column; }
  }
  @media (max-width: 480px) {
    header { padding: 8px 10px; }
    header h1 { font-size: 15px; }
    .header-left { gap: 10px; }
    :global(#tabs) { gap: 2px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .tab-btn { font-size: 11px; padding: 4px 10px; white-space: nowrap; }
   
  }
</style>
