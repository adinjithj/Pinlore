/* -----------------------------------------------------------
   Memory Map - Phase 1
   This file handles map setup, pin creation, pin persistence,
   and dark/light theme persistence.
------------------------------------------------------------ */

/* ---------------------------
   Constants and local storage keys
---------------------------- */
const DEFAULT_CENTER = [23.4733, 77.9470]; // Madhya Pradesh, India
const DEFAULT_ZOOM = 7;
const LIVE_LOCATION_ZOOM = 12;

const STORAGE_KEYS = {
  pins: "memory-map-pins",
  theme: "memory-map-theme",
};

/* ---------------------------
   App state
---------------------------- */
const pins = loadPinsFromStorage();
const themeToggleButton = document.getElementById("themeToggle");

let map;

/* ---------------------------
   App startup
---------------------------- */
initializeTheme();
initializeMap();
renderStoredPins();
attemptLiveLocationCentering();
registerMapClickHandler();

/* ---------------------------
   Theme setup and persistence
---------------------------- */
function initializeTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  const initialTheme = savedTheme === "dark" ? "dark" : "light";

  applyTheme(initialTheme);
  themeToggleButton.addEventListener("click", toggleTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  applyTheme(nextTheme);
  localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggleButton.textContent = theme === "dark" ? "☀️" : "🌙";
}

/* ---------------------------
   Leaflet map setup
---------------------------- */
function initializeMap() {
  map = L.map("map").setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
}

/* ---------------------------
   Optional live-location centering
   If permission is granted, map recenters to the user.
---------------------------- */
function attemptLiveLocationCentering() {
  if (!navigator.geolocation) {
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], LIVE_LOCATION_ZOOM);
    },
    () => {
      // If denied or unavailable, we intentionally keep the default center.
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

/* ---------------------------
   Render all pins saved in local storage
---------------------------- */
function renderStoredPins() {
  pins.forEach((pin) => {
    renderPin(pin);
  });
}

/* ---------------------------
   Handle map clicks and ask for memory name
---------------------------- */
function registerMapClickHandler() {
  map.on("click", (event) => {
    openPinNamePopup(event.latlng);
  });
}

function openPinNamePopup(latlng) {
  const popupContent = `
    <form class="pin-popup" id="pinForm">
      <label for="pinNameInput">Name this memory</label>
      <input id="pinNameInput" type="text" maxlength="80" placeholder="Ex: First solo trip" />
      <button type="submit">Drop Pin</button>
      <div class="error" id="pinError">Please enter a name before dropping the pin.</div>
    </form>
  `;

  const popup = L.popup({ closeButton: true, autoClose: true, closeOnClick: false })
    .setLatLng(latlng)
    .setContent(popupContent)
    .openOn(map);

  map.once("popupopen", () => {
    const form = document.getElementById("pinForm");
    const nameInput = document.getElementById("pinNameInput");
    const errorText = document.getElementById("pinError");

    if (!form || !nameInput || !errorText) {
      return;
    }

    nameInput.focus();

    form.addEventListener("submit", (submitEvent) => {
      submitEvent.preventDefault();

      const name = nameInput.value.trim();
      if (!name) {
        errorText.style.display = "block";
        return;
      }

      const newPin = {
        id: generateId(),
        name,
        lat: latlng.lat,
        lng: latlng.lng,
        notes: "",
        photo: null,
      };

      pins.push(newPin);
      savePinsToStorage();
      renderPin(newPin);
      map.closePopup(popup);
    });
  });
}

/* ---------------------------
   Create a marker + hover label for one pin
---------------------------- */
function renderPin(pin) {
  const marker = L.marker([pin.lat, pin.lng]).addTo(map);
  marker.bindTooltip(pin.name, {
    direction: "top",
    opacity: 0.95,
    sticky: true,
  });
}

/* ---------------------------
   Local storage helpers for pins
---------------------------- */
function loadPinsFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEYS.pins);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Could not parse saved pins. Starting with an empty map.", error);
    return [];
  }
}

function savePinsToStorage() {
  localStorage.setItem(STORAGE_KEYS.pins, JSON.stringify(pins));
}

/* ---------------------------
   Utility helper for pin IDs
---------------------------- */
function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `pin-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
