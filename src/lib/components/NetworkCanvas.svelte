<script>
  import { net, anim, speedConfig, selection, L_IN, L_HID, L_OUT, LABELS } from '$lib/network.svelte.js';
  import { onDestroy } from 'svelte';

  let canvas;
  let ctx;
  let W = 0, H = 0, ly = [];
  const R = 24;
  const BASE_DUR = [0, 400, 700, 400, 700, 400, 1200];
  let animFrameId = 0;

  let { } = $props();

  function lay(cw, ch) {
    return [
      [{ x: cw * 0.12, y: ch * 0.30 }, { x: cw * 0.12, y: ch * 0.58 }],
      [{ x: cw * 0.45, y: ch * 0.15 }, { x: cw * 0.45, y: ch * 0.40 }, { x: cw * 0.45, y: ch * 0.65 }],
      [{ x: cw * 0.78, y: ch * 0.40 }]
    ];
  }
  function weightColor(w) { return w > 0 ? { r: 66, g: 165, b: 245 } : { r: 239, g: 68, b: 68 }; }
  function rgba(r, g, b, a) { return "rgba(" + r + "," + g + "," + b + "," + a + ")"; }
  function edgePoint(x1, y1, x2, y2, r) {
    var dx = x2 - x1, dy = y2 - y1, d = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: x1 + (dx / d) * r, y: y1 + (dy / d) * r };
  }
  function drawArrowhead(x, y, angle, size, col, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size, -size * 0.4); ctx.lineTo(-size, size * 0.4);
    ctx.closePath(); ctx.fillStyle = rgba(col.r, col.g, col.b, alpha); ctx.fill(); ctx.restore();
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, W, H);

    var layers = ly;
    var conns = net.weights;
    var inputSignal = (anim.phase === 2 ? anim.progress : (anim.phase > 2 ? 1 : 0));
    var outputSignal = (anim.phase === 4 ? anim.progress : (anim.phase > 4 ? 1 : 0));
    var showHidden = (anim.phase >= 3);
    var showOutput = (anim.phase >= 5);
    var showResult = (anim.phase >= 6);
    var showInput = (anim.phase >= 1);

    for (var ci = 0; ci < conns.length; ci++) {
      var c = conns[ci];
      var fl = c.from[0], fn = c.from[1], tl = c.to[0], tn = c.to[1];
      var fr = layers[fl][fn], to = layers[tl][tn];
      var ef = edgePoint(fr.x, fr.y, to.x, to.y, R);
      var et = edgePoint(to.x, to.y, fr.x, fr.y, R);
      var signal = (tl === L_HID) ? inputSignal : outputSignal;
      var col = weightColor(c.w);
      var baseAlpha = Math.min(1, 0.2 + Math.abs(c.w) * 0.2);
      var angle = Math.atan2(to.y - fr.y, to.x - fr.x);

      if (anim.running && signal > 0 && signal < 1) {
        var mx = fr.x + (to.x - fr.x) * signal;
        var my = fr.y + (to.y - fr.y) * signal;
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(et.x, et.y);
        ctx.strokeStyle = rgba(60, 60, 90, baseAlpha * 0.5); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ef.x, ef.y); ctx.lineTo(mx, my);
        ctx.strokeStyle = rgba(col.r, col.g, col.b, 0.9); ctx.lineWidth = 2.5; ctx.stroke();
        drawArrowhead(et.x, et.y, angle, 8, col, baseAlpha * 0.4);
      } else {
        var active = (signal >= 1);
        ctx.beginPath(); ctx.moveTo(ef.x, ef.y); ctx.lineTo(et.x, et.y);
        ctx.strokeStyle = active ? rgba(col.r, col.g, col.b, 0.85) : rgba(60, 60, 90, baseAlpha * 0.5);
        ctx.lineWidth = active ? 2.5 : 1.5; ctx.stroke();
        drawArrowhead(et.x, et.y, angle, 8, col, active ? 0.9 : baseAlpha * 0.4);
      }
      ctx.save();
      ctx.font = "11px Consolas, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = rgba(150, 150, 180, 0.7);
      ctx.fillText(c.w.toFixed(2), (fr.x + to.x) / 2, (fr.y + to.y) / 2 - 12);
      ctx.restore();
    }

    for (var l = 0; l < layers.length; l++) {
      for (var n = 0; n < layers[l].length; n++) {
        var p = layers[l][n];
        var v = l === L_IN ? net.iv[n] : (l === L_HID ? net.hv[n] : net.ov);
        var active = false, actVal = 0;
        if (l === L_IN) { active = showInput || anim.running; actVal = v; }
        else if (l === L_HID) { active = showHidden; actVal = v; }
        else { active = showOutput; actVal = v; }
        var hue = 200 + actVal * 60;

        if (active) {
          var g = ctx.createRadialGradient(p.x, p.y, R * 0.3, p.x, p.y, R * 2);
          g.addColorStop(0, "hsla(" + hue + ", 80%, 60%, 0.15)");
          g.addColorStop(1, "hsla(" + hue + ", 80%, 60%, 0)");
          ctx.beginPath(); ctx.arc(p.x, p.y, R * 2, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
        if (active) {
          var g2 = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, R);
          g2.addColorStop(0, "hsl(" + hue + "," + (l === L_OUT ? "90%,75%" : "80%,70%") + ")");
          g2.addColorStop(1, "hsl(" + hue + "," + (l === L_OUT ? "80%,45%" : "70%,40%") + ")");
          ctx.fillStyle = g2;
        } else ctx.fillStyle = "#2a2a3e";
        ctx.fill();
        ctx.strokeStyle = active ? "hsla(" + hue + ",80%,60%,0.8)" : "#3a3a5e";
        ctx.lineWidth = 2; ctx.stroke();
        ctx.save();
        ctx.font = active ? "bold 13px Segoe UI, sans-serif" : "11px Segoe UI, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = active ? "#fff" : "#666688";
        ctx.fillText(active ? actVal.toFixed(2) : LABELS[l][n], p.x, active ? p.y - 3 : p.y);
        ctx.restore();

        if (l === L_HID || l === L_OUT) {
          var bv = (l === L_HID) ? net.biases.hidden[n] : net.biases.output;
          var bc = weightColor(bv), ba = Math.min(1, 0.15 + Math.abs(bv) * 0.25);
          var bx = p.x, by = p.y - 55;
          var bee = edgePoint(p.x, p.y, bx, by, R);
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bee.x, bee.y);
          ctx.strokeStyle = active ? rgba(bc.r, bc.g, bc.b, 0.85) : rgba(60, 60, 90, ba * 0.5);
          ctx.lineWidth = active ? 3 : 1.5; ctx.stroke();
          drawArrowhead(bee.x, bee.y, Math.atan2(p.y - by, p.x - bx), 8, bc, active ? 0.9 : ba * 0.4);
          ctx.save();
          ctx.font = "bold 12px Consolas, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
          ctx.fillStyle = active ? rgba(bc.r, bc.g, bc.b, 0.9) : rgba(100, 100, 135, 0.6);
          ctx.fillText(bv.toFixed(2), bx, by - 4);
          ctx.restore();
        }
        ctx.save();
        ctx.font = "11px Segoe UI, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillStyle = active ? "#aaaacc" : "#555577";
        ctx.fillText(LABELS[l][n], p.x, p.y + R + 6);
        ctx.restore();
      }
    }

    var ln = ["INPUT", "HIDDEN", "OUTPUT"], lx = [layers[0][0].x, layers[1][0].x, layers[2][0].x];
    for (var li = 0; li < 3; li++) {
      ctx.save(); ctx.font = "9px Segoe UI, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillStyle = "#444466"; ctx.fillText(ln[li], lx[li], H - 12); ctx.restore();
    }
    if (showResult) {
      ctx.save(); ctx.font = "bold 20px Segoe UI, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillStyle = anim.result ? "#81c784" : "#e57373";
      ctx.fillText(anim.result ? "IN FORMA" : "NON IN FORMA", layers[2][0].x, layers[2][0].y - R - 40);
      ctx.restore();
    }
  }

  function resize() {
    if (!canvas) return;
    var rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width; H = rect.height;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ly = lay(W, H);
    draw();
  }

  function animLoop(now) {
    if (!anim.running) return;
    var elapsed = now - anim.startTime, phase = 1, accum = 0;
    for (var p = 1; p < BASE_DUR.length; p++) {
      var dur = BASE_DUR[p] / speedConfig.value;
      if (elapsed < accum + dur) { phase = p; anim.progress = (elapsed - accum) / dur; break; }
      accum += dur;
      if (p === BASE_DUR.length - 1) { phase = p; anim.progress = 1; break; }
    }
    anim.phase = phase;
    draw();
    if (phase < BASE_DUR.length - 1) { animFrameId = requestAnimationFrame(animLoop); }
    else { anim.running = false; anim.phase = 5; }
  }

  function onClick(e) {
    if (anim.running) return;
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.x, my = e.clientY - rect.y;

    for (var l = 1; l <= 2; l++) {
      for (var n = 0; n < ly[l].length; n++) {
        var p = ly[l][n];
        if (Math.hypot(mx - p.x, my - p.y) < R) {
          var val = (l === L_HID) ? net.biases.hidden[n] : net.biases.output;
          selection.bias = { layer: l, index: n };
          selection.conn = null;
          selection.label = "Bias of " + LABELS[l][n];
          selection.value = val;
          selection.visible = true;
          draw();
          return;
        }
      }
    }
    for (var i = 0; i < net.weights.length; i++) {
      var c = net.weights[i], fr = ly[c.from[0]][c.from[1]], to = ly[c.to[0]][c.to[1]];
      var dx = to.x - fr.x, dy = to.y - fr.y, ls = dx * dx + dy * dy || 1;
      var t = Math.max(0, Math.min(1, ((mx - fr.x) * dx + (my - fr.y) * dy) / ls));
      if (Math.hypot(mx - (fr.x + t * dx), my - (fr.y + t * dy)) < 12) {
        selection.conn = { from: c.from, to: c.to };
        selection.bias = null;
        selection.label = LABELS[c.from[0]][c.from[1]] + " \u2192 " + LABELS[c.to[0]][c.to[1]];
        selection.value = c.w;
        selection.visible = true;
        draw();
        return;
      }
    }
    selection.conn = null;
    selection.bias = null;
    selection.visible = false;
    draw();
  }

  $effect(() => {
    if (canvas && !ctx) {
      ctx = canvas.getContext("2d");
      resize();
    }
  });

  $effect(() => {
    if (anim.running && canvas) {
      anim.phase = 1; anim.progress = 0; anim.startTime = performance.now();
      animFrameId = requestAnimationFrame(animLoop);
      return () => { if (animFrameId) cancelAnimationFrame(animFrameId); };
    }
  });

  $effect(() => {
    net.weights; net.biases; net.iv; net.hv; net.ov;
    anim.phase; anim.progress;
    ly; W; H;
    if (ctx && !anim.running) draw();
  });

  $effect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }
  });

  onDestroy(() => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    anim.running = false;
  });
</script>

<div id="canvas-container">
  <canvas bind:this={canvas} onclick={onClick} id="network-canvas"></canvas>
  <div id="canvas-hint">Clicca su una connessione o su un neurone hidden/output per modificarne peso / bias</div>
</div>

<style>
  #canvas-container { flex: 1; position: relative; background: #1a1a2e; min-width: 0; overflow: hidden; }
  #network-canvas { width: 100%; height: 100%; display: block; cursor: pointer; }
  #canvas-hint { position: absolute; bottom: 36px; left: 50%; transform: translateX(-50%); font-size: 12px; color: #444466; background: rgba(26,26,46,0.85); padding: 6px 14px; border-radius: 12px; pointer-events: none; white-space: nowrap; z-index: 1; }
</style>
