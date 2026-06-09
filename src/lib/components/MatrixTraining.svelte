<script>
  import { net, sigmoid, N_HID } from '$lib/network.svelte.js';
  import { getTrainingData } from '$lib/data/training-data.js';

  const L_IN_ = 0, L_HID_ = 1, L_OUT_ = 2;
  const MAX_EPOCH = 50000;
  const LR = 1;

  let running = $state(false);
  let epoch = $state(0);
  let loss = $state("---");
  let acc = $state("---");
  let delay = $state(200);
  let timeoutId = 0;

  let mW1 = $state([[0,0,0],[0,0,0]]);
  let mb1 = $state([0,0,0]);
  let mW2 = $state([0,0,0]);
  let mb2 = $state(0);

  let normData = [];
  let w1Dims = [2, 3], b1Dims = [1, 3], w2Dims = [3, 1], b2Dims = [1, 1];

  function reset() {
    running = false;
    epoch = 0;
    loss = "---";
    acc = "---";
    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < 3; j++) {
        var w = net.weights.find(function(x) { return x.from[0] === L_IN_ && x.from[1] === i && x.to[0] === L_HID_ && x.to[1] === j; });
        mW1[i][j] = w ? w.w : 0;
      }
    }
    for (var j = 0; j < 3; j++) {
      var w = net.weights.find(function(x) { return x.from[0] === L_HID_ && x.from[1] === j && x.to[0] === L_OUT_ && x.to[1] === 0; });
      mW2[j] = w ? w.w : 0;
    }
    mb1 = [net.biases.hidden[0], net.biases.hidden[1], net.biases.hidden[2]];
    mb2 = net.biases.output;

    var data = getTrainingData();
    normData = data.map(function(d) {
      return { x: [Math.max(0, Math.min(1, d.h / 200)), Math.max(0, Math.min(1, d.w / 150))], y: d.label };
    });
  }

  function stepEpoch() {
    var n = normData.length;
    var W1 = mW1, W2 = mW2, b1 = mb1, nB2 = mb2;
    var dW1 = [[0,0,0],[0,0,0]], db1 = [0,0,0], dW2 = [0,0,0], db2 = 0;

    for (var k = 0; k < n; k++) {
      var d = normData[k], x0 = d.x[0], x1 = d.x[1];
      var zh0 = x0 * W1[0][0] + x1 * W1[1][0] + b1[0];
      var zh1 = x0 * W1[0][1] + x1 * W1[1][1] + b1[1];
      var zh2 = x0 * W1[0][2] + x1 * W1[1][2] + b1[2];
      var ah0 = sigmoid(zh0), ah1 = sigmoid(zh1), ah2 = sigmoid(zh2);
      var zo = ah0 * W2[0] + ah1 * W2[1] + ah2 * W2[2] + nB2;
      var ao = sigmoid(zo);
      var dz = ao - d.y;
      dW2[0] += dz * ah0; dW2[1] += dz * ah1; dW2[2] += dz * ah2; db2 += dz;
      var dz_h0 = dz * W2[0] * ah0 * (1 - ah0);
      var dz_h1 = dz * W2[1] * ah1 * (1 - ah1);
      var dz_h2 = dz * W2[2] * ah2 * (1 - ah2);
      dW1[0][0] += dz_h0 * x0; dW1[0][1] += dz_h1 * x0; dW1[0][2] += dz_h2 * x0;
      dW1[1][0] += dz_h0 * x1; dW1[1][1] += dz_h1 * x1; dW1[1][2] += dz_h2 * x1;
      db1[0] += dz_h0; db1[1] += dz_h1; db1[2] += dz_h2;
    }
    for (var i = 0; i < 2; i++)
      for (var j = 0; j < 3; j++) W1[i][j] -= LR * dW1[i][j] / n;
    for (var j = 0; j < 3; j++) { b1[j] -= LR * db1[j] / n; W2[j] -= LR * dW2[j] / n; }
    mb2 -= LR * db2 / n;
    epoch++;
  }

  function computeMetrics() {
    var n = normData.length;
    var lossV = 0, correct = 0, tot = n || 1;
    for (var k = 0; k < n; k++) {
      var d = normData[k], x0 = d.x[0], x1 = d.x[1], y = d.y;
      var zh0 = x0 * mW1[0][0] + x1 * mW1[1][0] + mb1[0];
      var zh1 = x0 * mW1[0][1] + x1 * mW1[1][1] + mb1[1];
      var zh2 = x0 * mW1[0][2] + x1 * mW1[1][2] + mb1[2];
      var zo = sigmoid(zh0) * mW2[0] + sigmoid(zh1) * mW2[1] + sigmoid(zh2) * mW2[2] + mb2;
      var ao = sigmoid(zo);
      lossV += -y * Math.log(ao + 1e-15) - (1 - y) * Math.log(1 - ao + 1e-15);
      if ((ao > 0.5 ? 1 : 0) === y) correct++;
    }
    loss = (lossV / tot).toFixed(4);
    acc = (correct / tot * 100).toFixed(1) + "%";
    return correct / tot;
  }

  function loop() {
    if (!running) return;
    stepEpoch();
    var a = computeMetrics();
    if (a >= 0.95 || epoch >= MAX_EPOCH) { running = false; return; }
    timeoutId = setTimeout(loop, delay);
  }

  function toggle() {
    if (running) {
      running = false;
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = 0; }
    } else {
      if (epoch === 0) reset();
      running = true;
      loop();
    }
  }
</script>

<div class="mt-container">
  <div class="mt-header">
    <div class="mt-controls">
      <button class="btn btn-play" onclick={toggle}>{running ? "\u23F8 Pause" : "\u25B6 Start"}</button>
      <div class="mt-speed">
        <label for="mt-delay-slider">Ritardo: {delay}ms</label>
        <input id="mt-delay-slider" type="range" min="50" max="2000" step="50" bind:value={delay}>
      </div>
    </div>
    <div class="mt-info">
      Epoca: <span>{epoch}</span> &nbsp;|&nbsp; Loss: <span>{loss}</span> &nbsp;|&nbsp; Accuracy: <span>{acc}</span>
    </div>
  </div>
  <div class="mt-matrices">
    <div class="mt-matrix-group">
      <h3>W&#x2081;</h3>
      <div class="mt-matrix">
        <table>
          <tbody>
            {#each mW1 as row}
              <tr>
                {#each row as val}
                  <td class={val > 0.01 ? "highlight" : (val < -0.01 ? "neg-highlight" : "")}>{val.toFixed(4)}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-matrix-group">
      <h3>b&#x2081;</h3>
      <div class="mt-matrix">
        <table>
          <tbody>
            <tr>
              {#each mb1 as val}
                <td class={val > 0.01 ? "highlight" : (val < -0.01 ? "neg-highlight" : "")}>{val.toFixed(4)}</td>
              {/each}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-matrix-group">
      <h3>W&#x2082;</h3>
      <div class="mt-matrix">
        <table>
          <tbody>
            {#each mW2 as val}
              <tr>
                <td class={val > 0.01 ? "highlight" : (val < -0.01 ? "neg-highlight" : "")}>{val.toFixed(4)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-matrix-group">
      <h3>b&#x2082;</h3>
      <div class="mt-matrix">
        <table>
          <tbody>
            <tr>
              <td class={mb2 > 0.01 ? "highlight" : (mb2 < -0.01 ? "neg-highlight" : "")}>{mb2.toFixed(4)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<style>
  .mt-container { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
  .mt-header { display: flex; align-items: center; justify-content: space-between; background: #16213e; border-radius: 12px; padding: 16px 24px; flex-wrap: wrap; gap: 12px; }
  .mt-controls { display: flex; align-items: center; gap: 16px; }
  .mt-controls .btn { flex: 0 1 auto; padding: 8px 20px; }
  .mt-speed { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #a0a0c0; }
  .mt-speed input[type=range] { width: 120px; -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: #0f3460; outline: none; cursor: pointer; }
  .mt-info { font-size: 13px; color: #c0c0d0; font-family: Consolas, monospace; }
  .mt-info span { font-weight: 700; color: #4fc3f7; }
  .mt-matrices { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .mt-matrix-group { background: #16213e; border-radius: 12px; padding: 16px; }
  .mt-matrix-group h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #8888aa; margin-bottom: 12px; }
  .mt-matrix table { width: 100%; border-collapse: collapse; font-size: 12px; font-family: Consolas, monospace; }
  .mt-matrix td { padding: 6px 10px; text-align: center; border: 1px solid #0f3460; color: #c0c0d0; min-width: 50px; transition: all .3s; }
  .mt-matrix td.highlight { background: #4fc3f7; color: #0f0f1a; font-weight: 700; border-color: #4fc3f7; }
  .mt-matrix td.neg-highlight { background: #e94560; color: #fff; font-weight: 700; border-color: #e94560; }
</style>
