<script>
  import { anim } from '$lib/network.svelte.js';
  import NetworkCanvas from '$lib/components/NetworkCanvas.svelte';
  import ControlPanel from '$lib/components/ControlPanel.svelte';

  $effect(() => {
    if (!anim.running && anim.phase >= 6) {
      document.getElementById("header-status").className = "done";
      document.getElementById("header-status").textContent = anim.result ? "In forma" : "Non in forma";
    }
  });
</script>

<div id="tab-rete">
  <NetworkCanvas />
  <ControlPanel />
</div>

<style>
  #tab-rete { display: flex; flex: 1; min-height: 0; }
  @media (max-width: 640px) { #tab-rete { flex-direction: column; } }
</style>
