<script>
  import { getTrainingData } from '$lib/data/training-data.js';

  var data = $derived(getTrainingData());
  var computed = $derived.by(function() {
    var show = Math.min(15, data.length);
    var rows = [];
    var inF = 0, nonF = 0;
    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      if (d.label === 1) inF++; else nonF++;
      if (i < show) {
        var bmi = d.w / ((d.h / 100) * (d.h / 100));
        rows.push({ peso: Math.round(d.w), altezza: (d.h / 100).toFixed(2), inForma: bmi >= 18.5 && bmi <= 25 });
      }
    }
    return { rows: rows, inF: inF, nonF: nonF };
  });
  var tableRows = $derived(computed.rows);
  var inFormaCount = $derived(computed.inF);
  var nonFormaCount = $derived(computed.nonF);
</script>

<div class="td-container">
  <div class="td-section">
    <h3>Esempi di dati di training</h3>
    <div class="td-table-wrap">
      <table class="td-table">
        <thead><tr><th>Peso (kg)</th><th>Altezza (m)</th><th>Label</th></tr></thead>
        <tbody>
          {#each tableRows as row}
            <tr>
              <td>{row.peso}</td>
              <td>{row.altezza}</td>
              <td class={row.inForma ? "label-yes" : "label-no"}>{row.inForma ? "In forma" : "Non in forma"}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
  <div class="td-section">
    <h3>Statistiche ({data.length} campioni)</h3>
    <div class="td-stats">
      <div class="stat-row"><span class="stat-label">Totale esempi:</span><span class="stat-val">{data.length}</span></div>
      <div class="stat-row"><span class="stat-label">In forma (18.5 &le; BMI &le; 25):</span><span class="stat-val td-green">{inFormaCount} ({(inFormaCount / (data.length || 1) * 100).toFixed(1)}%)</span></div>
      <div class="stat-row"><span class="stat-label">Non in forma (BMI &lt; 18.5 o &gt; 25):</span><span class="stat-val td-red">{nonFormaCount} ({(nonFormaCount / (data.length || 1) * 100).toFixed(1)}%)</span></div>
    </div>
  </div>
</div>

<style>
  .td-container { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
  .td-section { background: #16213e; border-radius: 12px; padding: 24px; }
  .td-section h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #8888aa; margin-bottom: 16px; }

  .td-table-wrap { overflow-x: auto; }
  .td-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .td-table th { background: #0f0f1a; color: #666688; padding: 10px 14px; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-size: 11px; }
  .td-table td { padding: 8px 14px; border-bottom: 1px solid #0f3460; color: #c0c0d0; font-family: Consolas, monospace; }
  .td-table tr:hover td { background: rgba(79, 195, 247, 0.04); }
  .label-yes { color: #81c784; font-weight: 600; }
  .label-no { color: #e57373; font-weight: 600; }
  .td-stats { display: flex; flex-direction: column; gap: 8px; }
  .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #0f3460; }
  .stat-row:last-child { border-bottom: none; }
  .stat-label { font-size: 14px; color: #a0a0c0; }
  .stat-val { font-size: 15px; font-weight: 700; font-family: Consolas, monospace; color: #e0e0ff; }
  .stat-val.td-green { color: #81c784; }
  .stat-val.td-red { color: #e57373; }
</style>
