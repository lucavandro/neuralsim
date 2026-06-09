import { getWeightMatrix, applyLoadedData } from '$lib/network.svelte.js';

export function saveWeights() {
  localStorage.setItem("neuralsim-weights", JSON.stringify(getWeightMatrix()));
}

export function loadWeights() {
  var saved = localStorage.getItem("neuralsim-weights");
  if (!saved) return false;
  try {
    return applyLoadedData(JSON.parse(saved));
  } catch (e) {
    return false;
  }
}

export function downloadWeights() {
  var obj = getWeightMatrix();
  var blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "weights.json";
  a.click();
  URL.revokeObjectURL(url);
}
