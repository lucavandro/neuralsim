<script>
  import MatrixTraining from '$lib/components/MatrixTraining.svelte';
</script>

<div id="tab-matrix-training">
  <MatrixTraining />
</div>

<style>
  #tab-matrix-training { overflow-y: auto; padding: 32px; flex: 1; min-height: 0; }
  @media (max-width: 820px) { #tab-matrix-training { padding: 20px; } }
  @media (max-width: 480px) { #tab-matrix-training { padding: 12px; } }
</style>
