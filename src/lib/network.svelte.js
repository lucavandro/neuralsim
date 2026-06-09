export const L_IN = 0;
export const L_HID = 1;
export const L_OUT = 2;
export const N_HID = 3;
export const LABELS = [["Altezza", "Peso"], ["N1", "N2", "N3"], ["Forma"]];

export const sigmoid = x => 1 / (1 + Math.exp(-x));

export const anim = $state({ running: false, phase: 0, progress: 0, result: false, startTime: 0 });
export const speedConfig = $state({ value: 1 });
export const selection = $state({ conn: null, bias: null, label: "---", value: 0, visible: false });

export const net = $state({
  weights: [],
  biases: { hidden: [0, 0, 0], output: 0 },
  iv: [0.875, 0.467],
  hv: [0, 0, 0],
  ov: 0
});

const L_IN_ = 0, L_HID_ = 1, L_OUT_ = 2, N_HID_ = 3;

export function initWeights() {
  var W1 = [[4.65136122, -0.28028766, -4.83471352], [-1.1782602149102068, -0.0907101234276298, 1.3388977386509413]];
  var b1 = [-0.7318646005417553, 0.5915286141903874, -0.02927162669939086];
  var W2 = [[-2.27400544], [-1.85664091], [-7.71115236]];
  var b2 = 0.12428414515442507;

  net.weights = [];
  for (var i = 0; i < 2; i++) {
    for (var j = 0; j < N_HID_; j++) {
      net.weights.push({ from: [L_IN_, i], to: [L_HID_, j], w: W1[i][j] });
    }
  }
  for (var j = 0; j < N_HID_; j++) {
    net.weights.push({ from: [L_HID_, j], to: [L_OUT_, 0], w: W2[j][0] });
  }
  net.biases = { hidden: [b1[0], b1[1], b1[2]], output: b2 };
}

export function fwd(h_cm, w_kg) {
  var hn = Math.max(0, Math.min(1, h_cm / 200));
  var wn = Math.max(0, Math.min(1, w_kg / 150));

  net.iv[0] = hn;
  net.iv[1] = wn;

  var i, j, s, c;

  for (j = 0; j < N_HID_; j++) {
    s = 0;
    for (i = 0; i < 2; i++) {
      c = net.weights.find(function(x) {
        return x.from[0] === L_IN_ && x.from[1] === i && x.to[0] === L_HID_ && x.to[1] === j;
      });
      if (c) s += net.iv[i] * c.w;
    }
    s += net.biases.hidden[j];
    net.hv[j] = sigmoid(s);
  }

  s = 0;
  for (j = 0; j < N_HID_; j++) {
    c = net.weights.find(function(x) {
      return x.from[0] === L_HID_ && x.from[1] === j && x.to[0] === L_OUT_ && x.to[1] === 0;
    });
    if (c) s += net.hv[j] * c.w;
  }
  s += net.biases.output;
  net.ov = sigmoid(s);

  return net.ov;
}

export function getWeight(fromL, fromN, toL, toN) {
  var c = net.weights.find(function(x) {
    return x.from[0] === fromL && x.from[1] === fromN && x.to[0] === toL && x.to[1] === toN;
  });
  return c ? c.w : 0;
}

export function getWeightMatrix() {
  var W1 = [[0, 0, 0], [0, 0, 0]];
  var b1 = [net.biases.hidden[0], net.biases.hidden[1], net.biases.hidden[2]];
  var W2 = [[0], [0], [0]];
  var b2 = net.biases.output;

  for (var wi = 0; wi < net.weights.length; wi++) {
    var w = net.weights[wi];
    var rw = Math.round(w.w * 1e8) / 1e8;
    if (w.from[0] === L_IN_ && w.to[0] === L_HID_) {
      W1[w.from[1]][w.to[1]] = rw;
    } else if (w.from[0] === L_HID_ && w.to[0] === L_OUT_) {
      W2[w.from[1]][0] = rw;
    }
  }
  return { W1: W1, b1: b1, W2: W2, b2: b2 };
}

export function applyWeightMatrix(data) {
  for (var i = 0; i < 2; i++) {
    for (var j = 0; j < 3; j++) {
      var w = net.weights.find(function(x) {
        return x.from[0] === L_IN_ && x.from[1] === i && x.to[0] === L_HID_ && x.to[1] === j;
      });
      if (w) w.w = data.W1[i][j];
    }
  }
  for (var j = 0; j < 3; j++) {
    var w = net.weights.find(function(x) {
      return x.from[0] === L_HID_ && x.from[1] === j && x.to[0] === L_OUT_ && x.to[1] === 0;
    });
    if (w) w.w = data.W2[j][0];
  }
  for (var j = 0; j < 3; j++) net.biases.hidden[j] = data.b1[j];
  net.biases.output = data.b2;
}

export function applyLoadedData(data) {
  if (data.W1 && data.b1 && data.W2 && data.b2 !== undefined) {
    applyWeightMatrix(data);
    return true;
  }
  if (data.weights) {
    for (var i = 0; i < data.weights.length; i++) {
      var sw = data.weights[i];
      var m = net.weights.find(function(x) {
        return x.from[0] === sw.from[0] && x.from[1] === sw.from[1] && x.to[0] === sw.to[0] && x.to[1] === sw.to[1];
      });
      if (m) m.w = sw.w;
    }
    if (data.biases) {
      net.biases.hidden = data.biases.hidden;
      net.biases.output = data.biases.output;
    }
    return true;
  }
  return false;
}
