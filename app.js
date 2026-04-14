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

const markers = new Map();

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
  renderAllPins();
}

function renderAllPins() {
  markers.forEach((marker) => {
    map.removeLayer(marker);
  });
  markers.clear();

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
    <div class="pin-popup" id="pinForm">
      <label for="pinNameInput">Name this memory</label>
      <input id="pinNameInput" type="text" maxlength="80" placeholder="Ex: First solo trip" />
      <button type="button" id="dropPinBtn">Drop Pin</button>
      <div class="error" id="pinError">Please enter a name before dropping the pin.</div>
    </div>
  `;

  const popup = L.popup({ closeButton: true, autoClose: true, closeOnClick: false })
    .setLatLng(latlng)
    .setContent(popupContent)
    .openOn(map);

  setTimeout(() => {
    const nameInput = document.getElementById("pinNameInput");
    const errorText = document.getElementById("pinError");
    const dropBtn = document.getElementById("dropPinBtn");

    if (!dropBtn || !nameInput || !errorText) return;

    nameInput.focus();

    dropBtn.addEventListener("click", () => {
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
      renderAllPins();
      map.closePopup(popup);
    });
  }, 50);
}

/* ---------------------------
   Create a marker + hover label for one pin
---------------------------- */
function renderPin(pin) {
  const marker = L.marker([pin.lat, pin.lng]).addTo(map);
  markers.set(pin.id, marker);
  marker.bindTooltip(pin.name, {
    direction: "top",
    opacity: 0.95,
    sticky: true,
  });
  marker.bindPopup(
    `
      <div class="pin-popup">
        <label>${pin.name}</label>
        <button type="button" class="remove-pin-btn" data-pin-id="${pin.id}">Remove Pin</button>
      </div>
    `
  );

  marker.on("popupopen", () => {
    const popupEl = marker.getPopup().getElement();
    const removeButton = popupEl.querySelector(".remove-pin-btn");    
    if (!removeButton) {
      return;
    }

    removeButton.addEventListener("click", () => {
      removePin(pin.id);
    });
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

function removePin(pinId) {
  const pinIndex = pins.findIndex((pin) => pin.id === pinId);
  if (pinIndex === -1) {
    return;
  }

  pins.splice(pinIndex, 1);
  savePinsToStorage();
  renderAllPins();
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
