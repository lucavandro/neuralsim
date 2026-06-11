import { writable } from 'svelte/store';

const STORAGE_KEY = 'neuralsim-theme';

function getInitial() {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {}
  }
  return 'dark';
}

export const currentTheme = writable(getInitial());

export function setTheme(t) {
  currentTheme.set(t);
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = t;
  }
  if (typeof localStorage !== 'undefined') {
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
  }
}

export function toggleTheme() {
  var t;
  currentTheme.subscribe(function(v) { t = v; })();
  setTheme(t === 'dark' ? 'light' : 'dark');
}
