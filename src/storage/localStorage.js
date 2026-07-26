const STORAGE_KEY = 'mood-tracker-entries';

export function loadEntries() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Unable to load stored entries', error);
    return [];
  }
}

export function saveEntries(entries) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Unable to save entries', error);
  }
}

export function clearEntries() {
  window.localStorage.removeItem(STORAGE_KEY);
}
