import { getTheme, setTheme } from "./storage.js";

export function initializeTheme(map, lightLayer, darkLayer) {
  const savedTheme = getTheme();
  const initialTheme = savedTheme === "dark" ? "dark" : "light";
  
  applyTheme(initialTheme, map, lightLayer, darkLayer);

  const themeToggleButton = document.getElementById("themeToggle");
  themeToggleButton.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, map, lightLayer, darkLayer);
    setTheme(nextTheme);
  });
}

export function applyTheme(theme, map, lightLayer, darkLayer) {
  document.documentElement.setAttribute("data-theme", theme);
  const themeToggleButton = document.getElementById("themeToggle");
  if (themeToggleButton) {
    themeToggleButton.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  if (!map || !lightLayer || !darkLayer) return;

  if (theme === "dark") {
    if (map.hasLayer(lightLayer)) map.removeLayer(lightLayer);
    if (!map.hasLayer(darkLayer)) darkLayer.addTo(map);
  } else {
    if (map.hasLayer(darkLayer)) map.removeLayer(darkLayer);
    if (!map.hasLayer(lightLayer)) lightLayer.addTo(map);
  }
}
