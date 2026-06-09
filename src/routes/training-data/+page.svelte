<script>
  import TrainingData from '$lib/components/TrainingData.svelte';
</script>

<div id="tab-training-data">
  <TrainingData />
</div>

<style>
  #tab-training-data { overflow-y: auto; padding: 32px; flex: 1; min-height: 0; }
  @media (max-width: 820px) { #tab-training-data { padding: 20px; } }
  @media (max-width: 480px) { #tab-training-data { padding: 12px; } }
</style>
