<script>
  import { net, anim, speedConfig, selection, fwd, LABELS, L_IN, L_HID, L_OUT, applyLoadedData } from '$lib/network.svelte.js';
  import { train } from '$lib/training.js';
  import { saveWeights, downloadWeights } from '$lib/persistence.js';

  let hInput = $state(175);
  let wInput = $state(70);


  let resultText = $derived(anim.phase >= 6 ? (anim.result ? "In forma" : "Non in forma") : "In attesa...");
  let resultClass = $derived(anim.phase >= 6 ? (anim.result ? "yes" : "no") : "waiting");

  $effect(() => {
    var h = +hInput || 175, w = +wInput || 70;
    fwd(h, w);
    anim.phase = 0;
  });

  $effect(() => {
    if (!anim.running && anim.phase < 6) {
      document.getElementById("btn-play").disabled = false;
    }
  });

  function handlePlay() {
    var h = +hInput || 175, w = +wInput || 70;
    fwd(h, w);
    anim.result = (net.ov > 0.5);
    anim.running = true;
  }

  function handleTrain() {
    if (anim.running) return;
    var btn = document.getElementById("btn-train");
    btn.disabled = true;
    setTimeout(function() {
      var result = train();
      btn.disabled = false;
      saveWeights();
      
      var h = +hInput || 175, w = +wInput || 70;
      fwd(h, w);
      anim.phase = 0;
    }, 50);
  }

  function handleLoad() { document.getElementById("file-input").click(); }

  function handleFileChange(e) {
    if (anim.running) return;
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (!applyLoadedData(data)) { alert("Formato file non valido."); return; }
        var h = +hInput || 175, w = +wInput || 70;
        fwd(h, w);
        anim.phase = 0;
           } catch(err) { alert("Errore: " + err.message); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleSave() {
    var v = +selection.value;
    if (isNaN(v)) return;
    if (selection.bias) {
      if (selection.bias.layer === L_HID) net.biases.hidden[selection.bias.index] = v;
      else net.biases.output = v;
    } else if (selection.conn) {
      var c = net.weights.find(function(x) {
        return x.from[0] === selection.conn.from[0] && x.from[1] === selection.conn.from[1] &&
               x.to[0] === selection.conn.to[0] && x.to[1] === selection.conn.to[1];
      });
      if (c) c.w = v;
    }
    var h = +hInput || 175, w = +wInput || 70;
    fwd(h, w);
    anim.phase = 0;
  }

  function handleKey(e) { if (e.key === "Enter") handleSave(); }
</script>

<div id="control-panel">
  <div class="panel-section">
    <h3>Input</h3>
    <div class="input-row">
      <label for="input-height">Altezza</label>
      <input id="input-height" type="number" bind:value={hInput} min="100" max="220" step="1">
      <span class="unit">cm</span>
      <span class="norm">{(hInput / 200).toFixed(2)}</span>
    </div>
    <div class="input-row">
      <label for="input-weight">Peso</label>
      <input id="input-weight" type="number" bind:value={wInput} min="30" max="200" step="0.5">
      <span class="unit">kg</span>
      <span class="norm">{(wInput / 150).toFixed(2)}</span>
    </div>
  </div>

  <div class="panel-section">
    <h3>Controlli</h3>
    <div class="btn-row">
      <button class="btn btn-play" id="btn-play" onclick={handlePlay} disabled={anim.running}>{anim.running ? "\u23F8 In esecuzione..." : "\u25B6 Play"}</button>
      <button class="btn btn-load" onclick={handleLoad}>&#128194; Carica JSON</button>
    </div>
    <div class="btn-row" style="margin-top:8px">
      <button class="btn btn-train" id="btn-train" onclick={handleTrain}>&#9889; Train</button>
      <button class="btn btn-download" onclick={downloadWeights}>&#11015; Download</button>
    </div>
    <input type="file" id="file-input" accept=".json" style="display:none" onchange={handleFileChange}>
  </div>

  <div class="panel-section">
    <h3>Velocit&agrave;</h3>
    <div class="speed-row">
      <label for="speed-slider">0.25</label>
      <input id="speed-slider" type="range" min="0.25" max="3" step="0.05" bind:value={speedConfig.value}>
      <span class="speed-val">{+speedConfig.value.toFixed(2)}x</span>
    </div>
  </div>

  <div class="panel-section">
    <h3>Risultato</h3>
    <div id="result-box" class={resultClass}>{resultText}</div>
  </div>

  <div class="panel-section">
    <h3>Uscita Rete</h3>
    <div id="output-display">
      <div class="value">{net.ov !== undefined ? net.ov.toFixed(4) : "---"}</div>
      <div class="label">Valore Neurone Output</div>
    </div>
  </div>

  <div class="panel-section" id="weight-editor" class:visible={selection.visible}>
    <h3>Modifica {selection.bias ? "Bias" : "Peso"}</h3>
    <div class="conn-label">{selection.label}</div>
    <div class="edit-row">
      <input type="number" bind:value={selection.value} step="0.1" onkeydown={handleKey}>
      <button class="save-btn" onclick={handleSave}>Salva</button>
    </div>
  </div>
</div>

<style>
  #control-panel { width: 300px; flex-shrink: 0; background: #16213e; border-left: 1px solid #0f3460; padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
  .panel-section { background: #1a1a2e; border-radius: 10px; padding: 16px; }
  .panel-section h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #8888aa; margin-bottom: 12px; }
  :global(.input-row) { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  :global(.input-row:last-child) { margin-bottom: 0; }
  :global(.input-row label) { font-size: 14px; color: #a0a0c0; min-width: 60px; }
  :global(.input-row input[type=number]) { flex: 1; padding: 8px 10px; border: 1px solid #0f3460; border-radius: 6px; background: #0f0f1a; color: #e0e0e0; font-size: 14px; font-family: Consolas, monospace; outline: none; }
  :global(.input-row input[type=number]:focus) { border-color: #4fc3f7; }
  :global(.input-row .unit) { font-size: 13px; color: #666; min-width: 24px; }
  :global(.input-row .norm) { font-size: 11px; color: #555; min-width: 40px; text-align: right; }
  :global(.btn-row) { display: flex; gap: 8px; }
  :global(.btn) { flex: 1; padding: 10px 0; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .2s; }
  :global(.btn-play) { background: #e94560; color: #fff; }
  :global(.btn-play:hover:not(:disabled)) { background: #ff6b81; transform: translateY(-1px); }
  :global(.btn-play:disabled) { opacity: 0.4; cursor: not-allowed; }
  :global(.btn-load) { background: #0f3460; color: #a0a0c0; }
  :global(.btn-load:hover) { background: #1a4a7a; color: #fff; }
  :global(.btn-train) { background: #6a1b9a; color: #fff; }
  :global(.btn-train:hover:not(:disabled)) { background: #8e24aa; transform: translateY(-1px); }
  :global(.btn-train:disabled) { opacity: 0.4; cursor: not-allowed; }
  :global(.btn-download) { background: #00695c; color: #fff; }
  :global(.btn-download:hover) { background: #00897b; transform: translateY(-1px); }
  :global(#result-box) { text-align: center; padding: 16px; border-radius: 8px; font-size: 18px; font-weight: 600; transition: all .4s; }
  :global(#result-box.waiting) { background: #0f0f1a; color: #555; }
  :global(#result-box.yes) { background: #1b3a2d; color: #81c784; }
  :global(#result-box.no) { background: #3a1b1b; color: #e57373; }
  #weight-editor { display: none; }
  #weight-editor.visible { display: block; }
  #weight-editor .conn-label { font-size: 12px; color: #8888aa; margin-bottom: 8px; }
  #weight-editor .edit-row { display: flex; align-items: center; gap: 8px; }
  #weight-editor input { flex: 1; padding: 8px 10px; border: 1px solid #e94560; border-radius: 6px; background: #0f0f1a; color: #e0e0e0; font-size: 14px; font-family: Consolas, monospace; outline: none; }
  #weight-editor .save-btn { padding: 8px 16px; border: none; border-radius: 6px; background: #e94560; color: #fff; cursor: pointer; font-weight: 600; font-size: 13px; }
  #weight-editor .save-btn:hover { background: #ff6b81; }
  :global(#output-display) { text-align: center; }
  :global(#output-display .value) { font-size: 28px; font-weight: 700; font-family: Consolas, monospace; color: #4fc3f7; }
  :global(#output-display .label) { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
  :global(.speed-row) { display: flex; align-items: center; gap: 10px; }
  :global(.speed-row label) { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  :global(.speed-row input[type=range]) { flex: 1; -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: #0f3460; outline: none; cursor: pointer; }
  :global(.speed-val) { font-size: 14px; font-weight: 600; font-family: Consolas, monospace; color: #4fc3f7; min-width: 36px; text-align: right; }
</style>
