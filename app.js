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

  const modal = document.createElement("div");
  modal.id = "pinDetailModal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML = `
    <div id="pinDetailBackdrop" style="position:fixed;inset:0;z-index:2200;background:rgba(5,12,22,0.42);display:grid;place-items:center;padding:1rem;">
      <div id="pinDetailCard" style="width:min(92vw,460px);max-height:90vh;overflow:auto;background:var(--bg-panel);color:var(--text-main);border:1px solid var(--border-soft);border-radius:14px;box-shadow:var(--shadow-soft);padding:1rem;display:flex;flex-direction:column;gap:0.6rem;">
        <h2 style="margin:0 0 0.2rem 0;font-size:1.05rem;">Edit Memory</h2>
        <label for="pinDetailName" style="font-size:0.84rem;color:var(--text-muted);">Name</label>
        <input id="pinDetailName" type="text" maxlength="80" style="width:100%;border:1px solid var(--border-soft);border-radius:10px;padding:0.58rem 0.72rem;background:transparent;color:inherit;" />
        <label for="pinDetailNotes" style="font-size:0.84rem;color:var(--text-muted);">Notes</label>
        <textarea id="pinDetailNotes" rows="5" style="width:100%;resize:vertical;border:1px solid var(--border-soft);border-radius:10px;padding:0.58rem 0.72rem;background:transparent;color:inherit;"></textarea>
        <label for="pinDetailPhoto" style="font-size:0.84rem;color:var(--text-muted);">Photo</label>
        <input id="pinDetailPhoto" type="file" accept="image/*" />
        <img id="pinDetailPreview" alt="Pin photo preview" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px;border:1px solid var(--border-soft);" />
        <div style="display:flex;gap:0.55rem;justify-content:flex-end;margin-top:0.2rem;flex-wrap:wrap;">
          <button type="button" id="pinDetailDelete" style="border:none;border-radius:10px;padding:0.55rem 0.85rem;background:#dc4f4f;color:#fff;cursor:pointer;">Delete</button>
          <button type="button" id="pinDetailClose" style="border:none;border-radius:10px;padding:0.55rem 0.85rem;background:var(--text-muted);color:#fff;cursor:pointer;">Cancel</button>
          <button type="button" id="pinDetailSave" style="border:none;border-radius:10px;padding:0.55rem 0.85rem;background:var(--accent);color:#fff;cursor:pointer;">Save</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const backdrop = document.getElementById("pinDetailBackdrop");
  const card = document.getElementById("pinDetailCard");
  const nameInput = document.getElementById("pinDetailName");
  const notesInput = document.getElementById("pinDetailNotes");
  const photoInput = document.getElementById("pinDetailPhoto");
  const previewImage = document.getElementById("pinDetailPreview");
  const saveButton = document.getElementById("pinDetailSave");
  const deleteButton = document.getElementById("pinDetailDelete");
  const closeButton = document.getElementById("pinDetailClose");

  if (
    !backdrop ||
    !card ||
    !nameInput ||
    !notesInput ||
    !photoInput ||
    !previewImage ||
    !saveButton ||
    !deleteButton ||
    !closeButton
  ) {
    closePinDetailModal();
    return;
  }

  nameInput.value = pin.name || "";
  notesInput.value = pin.notes || "";

  if (pin.photo) {
    previewImage.src = pin.photo;
    previewImage.style.display = "block";
  } else {
    previewImage.removeAttribute("src");
    previewImage.style.display = "none";
  }

  let selectedPhotoFile = null;

  photoInput.addEventListener("change", () => {
    const file = photoInput.files && photoInput.files[0] ? photoInput.files[0] : null;
    selectedPhotoFile = file;
    if (!file) {
      if (pin.photo) {
        previewImage.src = pin.photo;
        previewImage.style.display = "block";
      } else {
        previewImage.removeAttribute("src");
        previewImage.style.display = "none";
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      previewImage.src = String(reader.result || "");
      previewImage.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  saveButton.addEventListener("click", async () => {
    const nextName = nameInput.value.trim();
    if (!nextName) {
      nameInput.focus();
      return;
    }

    pin.name = nextName;
    pin.notes = notesInput.value.trim();
    if (selectedPhotoFile) {
      try {
        pin.photo = await fileToBase64(selectedPhotoFile);
      } catch (error) {
        console.warn("Could not read selected image.", error);
        return;
      }
    }

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

  closeButton.addEventListener("click", closePinDetailModal);

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
