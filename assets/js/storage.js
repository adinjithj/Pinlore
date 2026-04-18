const STORAGE_KEYS = {
  pins: "memory-map-pins",
  theme: "memory-map-theme",
};

export function loadPins() {
  const raw = localStorage.getItem(STORAGE_KEYS.pins);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Could not parse saved pins.", error);
    return [];
  }
}

export function savePins(pins) {
  localStorage.setItem(STORAGE_KEYS.pins, JSON.stringify(pins));
}

export function getTheme() {
  return localStorage.getItem(STORAGE_KEYS.theme);
}

export function setTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}
