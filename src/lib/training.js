import { N_HID, sigmoid } from '$lib/network.svelte.js';
import { net } from '$lib/network.svelte.js';
import { getTrainingData } from '$lib/data/training-data.js';

const L_IN_ = 0, L_HID_ = 1, L_OUT_ = 2;

export function train() {
  var data = getTrainingData();
  var n = data.length;
  var maxEpoch = 50000;
  var lr = 1;

  var W1 = [[0, 0, 0], [0, 0, 0]];
  var b1 = [net.biases.hidden[0], net.biases.hidden[1], net.biases.hidden[2]];
  var W2 = [0, 0, 0];
  var b2 = net.biases.output;

  for (var i = 0; i < 2; i++) {
    for (var j = 0; j < 3; j++) {
      var w = net.weights.find(function(x) {
        return x.from[0] === L_IN_ && x.from[1] === i && x.to[0] === L_HID_ && x.to[1] === j;
      });
      if (w) W1[i][j] = w.w;
    }
  }
  for (var j = 0; j < 3; j++) {
    var w = net.weights.find(function(x) {
      return x.from[0] === L_HID_ && x.from[1] === j && x.to[0] === L_OUT_ && x.to[1] === 0;
    });
    if (w) W2[j] = w.w;
  }

  var normData = data.map(function(d) {
    return {
      x: [Math.max(0, Math.min(1, d.h / 200)), Math.max(0, Math.min(1, d.w / 150))],
      y: d.label
    };
  });

  var bestW1 = [[W1[0][0], W1[0][1], W1[0][2]], [W1[1][0], W1[1][1], W1[1][2]]];
  var bestb1 = [b1[0], b1[1], b1[2]];
  var bestW2 = [W2[0], W2[1], W2[2]];
  var bestb2 = b2;
  var bestAcc = 0;

  for (var epochs = 0; epochs < maxEpoch; epochs++) {
    var dW1 = [[0, 0, 0], [0, 0, 0]];
    var db1 = [0, 0, 0];
    var dW2 = [0, 0, 0];
    var db2 = 0;

    for (var k = 0; k < n; k++) {
      var d = normData[k];
      var x0 = d.x[0], x1 = d.x[1];

      var zh0 = x0 * W1[0][0] + x1 * W1[1][0] + b1[0];
      var zh1 = x0 * W1[0][1] + x1 * W1[1][1] + b1[1];
      var zh2 = x0 * W1[0][2] + x1 * W1[1][2] + b1[2];
      var ah0 = sigmoid(zh0), ah1 = sigmoid(zh1), ah2 = sigmoid(zh2);
      var zo = ah0 * W2[0] + ah1 * W2[1] + ah2 * W2[2] + b2;
      var ao = sigmoid(zo);
      var dz = ao - d.y;

      dW2[0] += dz * ah0; dW2[1] += dz * ah1; dW2[2] += dz * ah2;
      db2 += dz;

      var dz_h0 = dz * W2[0] * ah0 * (1 - ah0);
      var dz_h1 = dz * W2[1] * ah1 * (1 - ah1);
      var dz_h2 = dz * W2[2] * ah2 * (1 - ah2);

      dW1[0][0] += dz_h0 * x0; dW1[0][1] += dz_h1 * x0; dW1[0][2] += dz_h2 * x0;
      dW1[1][0] += dz_h0 * x1; dW1[1][1] += dz_h1 * x1; dW1[1][2] += dz_h2 * x1;
      db1[0] += dz_h0; db1[1] += dz_h1; db1[2] += dz_h2;
    }

    for (i = 0; i < 2; i++) {
      for (j = 0; j < 3; j++) { W1[i][j] -= lr * dW1[i][j] / n; }
    }
    for (j = 0; j < 3; j++) { b1[j] -= lr * db1[j] / n; W2[j] -= lr * dW2[j] / n; }
    b2 -= lr * db2 / n;

    if (epochs % 100 === 0 || epochs === maxEpoch - 1) {
      var correct = 0;
      for (var k2 = 0; k2 < n; k2++) {
        var d2 = normData[k2];
        var xx0 = d2.x[0], xx1 = d2.x[1];
        var zzh0 = xx0 * W1[0][0] + xx1 * W1[1][0] + b1[0];
        var zzh1 = xx0 * W1[0][1] + xx1 * W1[1][1] + b1[1];
        var zzh2 = xx0 * W1[0][2] + xx1 * W1[1][2] + b1[2];
        var zzo = sigmoid(zzh0) * W2[0] + sigmoid(zzh1) * W2[1] + sigmoid(zzh2) * W2[2] + b2;
        if ((sigmoid(zzo) > 0.5 ? 1 : 0) === d2.y) correct++;
      }
      var acc = correct / n;

      if (acc > bestAcc) {
        bestW1 = [[W1[0][0], W1[0][1], W1[0][2]], [W1[1][0], W1[1][1], W1[1][2]]];
        bestb1 = [b1[0], b1[1], b1[2]];
        bestW2 = [W2[0], W2[1], W2[2]];
        bestb2 = b2;
        bestAcc = acc;
      }

      if (acc >= 0.95) {
        for (i = 0; i < 2; i++) {
          for (j = 0; j < 3; j++) {
            var ww = net.weights.find(function(x) { return x.from[0] === L_IN_ && x.from[1] === i && x.to[0] === L_HID_ && x.to[1] === j; });
            if (ww) ww.w = W1[i][j];
          }
        }
        for (j = 0; j < 3; j++) {
          var ww = net.weights.find(function(x) { return x.from[0] === L_HID_ && x.from[1] === j && x.to[0] === L_OUT_ && x.to[1] === 0; });
          if (ww) ww.w = W2[j];
        }
        for (j = 0; j < 3; j++) net.biases.hidden[j] = b1[j];
        net.biases.output = b2;
        return { ok: 1, epochs: epochs + 1, acc: acc };
      }
    }
  }

  for (i = 0; i < 2; i++) {
    for (j = 0; j < 3; j++) {
      var ww = net.weights.find(function(x) { return x.from[0] === L_IN_ && x.from[1] === i && x.to[0] === L_HID_ && x.to[1] === j; });
      if (ww) ww.w = bestW1[i][j];
    }
  }
  for (j = 0; j < 3; j++) {
    var ww = net.weights.find(function(x) { return x.from[0] === L_HID_ && x.from[1] === j && x.to[0] === L_OUT_ && x.to[1] === 0; });
    if (ww) ww.w = bestW2[j];
  }
  for (j = 0; j < 3; j++) net.biases.hidden[j] = bestb1[j];
  net.biases.output = bestb2;
  return { ok: 0, epochs: maxEpoch, acc: bestAcc };
}
