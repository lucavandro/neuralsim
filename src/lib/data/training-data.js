import csvContent from '$lib/data/training-data.csv?raw';

let _data = null;

export function getTrainingData() {
  if (_data) return _data;
  var lines = csvContent.trim().split('\n');
  lines.shift();
  _data = lines.map(function(line) {
    var parts = line.split(',');
    return { h: +parts[0], w: +parts[1], label: +parts[2] };
  });
  return _data;
}
