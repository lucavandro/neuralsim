<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { anim, initWeights, fwd } from '$lib/network.svelte.js';
  import { loadWeights } from '$lib/persistence.js';
  import favicon from '$lib/assets/favicon.svg';
  import { currentTheme, toggleTheme, setTheme } from '$lib/theme.svelte.js';

  let { children } = $props();

  $effect(() => {
    if ($page.url.pathname !== '/' && anim.running) anim.running = false;
  });

  onMount(() => {
    setTheme($currentTheme);
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
      <a href="/neuralsim" class="tab-btn" class:active={$page.url.pathname === '/'}>Rete</a>
      <a href="/neuralsim/training-data" class="tab-btn" class:active={$page.url.pathname === '/training-data'}>Dati Training</a>
      <a href="/neuralsim/matrix-training" class="tab-btn" class:active={$page.url.pathname === '/matrix-training'}>Training Matrix</a>
    </nav>
  </div>
  <button id="theme-toggle" onclick={toggleTheme} title="Cambia tema">
    {$currentTheme === 'dark' ? '\u2600' : '\u263E'}
  </button>
</header>

<main>
  {@render children()}
</main>

<style>
  :root, :global([data-theme="dark"]) {
    --bg-body: #0f0f1a;
    --bg-app: #1a1a2e;
    --bg-surface: #16213e;
    --bg-elevated: #1a1a2e;
    --bg-input: #0f0f1a;
    --text-primary: #e0e0e0;
    --text-secondary: #a0a0c0;
    --text-muted: #8888aa;
    --text-dim: #666688;
    --text-faint: #555577;
    --border: #0f3460;
    --accent: #4fc3f7;
    --accent-hover: #29b6f6;
    --accent-bg: rgba(79, 195, 247, 0.1);
    --danger: #e94560;
    --danger-hover: #ff6b81;
    --success: #81c784;
    --error: #e57373;
    --btn-load: #0f3460;
    --btn-load-hover: #1a4a7a;
    --btn-load-text: #a0a0c0;
    --btn-load-hover-text: #fff;
    --btn-train: #6a1b9a;
    --btn-train-hover: #8e24aa;
    --btn-download: #00695c;
    --btn-download-hover: #00897b;
    --result-yes-bg: #1b3a2d;
    --result-no-bg: #3a1b1b;
    --canvas-bg: #1a1a2e;
    --canvas-inactive-fill: #2a2a3e;
    --canvas-inactive-stroke: #3a3a5e;
    --canvas-text: #aaaacc;
    --canvas-label: #666688;
    --canvas-layer-label: #444466;
    --canvas-conn-idle: rgba(60, 60, 90, 0.5);
    --canvas-weight: rgba(150, 150, 180, 0.7);
    --canvas-hint-bg: rgba(26, 26, 46, 0.85);
    --canvas-hint-text: #444466;
    --table-header-bg: #0f0f1a;
    --table-header-text: #666688;
    --table-border: #0f3460;
    --table-text: #c0c0d0;
    --table-hover: rgba(79, 195, 247, 0.04);
    --unit-text: #666;
    --norm-text: #555;
    --highlight-pos: #4fc3f7;
    --highlight-neg: #e94560;
  }

  :global([data-theme="light"]) {
    --bg-body: #eef0f4;
    --bg-app: #ffffff;
    --bg-surface: #f5f7fa;
    --bg-elevated: #ffffff;
    --bg-input: #ffffff;
    --text-primary: #1a1a2e;
    --text-secondary: #555577;
    --text-muted: #8888aa;
    --text-dim: #9999bb;
    --text-faint: #aaaacc;
    --border: #dde1e8;
    --accent: #1976d2;
    --accent-hover: #1565c0;
    --accent-bg: rgba(25, 118, 210, 0.08);
    --danger: #d32f2f;
    --danger-hover: #e53935;
    --success: #2e7d32;
    --error: #c62828;
    --btn-load: #e0e4eb;
    --btn-load-hover: #cdd2da;
    --btn-load-text: #555577;
    --btn-load-hover-text: #1a1a2e;
    --btn-train: #7b1fa2;
    --btn-train-hover: #8e24aa;
    --btn-download: #00695c;
    --btn-download-hover: #00897b;
    --result-yes-bg: #e8f5e9;
    --result-no-bg: #ffebee;
    --canvas-bg: #fafafa;
    --canvas-inactive-fill: #f0f0f4;
    --canvas-inactive-stroke: #d0d0dc;
    --canvas-text: #444466;
    --canvas-label: #8888aa;
    --canvas-layer-label: #bbbbbb;
    --canvas-conn-idle: rgba(180, 180, 200, 0.5);
    --canvas-weight: rgba(100, 100, 130, 0.6);
    --canvas-hint-bg: rgba(245, 245, 250, 0.9);
    --canvas-hint-text: #999999;
    --table-header-bg: #f0f2f6;
    --table-header-text: #8888aa;
    --table-border: #e0e4eb;
    --table-text: #444466;
    --table-hover: rgba(25, 118, 210, 0.04);
    --unit-text: #999;
    --norm-text: #aaa;
    --highlight-pos: #1976d2;
    --highlight-neg: #d32f2f;
  }

  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: var(--bg-body); color: var(--text-primary); height: 100vh; overflow: hidden; display: flex; justify-content: center; align-items: center; }
  :global(#app) { display: flex; flex-direction: column; width: 100vw; height: 100vh; background: var(--bg-app); }
  :global(main) { display: flex; flex: 1; min-height: 0; }

  header { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: var(--bg-surface); border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .header-left { display: flex; align-items: center; gap: 32px; }
  header h1 { font-size: 20px; font-weight: 600; color: var(--danger); }
  header h1 span { color: var(--text-secondary); font-weight: 300; }
  :global(#tabs) { display: flex; gap: 4px; }
  .tab-btn { padding: 6px 18px; border: none; border-radius: 6px; background: transparent; color: var(--text-dim); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .2s; text-decoration: none; }
  .tab-btn:hover { color: var(--text-secondary); background: rgba(128, 128, 128, 0.08); }
  .tab-btn.active { color: var(--accent); background: var(--accent-bg); }

  #theme-toggle { background: none; border: 1px solid var(--border); border-radius: 8px; color: var(--text-secondary); font-size: 18px; cursor: pointer; padding: 6px 10px; line-height: 1; transition: all .2s; }
  #theme-toggle:hover { background: var(--accent-bg); color: var(--accent); border-color: var(--accent); }

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
