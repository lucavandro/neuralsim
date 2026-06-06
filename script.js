// =============================================================================
// Rete Neurale Interattiva — script.js
// =============================================================================

// --- Funzioni di attivazione e costanti -------------------------------------

const sigmoid = x => 1 / (1 + Math.exp(-x));

const L_IN  = 0; // layer index: input
const L_HID = 1; // layer index: hidden
const L_OUT = 2; // layer index: output
const N_HID = 3; // numero neuroni hidden

const LABELS = [
  ["Altezza", "Peso"],
  ["N1", "N2", "N3"],
  ["Forma"]
];

// --- Stato globale della rete -----------------------------------------------

let weights = [];
let biases  = { hidden: [0, 0, 0], output: 0 };

// Weights / biases di default (sovrascritti da localStorage se presenti)
// W1 (input→hidden):
//   [[ 1.06000828,  0.38214399, -1.45653368],
//    [-0.93340569,  0.3634308 ,  0.95406792]]
// b1 (hidden bias): [0.09426104, -0.02263479, -0.09691347]
// W2 (hidden→output):
//   [[ 1.94698216],
//    [-0.16850021],
//    [-1.71462428]]
// b2 (output bias): 0.23561539

function initWeights() {
  weights = [];
  var i, j;

  var W1 = [
    [
      4.65136122,
      -0.28028766,
      -4.83471352
    ],
    [
    -1.1782602149102068,
    -0.0907101234276298,
    1.3388977386509413
  ]
  ];
  var b1 = [-1.1782602149102068,
    -0.0907101234276298,
    1.3388977386509413];
  var W2 = [[
      7.6239783
    ],
    [
      -0.91650867
    ],
    [
      -7.71115236
    ]];
  var b2 = 0.12428414515442507;

  for (i = 0; i < 2; i++) {
    for (j = 0; j < N_HID; j++) {
      weights.push({ from: [L_IN, i], to: [L_HID, j], w: W1[i][j] });
    }
  }
  for (j = 0; j < N_HID; j++) {
    weights.push({ from: [L_HID, j], to: [L_OUT, 0], w: W2[j][0] });
  }
  for (j = 0; j < N_HID; j++) {
    biases.hidden[j] = b1[j];
  }
  biases.output = b2;
}

// --- Forward pass -----------------------------------------------------------

// iv = input values (normalizzati)
// hv = hidden values (post-sigmoid)
// ov = output value (post-sigmoid)
// lv = tutti i layer aggregati (per lookup nel rendering)

var iv = [0.875, 0.467];
var hv = [0, 0, 0];
var ov = 0;
var lv = [iv, hv, [ov]];

function fwd(h_cm, w_kg) {
  var hn = Math.max(0, Math.min(1, h_cm / 200));
  var wn = Math.max(0, Math.min(1, w_kg / 150));

  iv[0] = hn;
  iv[1] = wn;

  var i, j, s, c;

  // input → hidden
  for (j = 0; j < N_HID; j++) {
    s = 0;
    for (i = 0; i < 2; i++) {
      c = weights.find(function(x) {
        return x.from[0] === L_IN && x.from[1] === i &&
               x.to[0]   === L_HID && x.to[1]   === j;
      });
      if (c) s += iv[i] * c.w;
    }
    s += biases.hidden[j];
    hv[j] = sigmoid(s);
  }

  // hidden → output
  s = 0;
  for (j = 0; j < N_HID; j++) {
    c = weights.find(function(x) {
      return x.from[0] === L_HID && x.from[1] === j &&
             x.to[0]   === L_OUT && x.to[1]   === 0;
    });
    if (c) s += hv[j] * c.w;
  }
  s += biases.output;
  ov = sigmoid(s);

  lv = [iv, hv, [ov]];
  return ov;
}

// --- Canvas & layout --------------------------------------------------------

var R = 24; // raggio neuroni (px)

function lay(cw, ch) {
  return [
    // input (2 neuroni)
    [
      { x: cw * 0.12, y: ch * 0.30 },
      { x: cw * 0.12, y: ch * 0.58 }
    ],
    // hidden (3 neuroni)
    [
      { x: cw * 0.45, y: ch * 0.15 },
      { x: cw * 0.45, y: ch * 0.40 },
      { x: cw * 0.45, y: ch * 0.65 }
    ],
    // output (1 neurone)
    [
      { x: cw * 0.78, y: ch * 0.40 }
    ]
  ];
}

var cnv = document.getElementById("network-canvas");
var ctx = cnv.getContext("2d");
var W, H, ly;

function resize() {
  var rect  = cnv.parentElement.getBoundingClientRect();
  var dpr   = window.devicePixelRatio || 1;
  W         = rect.width;
  H         = rect.height;
  cnv.width  = W * dpr;
  cnv.height = H * dpr;
  cnv.style.width  = W + "px";
  cnv.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ly = lay(W, H);
  draw();
}

window.addEventListener("resize", resize);

// --- Utility grafiche --------------------------------------------------------

// Punto sul bordo di un cerchio (da (x1,y1) verso (x2,y2), distanza r)
function edgePoint(x1, y1, x2, y2, r) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  var d  = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: x1 + (dx / d) * r, y: y1 + (dy / d) * r };
}

// Distanza minima punto-segmento
function pointToDist(px, py, x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  var ls = dx * dx + dy * dy;
  if (ls === 0) return Math.hypot(px - x1, py - y1);
  var t = ((px - x1) * dx + (py - y1) * dy) / ls;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Colore connessione in base al segno del peso (blu=positivo, rosso=negativo)
function weightColor(w) {
  return w > 0
    ? { r:  66, g: 165, b: 245 }  // blu
    : { r: 239, g:  68, b:  68 }; // rosso
}

// Stringa colore rgba
function rgba(r, g, b, a) {
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}

// Punta di freccia
function drawArrowhead(x, y, angle, size, col, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.4);
  ctx.lineTo(-size,  size * 0.4);
  ctx.closePath();
  ctx.fillStyle = rgba(col.r, col.g, col.b, alpha);
  ctx.fill();
  ctx.restore();
}

// --- Animazione -------------------------------------------------------------

var anim   = false;
var aph    = 0;   // fase corrente
var aprg   = 0;   // progresso nella fase [0, 1]
var ast    = 0;   // start time (performance.now)
var ares   = false;

// Durate base per ogni fase (in ms)
// [0]=placeholder, 1=input, 2=input→hidden, 3=hidden, 4=hidden→output,
//  5=output, 6=risultato
var BASE_DUR = [0, 400, 700, 400, 700, 400, 1200];
var speedMul = 1;

// --- Render (draw) ----------------------------------------------------------

function draw() {
  var cw = W, ch = H;
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, cw, ch);

  var layers = ly || lay(cw, ch);
  var conns  = weights;

  // Segnali in base alla fase di animazione
  var inputSignal  = (aph === 2 ? aprg : (aph > 2 ? 1 : 0));
  var outputSignal = (aph === 4 ? aprg : (aph > 4 ? 1 : 0));
  var showHidden   = (aph >= 3);
  var showOutput   = (aph >= 5);
  var showResult   = (aph >= 6);
  var showInput    = (aph >= 1);

  var l, n;

  // --- Connessioni ----------------------------------------------------------
  for (var ci = 0; ci < conns.length; ci++) {
    var c = conns[ci];
    var fl = c.from[0], fn = c.from[1];
    var tl = c.to[0],   tn = c.to[1];
    var fr  = layers[fl][fn];
    var to  = layers[tl][tn];
    var ef  = edgePoint(fr.x, fr.y, to.x, to.y, R);
    var et  = edgePoint(to.x, to.y, fr.x, fr.y, R);

    var connToHidden = (tl === L_HID);
    var signal       = connToHidden ? inputSignal : outputSignal;
    var col          = weightColor(c.w);
    var absW         = Math.abs(c.w);
    var baseAlpha    = Math.min(1, 0.2 + absW * 0.2);
    var angle        = Math.atan2(to.y - fr.y, to.x - fr.x);

    if (anim && signal > 0 && signal < 1) {
      // Animazione: fronte di attivazione in movimento
      var mx = fr.x + (to.x - fr.x) * signal;
      var my = fr.y + (to.y - fr.y) * signal;

      // Parte non ancora attivata (grigia)
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(et.x, et.y);
      ctx.strokeStyle = rgba(60, 60, 90, baseAlpha * 0.5);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Parte già attivata (colorata)
      ctx.beginPath();
      ctx.moveTo(ef.x, ef.y);
      ctx.lineTo(mx, my);
      ctx.strokeStyle = rgba(col.r, col.g, col.b, 0.9);
      ctx.lineWidth = 2.5;
      ctx.stroke();

      drawArrowhead(et.x, et.y, angle, 8, col, baseAlpha * 0.4);

    } else {
      var active = (signal >= 1);

      ctx.beginPath();
      ctx.moveTo(ef.x, ef.y);
      ctx.lineTo(et.x, et.y);
      ctx.strokeStyle = active
        ? rgba(col.r, col.g, col.b, 0.85)
        : rgba(60, 60, 90, baseAlpha * 0.5);
      ctx.lineWidth = active ? 2.5 : 1.5;
      ctx.stroke();

      drawArrowhead(et.x, et.y, angle, 8, col, active ? 0.9 : baseAlpha * 0.4);
    }

    // Etichetta peso (centrata sul segmento)
    var mx2 = (fr.x + to.x) / 2;
    var my2 = (fr.y + to.y) / 2;
    ctx.save();
    ctx.font      = "11px Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = rgba(150, 150, 180, 0.7);
    ctx.fillText(c.w.toFixed(2), mx2, my2 - 12);
    ctx.restore();
  }

  // --- Neuroni --------------------------------------------------------------
  for (l = 0; l < layers.length; l++) {
    var layerLabels = LABELS[l];
    for (n = 0; n < layers[l].length; n++) {
      var p  = layers[l][n];
      var v  = lv[l][n];

      var active = false;
      var actVal = 0;

      if (l === L_IN) {
        active = showInput || anim;
        actVal = v;
      } else if (l === L_HID) {
        active = showHidden;
        actVal = v;
      } else {
        active = showOutput;
        actVal = v;
      }

      var hue = 200 + actVal * 60;

      // Bagliore
      if (active) {
        var g = ctx.createRadialGradient(p.x, p.y, R * 0.3, p.x, p.y, R * 2);
        g.addColorStop(0, "hsla(" + hue + ", 80%, 60%, 0.15)");
        g.addColorStop(1, "hsla(" + hue + ", 80%, 60%, 0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, R * 2, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // Cerchio
      ctx.beginPath();
      ctx.arc(p.x, p.y, R, 0, Math.PI * 2);

      if (l === L_OUT && active) {
        var g2 = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, R);
        g2.addColorStop(0, "hsl(" + hue + ", 90%, 75%)");
        g2.addColorStop(1, "hsl(" + hue + ", 80%, 45%)");
        ctx.fillStyle = g2;
      } else if (active) {
        var g2 = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, R);
        g2.addColorStop(0, "hsl(" + hue + ", 80%, 70%)");
        g2.addColorStop(1, "hsl(" + hue + ", 70%, 40%)");
        ctx.fillStyle = g2;
      } else {
        ctx.fillStyle = "#2a2a3e";
      }
      ctx.fill();

      ctx.strokeStyle = active
        ? "hsla(" + hue + ", 80%, 60%, 0.8)"
        : "#3a3a5e";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Testo dentro il cerchio (nome o attivazione)
      ctx.save();
      ctx.font      = "11px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (active) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px Segoe UI, sans-serif";
        ctx.fillText(actVal.toFixed(2), p.x, p.y - 3);
      } else {
        ctx.fillStyle = "#666688";
        ctx.fillText(layerLabels[n], p.x, p.y);
      }
      ctx.restore();

      // Bias — freccia entrante dall'alto (solo hidden e output)
      if (l === L_HID || l === L_OUT) {
        var bv = (l === L_HID) ? biases.hidden[n] : biases.output;
        var biasCol    = weightColor(bv);
        var biasAbs    = Math.abs(bv);
        var biasAlpha  = Math.min(1, 0.15 + biasAbs * 0.25);

        var bx = p.x;
        var by = p.y - 55;
        var biasAngle = Math.atan2(p.y - by, p.x - bx);
        var bee       = edgePoint(p.x, p.y, bx, by, R);

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bee.x, bee.y);
        ctx.strokeStyle = active
          ? rgba(biasCol.r, biasCol.g, biasCol.b, 0.85)
          : rgba(60, 60, 90, biasAlpha * 0.5);
        ctx.lineWidth = active ? 3 : 1.5;
        ctx.stroke();

        drawArrowhead(bee.x, bee.y, biasAngle, 8, biasCol,
          active ? 0.9 : biasAlpha * 0.4);

        ctx.save();
        ctx.font      = "bold 12px Consolas, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = active
          ? rgba(biasCol.r, biasCol.g, biasCol.b, 0.9)
          : rgba(100, 100, 135, 0.6);
        ctx.fillText(bv.toFixed(2), bx, by - 4);
        ctx.restore();
      }

      // Etichetta sotto il cerchio
      ctx.save();
      ctx.font      = "11px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = active ? "#aaaacc" : "#555577";
      ctx.fillText(layerLabels[n], p.x, p.y + R + 6);
      ctx.restore();
    }
  }

  // Nomi dei layer
  var layerNames = ["INPUT", "HIDDEN", "OUTPUT"];
  var layerX     = [layers[0][0].x, layers[1][0].x, layers[2][0].x];
  for (var li = 0; li < 3; li++) {
    ctx.save();
    ctx.font      = "9px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "#444466";
    ctx.fillText(layerNames[li], layerX[li], ch - 12);
    ctx.restore();
  }

  // Risultato finale
  if (showResult) {
    ctx.save();
    ctx.font      = "bold 20px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = ares ? "#81c784" : "#e57373";
    ctx.fillText(
      ares ? "IN FORMA" : "NON IN FORMA",
      layers[2][0].x,
      layers[2][0].y - R - 40
    );
    ctx.restore();
  }
}

// --- Avvio animazione -------------------------------------------------------

function runAnim() {
  if (anim) return;

  var h = +document.getElementById("input-height").value || 175;
  var w = +document.getElementById("input-weight").value  || 70;
  fwd(h, w);

  ares = (ov > 0.5);
  anim = true;
  aph  = 1;
  aprg = 0;
  ast  = performance.now();

  document.getElementById("btn-play").disabled = true;
  document.getElementById("header-status").textContent = "In esecuzione...";
  document.getElementById("header-status").className = "running";
  document.getElementById("result-box").className = "waiting";
  document.getElementById("result-box").textContent = "Calcolo in corso...";
  document.getElementById("output-value").textContent = "...";

  animLoop(performance.now());
}

function animLoop(now) {
  if (!anim) return;

  var elapsed = now - ast;
  var phase   = 1;
  var accum   = 0;

  for (var p = 1; p < BASE_DUR.length; p++) {
    var dur = BASE_DUR[p] / speedMul;
    if (elapsed < accum + dur) {
      phase = p;
      aprg  = (elapsed - accum) / dur;
      break;
    }
    accum += dur;
    if (p === BASE_DUR.length - 1) {
      phase = p;
      aprg  = 1;
      break;
    }
  }
  aph = phase;
  draw();

  if (phase < BASE_DUR.length - 1) {
    requestAnimationFrame(animLoop);
  } else {
    anim = false;
    aph  = 5;

    document.getElementById("btn-play").disabled = false;
    document.getElementById("header-status").textContent =
      ares ? "In forma" : "Non in forma";
    document.getElementById("header-status").className = "done";

    var rb = document.getElementById("result-box");
    rb.className = ares ? "yes" : "no";
    rb.textContent = ares ? "In forma" : "Non in forma";
    document.getElementById("output-value").textContent = ov.toFixed(4);
    draw();
  }
}

// --- Training ---------------------------------------------------------------

function generateData(count) {
  var data = [];
  var half = Math.round(count / 2);
  var nForma = 0, nNon = 0;
  var maxAttempts = count * 50;
  var attempts = 0;

  while ((nForma < half || nNon < count - half) && attempts < maxAttempts) {
    attempts++;
    var wantForma = nForma < half;
    var h = 140 + Math.random() * 70;
    var hM = h / 100;
    var hM2 = hM * hM;

    if (wantForma) {
      var wMin = 18.5 * hM2;
      var wMax = 25 * hM2;
      if (wMin < 30) wMin = 30;
      if (wMax > 130) wMax = 130;
      if (wMax <= wMin) continue;
      var w = wMin + Math.random() * (wMax - wMin);
      data.push({ h: Math.round(h), w: Math.round(w), label: 1 });
      nForma++;
    } else {
      // Sceglie casualmente sottopeso o sovrappeso
      if (Math.random() < 0.5) {
        var wMaxU = 18.5 * hM2;
        if (wMaxU <= 30) continue;
        var w = 30 + Math.random() * (wMaxU - 30);
        data.push({ h: Math.round(h), w: Math.round(w), label: 0 });
      } else {
        var wMinO = 25 * hM2;
        if (wMinO >= 130) continue;
        var w = wMinO + Math.random() * (130 - wMinO);
        data.push({ h: Math.round(h), w: Math.round(w), label: 0 });
      }
      nNon++;
    }
  }
  return data;
}

function train() {
  var data     = generateData(400);
  var n        = data.length;
  var maxEpoch = 50000;
  var lr       = 1; // learning rate

  // Copia pesi correnti in matrici locali
  var W1 = [[0, 0, 0], [0, 0, 0]];
  var b1 = [biases.hidden[0], biases.hidden[1], biases.hidden[2]];
  var W2 = [0, 0, 0];
  var b2 = biases.output;

  for (var i = 0; i < 2; i++) {
    for (var j = 0; j < 3; j++) {
      var w = weights.find(function(x) {
        return x.from[0] === L_IN && x.from[1] === i &&
               x.to[0]   === L_HID && x.to[1]   === j;
      });
      if (w) W1[i][j] = w.w;
    }
  }
  for (var j = 0; j < 3; j++) {
    var w = weights.find(function(x) {
      return x.from[0] === L_HID && x.from[1] === j &&
             x.to[0]   === L_OUT && x.to[1]   === 0;
    });
    if (w) W2[j] = w.w;
  }

  // Normalizza dati (stessa normalizzazione di fwd())
  var normData = data.map(function(d) {
    return {
      x: [
        Math.max(0, Math.min(1, d.h / 200)),
        Math.max(0, Math.min(1, d.w / 150))
      ],
      y: d.label
    };
  });

  // Best weights (per fallback se non raggiunge 95%)
  var bestW1  = [[W1[0][0], W1[0][1], W1[0][2]],
                 [W1[1][0], W1[1][1], W1[1][2]]];
  var bestb1  = [b1[0], b1[1], b1[2]];
  var bestW2  = [W2[0], W2[1], W2[2]];
  var bestb2  = b2;
  var bestAcc = 0;

  var epochs;

  // --- Ciclo di training (batch gradient descent) ---------------------------
  for (epochs = 0; epochs < maxEpoch; epochs++) {
    var dW1 = [[0, 0, 0], [0, 0, 0]];
    var db1 = [0, 0, 0];
    var dW2 = [0, 0, 0];
    var db2 = 0;

    // Accumula gradienti su tutto il batch
    for (var k = 0; k < n; k++) {
      var d  = normData[k];
      var x0 = d.x[0];
      var x1 = d.x[1];

      // Forward
      var zh0 = x0 * W1[0][0] + x1 * W1[1][0] + b1[0];
      var zh1 = x0 * W1[0][1] + x1 * W1[1][1] + b1[1];
      var zh2 = x0 * W1[0][2] + x1 * W1[1][2] + b1[2];

      var ah0 = sigmoid(zh0);
      var ah1 = sigmoid(zh1);
      var ah2 = sigmoid(zh2);

    var zo  = ah0 * W2[0] + ah1 * W2[1] + ah2 * W2[2] + mtb2;
      var ao  = sigmoid(zo);
      var dz  = ao - d.y; // dL/dz_o

      // dW2, db2
      dW2[0] += dz * ah0;
      dW2[1] += dz * ah1;
      dW2[2] += dz * ah2;
      db2 += dz;

      // Retropropagazione agli hidden
      var dz_h0 = dz * W2[0] * ah0 * (1 - ah0);
      var dz_h1 = dz * W2[1] * ah1 * (1 - ah1);
      var dz_h2 = dz * W2[2] * ah2 * (1 - ah2);

      dW1[0][0] += dz_h0 * x0;
      dW1[0][1] += dz_h1 * x0;
      dW1[0][2] += dz_h2 * x0;
      dW1[1][0] += dz_h0 * x1;
      dW1[1][1] += dz_h1 * x1;
      dW1[1][2] += dz_h2 * x1;

      db1[0] += dz_h0;
      db1[1] += dz_h1;
      db1[2] += dz_h2;
    }

    // Applica gradienti (media sul batch)
    for (i = 0; i < 2; i++) {
      for (j = 0; j < 3; j++) {
        W1[i][j] -= lr * dW1[i][j] / n;
      }
    }
    for (j = 0; j < 3; j++) {
      b1[j]  -= lr * db1[j]  / n;
      W2[j]  -= lr * dW2[j]  / n;
    }
    b2 -= lr * db2 / n;

    // --- Verifica accuratezza ogni 100 epoche -------------------------------
    if (epochs % 100 === 0 || epochs === maxEpoch - 1) {
      var correct = 0;
      for (var k2 = 0; k2 < n; k2++) {
        var d2  = normData[k2];
        var xx0 = d2.x[0];
        var xx1 = d2.x[1];

        var zzh0 = xx0 * W1[0][0] + xx1 * W1[1][0] + b1[0];
        var zzh1 = xx0 * W1[0][1] + xx1 * W1[1][1] + b1[1];
        var zzh2 = xx0 * W1[0][2] + xx1 * W1[1][2] + b1[2];

        var zzo = sigmoid(zzh0) * W2[0]
                + sigmoid(zzh1) * W2[1]
                + sigmoid(zzh2) * W2[2]
                + b2;

        if ((sigmoid(zzo) > 0.5 ? 1 : 0) === d2.y) correct++;
      }

      var acc = correct / n;

      if (acc > bestAcc) {
        bestW1 = [[W1[0][0], W1[0][1], W1[0][2]],
                  [W1[1][0], W1[1][1], W1[1][2]]];
        bestb1 = [b1[0], b1[1], b1[2]];
        bestW2 = [W2[0], W2[1], W2[2]];
        bestb2 = b2;
        bestAcc = acc;
      }

      if (acc >= 0.95) {
        // Raggiunto target → applica alla rete globale
        for (i = 0; i < 2; i++) {
          for (j = 0; j < 3; j++) {
            var ww = weights.find(function(x) {
              return x.from[0] === L_IN && x.from[1] === i &&
                     x.to[0]   === L_HID && x.to[1]   === j;
            });
            if (ww) ww.w = W1[i][j];
          }
        }
        for (j = 0; j < 3; j++) {
          var ww = weights.find(function(x) {
            return x.from[0] === L_HID && x.from[1] === j &&
                   x.to[0]   === L_OUT && x.to[1]   === 0;
          });
          if (ww) ww.w = W2[j];
        }
        for (j = 0; j < 3; j++) biases.hidden[j] = b1[j];
        biases.output = b2;

        return { ok: 1, epochs: epochs + 1, acc: acc };
      }
    }
  }

  // Non ha raggiunto 95% → applica i migliori pesi trovati
  for (i = 0; i < 2; i++) {
    for (j = 0; j < 3; j++) {
      var ww = weights.find(function(x) {
        return x.from[0] === L_IN && x.from[1] === i &&
               x.to[0]   === L_HID && x.to[1]   === j;
      });
      if (ww) ww.w = bestW1[i][j];
    }
  }
  for (j = 0; j < 3; j++) {
    var ww = weights.find(function(x) {
      return x.from[0] === L_HID && x.from[1] === j &&
             x.to[0]   === L_OUT && x.to[1]   === 0;
    });
    if (ww) ww.w = bestW2[j];
  }
  for (j = 0; j < 3; j++) biases.hidden[j] = bestb1[j];
  biases.output = bestb2;

  return { ok: 0, epochs: maxEpoch, acc: bestAcc };
}

// --- Persistenza pesi -------------------------------------------------------

function getWeightMatrix() {
  var W1 = [[0, 0, 0], [0, 0, 0]];
  var b1 = [biases.hidden[0], biases.hidden[1], biases.hidden[2]];
  var W2 = [[0], [0], [0]];
  var b2 = biases.output;

  for (var wi = 0; wi < weights.length; wi++) {
    var w = weights[wi];
    var rw = Math.round(w.w * 1e8) / 1e8;
    if (w.from[0] === L_IN && w.to[0] === L_HID) {
      W1[w.from[1]][w.to[1]] = rw;
    } else if (w.from[0] === L_HID && w.to[0] === L_OUT) {
      W2[w.from[1]][0] = rw;
    }
  }
  return { W1: W1, b1: b1, W2: W2, b2: b2 };
}

function applyWeightMatrix(data) {
  for (var i = 0; i < 2; i++) {
    for (var j = 0; j < 3; j++) {
      var w = weights.find(function(x) {
        return x.from[0] === L_IN && x.from[1] === i &&
               x.to[0]   === L_HID && x.to[1]   === j;
      });
      if (w) w.w = data.W1[i][j];
    }
  }
  for (var j = 0; j < 3; j++) {
    var w = weights.find(function(x) {
      return x.from[0] === L_HID && x.from[1] === j &&
             x.to[0]   === L_OUT && x.to[1]   === 0;
    });
    if (w) w.w = data.W2[j][0];
  }
  for (var j = 0; j < 3; j++) biases.hidden[j] = data.b1[j];
  biases.output = data.b2;
}

function saveWeights() {
  localStorage.setItem("neuralsim-weights", JSON.stringify(getWeightMatrix()));
}

function applyLoadedData(data) {
  // Nuovo formato: { W1, b1, W2, b2 }
  if (data.W1 && data.b1 && data.W2 && data.b2 !== undefined) {
    applyWeightMatrix(data);
    return true;
  }
  // Vecchio formato (backward compat.): { weights: [...], biases: {...} }
  if (data.weights) {
    for (var i = 0; i < data.weights.length; i++) {
      var sw = data.weights[i];
      var m  = weights.find(function(x) {
        return x.from[0] === sw.from[0] && x.from[1] === sw.from[1] &&
               x.to[0]   === sw.to[0]   && x.to[1]   === sw.to[1];
      });
      if (m) m.w = sw.w;
    }
    if (data.biases) {
      biases.hidden = data.biases.hidden;
      biases.output = data.biases.output;
    }
    return true;
  }
  return false;
}

function loadWeights() {
  var saved = localStorage.getItem("neuralsim-weights");
  if (!saved) return false;
  try {
    return applyLoadedData(JSON.parse(saved));
  } catch (e) {
    return false;
  }
}

function downloadWeights() {
  var obj = getWeightMatrix();

  var blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json"
  });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement("a");
  a.href   = url;
  a.download = "weights.json";
  a.click();
  URL.revokeObjectURL(url);
}

// --- UI: selezione connessione / bias ---------------------------------------

var selConn = -1;
var selBias = null;

function updateNormalization() {
  var h = +document.getElementById("input-height").value || 175;
  var w = +document.getElementById("input-weight").value  || 70;

  document.getElementById("norm-height").textContent = (h / 200).toFixed(2);
  document.getElementById("norm-weight").textContent = (w / 150).toFixed(2);
}

function resetUI() {
  aph = 0;
  document.getElementById("output-value").textContent = ov.toFixed(4);
  document.getElementById("result-box").className = "waiting";
  document.getElementById("result-box").textContent = "In attesa...";
  document.getElementById("header-status").textContent = "Pronto";
  document.getElementById("header-status").className = "ready";

  selConn = -1;
  selBias = null;
  document.getElementById("weight-editor").className = "";
  draw();
}

function showWeightEditor(label, value) {
  document.getElementById("weight-conn-label").textContent = label;
  document.getElementById("weight-input").value = value;
  document.getElementById("weight-editor").className = "visible";
}

// --- Event listeners --------------------------------------------------------

document.getElementById("speed-slider").addEventListener("input", function() {
  speedMul = +this.value;
  document.getElementById("speed-display").textContent =
    speedMul.toFixed(2).replace(/\.?0+$/, "") + "x";
});

document.getElementById("input-height").addEventListener("input", function() {
  if (anim) return;
  var h = +document.getElementById("input-height").value || 175;
  var w = +document.getElementById("input-weight").value  || 70;
  updateNormalization();
  fwd(h, w);
  resetUI();
});

document.getElementById("input-weight").addEventListener("input", function() {
  if (anim) return;
  var h = +document.getElementById("input-height").value || 175;
  var w = +document.getElementById("input-weight").value  || 70;
  updateNormalization();
  fwd(h, w);
  resetUI();
});

document.getElementById("btn-play").addEventListener("click", runAnim);

document.getElementById("btn-load").addEventListener("click", function() {
  document.getElementById("file-input").click();
});

document.getElementById("file-input").addEventListener("change", function(e) {
  if (anim) return;
  var file = this.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    try {
      var data = JSON.parse(ev.target.result);
      if (!applyLoadedData(data)) {
        alert("Formato file non valido. Usa un file weights.json generato dal Download.");
        return;
      }
      var h = +document.getElementById("input-height").value || 175;
      var w = +document.getElementById("input-weight").value  || 70;
      fwd(h, w);
      resetUI();
      document.getElementById("header-status").textContent = "Pesi caricati";
      document.getElementById("header-status").className = "ready";
    } catch(err) {
      alert("Errore nel leggere il file: " + err.message);
    }
  };
  reader.readAsText(file);
  this.value = "";
});

// Click su canvas: seleziona neurone (bias) o connessione
cnv.addEventListener("click", function(e) {
  if (anim) return;

  var rect = cnv.getBoundingClientRect();
  var mx   = e.clientX - rect.x;
  var my   = e.clientY - rect.y;

  // Neuroni hidden / output (per bias)
  for (var l = 1; l <= 2; l++) {
    for (var n = 0; n < ly[l].length; n++) {
      var p = ly[l][n];
      if (Math.hypot(mx - p.x, my - p.y) < R) {
        selBias = { layer: l, index: n };
        selConn = -1;
        var name = LABELS[l][n];
        var val  = (l === L_HID) ? biases.hidden[n] : biases.output;
        showWeightEditor("Bias of " + name, val);
        draw();
        return;
      }
    }
  }

  // Connessioni
  for (var i = 0; i < weights.length; i++) {
    var c   = weights[i];
    var fl  = c.from[0], fn = c.from[1];
    var tl  = c.to[0],   tn = c.to[1];
    var fr  = ly[fl][fn];
    var to  = ly[tl][tn];

    if (pointToDist(mx, my, fr.x, fr.y, to.x, to.y) < 12) {
      selConn = i;
      selBias = null;
      showWeightEditor(
        LABELS[c.from[0]][c.from[1]] + " \u2192 " + LABELS[c.to[0]][c.to[1]],
        c.w
      );
      draw();
      return;
    }
  }

  // Nessuna selezione
  selConn = -1;
  selBias = null;
  document.getElementById("weight-editor").className = "";
  draw();
});

// Salvataggio peso / bias
document.getElementById("weight-save").addEventListener("click", function() {
  var v = +document.getElementById("weight-input").value;
  if (isNaN(v)) return;

  var h = +document.getElementById("input-height").value || 175;
  var w = +document.getElementById("input-weight").value  || 70;

  if (selBias) {
    if (selBias.layer === L_HID) {
      biases.hidden[selBias.index] = v;
    } else {
      biases.output = v;
    }
    fwd(h, w);
    resetUI();

  } else if (selConn >= 0) {
    weights[selConn].w = v;
    fwd(h, w);
    resetUI();
  }
});

document.getElementById("weight-input").addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    document.getElementById("weight-save").click();
  }
});

// Training
document.getElementById("btn-train").addEventListener("click", function() {
  if (anim) return;

  var btn = this;
  btn.disabled = true;

  document.getElementById("header-status").textContent = "Training...";
  document.getElementById("header-status").className  = "running";

  setTimeout(function() {
    var result = train();
    btn.disabled = false;

    // Salva in localStorage
    saveWeights();

    if (result.ok) {
      document.getElementById("header-status").textContent =
        "OK " + result.epochs + "ep " + (result.acc * 100).toFixed(1) + "%";
      document.getElementById("header-status").className = "done";
    } else {
      document.getElementById("header-status").textContent =
        "Migliore: " + (result.acc * 100).toFixed(1) + "% (soglia 95%)";
      document.getElementById("header-status").className = "ready";
    }

    var h = +document.getElementById("input-height").value || 175;
    var w = +document.getElementById("input-weight").value  || 70;
    fwd(h, w);
    resetUI();
  }, 50);
});

// Download pesi
document.getElementById("btn-download").addEventListener("click", function() {
  downloadWeights();
});

// --- Tab switching ----------------------------------------------------------

function switchTab(name) {
  // Ferma animazione se in esecuzione
  if (anim) {
    anim = false;
    aph = 5;
    document.getElementById("btn-play").disabled = false;
  }
  // Ferma matrix training
  if (mtRunning) {
    mtRunning = false;
    if (mtTimeoutId) { clearTimeout(mtTimeoutId); mtTimeoutId = null; }
    document.getElementById("mt-play").textContent = "\u25B6 Start";
  }

  document.querySelectorAll(".tab-btn").forEach(function(b) {
    b.classList.toggle("active", b.dataset.tab === name);
  });
  document.querySelectorAll(".tab-content").forEach(function(c) {
    c.classList.toggle("active", c.id === "tab-" + name);
  });
  if (name === "rete") resize();
  if (name === "matrix-training") mtReset();
}

document.querySelectorAll(".tab-btn").forEach(function(btn) {
  btn.addEventListener("click", function() {
    switchTab(this.dataset.tab);
  });
});

// --- Training data page -----------------------------------------------------

function populateTrainingData() {
  var data = generateData(400);
  var tbody = document.getElementById("td-table-body");
  tbody.innerHTML = "";

  var show = Math.min(15, data.length);
  for (var i = 0; i < show; i++) {
    var d = data[i];
    var bmi = d.w / ((d.h / 100) * (d.h / 100));
    var inForma = bmi >= 18.5 && bmi <= 25;
    var row = document.createElement("tr");
    row.innerHTML =
      "<td>" + Math.round(d.w) + "</td>" +
      "<td>" + (d.h / 100).toFixed(2) + "</td>" +
      "<td class=\"" + (inForma ? "label-yes" : "label-no") + "\">" +
      (inForma ? "In forma" : "Non in forma") + "</td>";
    tbody.appendChild(row);
  }

  var inFormaCount = data.filter(function(d) { return d.label === 1; }).length;
  var nonFormaCount = data.length - inFormaCount;
  document.getElementById("td-total").textContent = data.length;
  document.getElementById("td-in-forma").textContent =
    inFormaCount + " (" + (inFormaCount / data.length * 100).toFixed(1) + "%)";
  document.getElementById("td-non-forma").textContent =
    nonFormaCount + " (" + (nonFormaCount / data.length * 100).toFixed(1) + "%)";
}

// --- Matrix Training Tab ----------------------------------------------------

var mtData = null;
var mtNormData = null;
var mtRunning = false;
var mtEpoch = 0;
var mtMaxEpoch = 50000;
var mtLR = 1;
var mtDelay = 200;
var mtTimeoutId = null;
var mtW1 = [[0,0,0],[0,0,0]];
var mtb1 = [0,0,0];
var mtW2 = [0,0,0];
var mtb2 = 0;

function mtReset() {
  if (mtTimeoutId) { clearTimeout(mtTimeoutId); mtTimeoutId = null; }
  mtRunning = false;
  mtEpoch = 0;
  document.getElementById("mt-play").textContent = "\u25B6 Start";
  for (var i = 0; i < 2; i++) {
    for (var j = 0; j < 3; j++) {
      var w = weights.find(function(x) {
        return x.from[0] === L_IN && x.from[1] === i && x.to[0] === L_HID && x.to[1] === j;
      });
      mtW1[i][j] = w ? w.w : 0;
    }
  }
  for (var j = 0; j < 3; j++) {
    var w = weights.find(function(x) {
      return x.from[0] === L_HID && x.from[1] === j && x.to[0] === L_OUT && x.to[1] === 0;
    });
    mtW2[j] = w ? w.w : 0;
  }
  mtb1 = [biases.hidden[0], biases.hidden[1], biases.hidden[2]];
  mtb2 = biases.output;
  mtData = generateData(400);
  mtNormData = mtData.map(function(d) {
    return {
      x: [Math.max(0, Math.min(1, d.h / 200)), Math.max(0, Math.min(1, d.w / 150))],
      y: d.label
    };
  });
  mtUpdateInfo();
  mtRenderMatrices();
}

function mtStepEpoch() {
  var n = mtNormData.length;
  var W1 = mtW1, W2 = mtW2, b1 = mtb1;
  var dW1 = [[0,0,0],[0,0,0]];
  var db1 = [0,0,0];
  var dW2 = [0,0,0];
  var db2 = 0;
  for (var k = 0; k < n; k++) {
    var d = mtNormData[k];
    var x0 = d.x[0], x1 = d.x[1];
    var zh0 = x0 * W1[0][0] + x1 * W1[1][0] + b1[0];
    var zh1 = x0 * W1[0][1] + x1 * W1[1][1] + b1[1];
    var zh2 = x0 * W1[0][2] + x1 * W1[1][2] + b1[2];
    var ah0 = sigmoid(zh0), ah1 = sigmoid(zh1), ah2 = sigmoid(zh2);
    var zo  = ah0 * W2[0] + ah1 * W2[1] + ah2 * W2[2] + mtb2;
    var ao  = sigmoid(zo);
    var dz  = ao - d.y;
    dW2[0] += dz * ah0; dW2[1] += dz * ah1; dW2[2] += dz * ah2; db2 += dz;
    var dz_h0 = dz * W2[0] * ah0 * (1 - ah0);
    var dz_h1 = dz * W2[1] * ah1 * (1 - ah1);
    var dz_h2 = dz * W2[2] * ah2 * (1 - ah2);
    dW1[0][0] += dz_h0 * x0; dW1[0][1] += dz_h1 * x0; dW1[0][2] += dz_h2 * x0;
    dW1[1][0] += dz_h0 * x1; dW1[1][1] += dz_h1 * x1; dW1[1][2] += dz_h2 * x1;
    db1[0] += dz_h0; db1[1] += dz_h1; db1[2] += dz_h2;
  }
  for (var i = 0; i < 2; i++) {
    for (var j = 0; j < 3; j++) { W1[i][j] -= mtLR * dW1[i][j] / n; }
  }
  for (var j = 0; j < 3; j++) { b1[j] -= mtLR * db1[j] / n; W2[j] -= mtLR * dW2[j] / n; }
  mtb2 -= mtLR * db2 / n;
  mtEpoch++;
}

function mtComputeLossAcc() {
  var n = mtNormData.length;
  var W1 = mtW1, W2 = mtW2, b1 = mtb1, b2 = mtb2;
  var loss = 0, correct = 0;
  for (var k = 0; k < n; k++) {
    var d = mtNormData[k];
    var x0 = d.x[0], x1 = d.x[1], y = d.y;
    var zh0 = x0 * W1[0][0] + x1 * W1[1][0] + b1[0];
    var zh1 = x0 * W1[0][1] + x1 * W1[1][1] + b1[1];
    var zh2 = x0 * W1[0][2] + x1 * W1[1][2] + b1[2];
    var ah0 = sigmoid(zh0), ah1 = sigmoid(zh1), ah2 = sigmoid(zh2);
    var zo  = ah0 * W2[0] + ah1 * W2[1] + ah2 * W2[2] + b2;
    var ao  = sigmoid(zo);
    loss += -y * Math.log(ao + 1e-15) - (1 - y) * Math.log(1 - ao + 1e-15);
    if ((ao > 0.5 ? 1 : 0) === y) correct++;
  }
  return { loss: loss / n, acc: correct / n };
}

function mtUpdateInfo() {
  var res = mtEpoch > 0 ? mtComputeLossAcc() : { loss: 0, acc: 0 };
  document.getElementById("mt-epoch").textContent = mtEpoch;
  document.getElementById("mt-loss").textContent = mtEpoch > 0 ? res.loss.toFixed(4) : "---";
  document.getElementById("mt-acc").textContent = mtEpoch > 0 ? (res.acc * 100).toFixed(1) + "%" : "---";
  return mtEpoch > 0 ? res : null;
}

function mtRenderMatrices() {
  renderMatrixTable("mt-W1", mtW1, [2, 3]);
  renderMatrixTable("mt-b1", [mtb1], [1, 3]);
  renderMatrixTable("mt-W2", mtW2.map(function(v) { return [v]; }), [3, 1]);
  renderMatrixTable("mt-b2", [[mtb2]], [1, 1]);
}

function renderMatrixTable(containerId, matrix, dims) {
  var container = document.getElementById(containerId);
  var table = container.querySelector("table") || document.createElement("table");
  container.innerHTML = "";
  container.appendChild(table);
  table.innerHTML = "";
  for (var r = 0; r < dims[0]; r++) {
    var tr = document.createElement("tr");
    for (var c = 0; c < dims[1]; c++) {
      var td = document.createElement("td");
      var val = matrix[r][c];
      td.textContent = val !== undefined ? val.toFixed(4) : "---";
      if (val > 0.01) td.className = "highlight";
      else if (val < -0.01) td.className = "neg-highlight";
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
}

function mtLoop() {
  if (!mtRunning) return;
  mtStepEpoch();
  var res = mtUpdateInfo();
  mtRenderMatrices();
  if (res && res.acc >= 0.95) {
    mtRunning = false;
    document.getElementById("mt-play").textContent = "\u25B6 Start";
    return;
  }
  if (mtEpoch >= mtMaxEpoch) {
    mtRunning = false;
    document.getElementById("mt-play").textContent = "\u25B6 Start";
    return;
  }
  mtTimeoutId = setTimeout(mtLoop, mtDelay);
}

document.getElementById("mt-play").addEventListener("click", function() {
  if (mtRunning) {
    mtRunning = false;
    if (mtTimeoutId) { clearTimeout(mtTimeoutId); mtTimeoutId = null; }
    this.textContent = "\u25B6 Start";
  } else {
    if (mtEpoch === 0) mtReset();
    mtRunning = true;
    this.textContent = "\u23F8 Pause";
    mtLoop();
  }
});

document.getElementById("mt-delay").addEventListener("input", function() {
  mtDelay = +this.value;
  document.getElementById("mt-delay-label").textContent = mtDelay;
});

// --- Inizializzazione -------------------------------------------------------

initWeights();

if (!loadWeights()) {
  // Se non c'erano pesi salvati, initWeights è già stato chiamato con i default
  initWeights();
}

fwd(175, 70);
updateNormalization();
populateTrainingData();
resize();
