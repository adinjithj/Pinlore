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
let lightLayer;
let darkLayer;

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

  if (!map || !lightLayer || !darkLayer) {
    return;
  }

  if (nextTheme === "dark") {
    if (map.hasLayer(lightLayer)) {
      map.removeLayer(lightLayer);
    }
    if (!map.hasLayer(darkLayer)) {
      darkLayer.addTo(map);
    }
    return;
  }

  if (map.hasLayer(darkLayer)) {
    map.removeLayer(darkLayer);
  }
  if (!map.hasLayer(lightLayer)) {
    lightLayer.addTo(map);
  }
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

  lightLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  });

  darkLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  });

  lightLayer.addTo(map);

  const activeTheme = document.documentElement.getAttribute("data-theme");
  if (activeTheme === "dark") {
    map.removeLayer(lightLayer);
    darkLayer.addTo(map);
  }
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
        date: "",
        notes: "",
        photos: [],
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
  marker.on("click", () => {
    openPinDetailModal(pin.id);
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

function openPinDetailModal(pinId) {
  const pin = pins.find((item) => item.id === pinId);
  if (!pin) {
    return;
  }

  closePinDetailModal();

  const initialPhotos = normalizePinPhotos(pin);
  let photoData = [...initialPhotos];

  const modal = document.createElement("div");
  modal.id = "pinDetailModal";
  modal.className = "pin-detail-modal-root";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML = `
    <div id="pinDetailBackdrop" class="pin-detail-backdrop">
      <div id="pinDetailCard" class="pin-detail-card">
        <input
          id="pinDetailName"
          class="pin-detail-title-input"
          type="text"
          maxlength="80"
          placeholder="Memory title"
        />

        <input
          id="pinDetailDate"
          class="pin-detail-date-input"
          type="date"
        />

        <textarea
          id="pinDetailNotes"
          class="pin-detail-notes-input"
          rows="7"
          placeholder="Write your memory..."
        ></textarea>

        <section class="pin-detail-photos">
          <label for="pinDetailPhotos" class="pin-detail-photos-label">Photos</label>
          <input id="pinDetailPhotos" class="pin-detail-photo-input" type="file" accept="image/*" multiple />
          <div id="pinDetailPhotoGrid" class="pin-detail-photo-grid"></div>
        </section>

        <div class="pin-detail-actions">
          <button type="button" id="pinDetailDelete" class="pin-detail-btn pin-detail-btn-delete">Delete</button>
          <button type="button" id="pinDetailSave" class="pin-detail-btn pin-detail-btn-save">Save</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const backdrop = document.getElementById("pinDetailBackdrop");
  const card = document.getElementById("pinDetailCard");
  const nameInput = document.getElementById("pinDetailName");
  const dateInput = document.getElementById("pinDetailDate");
  const notesInput = document.getElementById("pinDetailNotes");
  const photoInput = document.getElementById("pinDetailPhotos");
  const photoGrid = document.getElementById("pinDetailPhotoGrid");
  const saveButton = document.getElementById("pinDetailSave");
  const deleteButton = document.getElementById("pinDetailDelete");

  if (
    !backdrop ||
    !card ||
    !nameInput ||
    !dateInput ||
    !notesInput ||
    !photoInput ||
    !photoGrid ||
    !saveButton ||
    !deleteButton
  ) {
    closePinDetailModal();
    return;
  }

  nameInput.value = pin.name || "";
  dateInput.value = pin.date || "";
  notesInput.value = pin.notes || "";
  renderPinDetailPhotoGrid(photoData, photoGrid);

  photoInput.addEventListener("change", async () => {
    const files = photoInput.files ? Array.from(photoInput.files) : [];
    if (!files.length) {
      return;
    }

    try {
      const base64Images = await Promise.all(files.map((file) => fileToBase64(file)));
      photoData = [...photoData, ...base64Images];
      renderPinDetailPhotoGrid(photoData, photoGrid);
      photoInput.value = "";
    } catch (error) {
      console.warn("Could not read selected image.", error);
    }
  });

  saveButton.addEventListener("click", () => {
    const nextName = nameInput.value.trim();
    if (!nextName) {
      nameInput.focus();
      return;
    }

    pin.name = nextName;
    pin.date = dateInput.value || "";
    pin.notes = notesInput.value.trim();
    pin.photos = photoData;
    pin.photo = photoData.length ? photoData[0] : null;

    savePinsToStorage();
    closePinDetailModal();
    renderAllPins();
  });

  deleteButton.addEventListener("click", () => {
    const confirmed = window.confirm("Delete this pin?");
    if (!confirmed) {
      return;
    }
    closePinDetailModal();
    removePin(pin.id);
  });

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) {
      closePinDetailModal();
    }
  });

  card.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  nameInput.focus();
}

function normalizePinPhotos(pin) {
  if (Array.isArray(pin.photos)) {
    return pin.photos.filter((photo) => typeof photo === "string" && photo.length > 0);
  }
  if (typeof pin.photo === "string" && pin.photo.length > 0) {
    return [pin.photo];
  }
  return [];
}

function renderPinDetailPhotoGrid(photos, container) {
  container.innerHTML = "";
  if (!photos.length) {
    const empty = document.createElement("div");
    empty.className = "pin-detail-photo-empty";
    empty.textContent = "No photos yet";
    container.appendChild(empty);
    return;
  }

  photos.forEach((photo) => {
    const thumb = document.createElement("img");
    thumb.className = "pin-detail-photo-thumb";
    thumb.src = photo;
    thumb.alt = "Memory photo";
    container.appendChild(thumb);
  });
}

function closePinDetailModal() {
  const existingModal = document.getElementById("pinDetailModal");
  if (existingModal) {
    existingModal.remove();
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read selected image."));
    reader.readAsDataURL(file);
  });
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
