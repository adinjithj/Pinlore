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
const locationSearchInput = document.getElementById("locationSearchInput");
const locationSearchDropdown = document.getElementById("locationSearchDropdown");
const memorySidebarSearch = document.getElementById("memorySidebarSearch");
const memorySidebarList = document.getElementById("memorySidebarList");

const markers = new Map();

let map;
let lightLayer;
let darkLayer;
let lifePathSegments = [];
let searchResultMarker;
let searchDebounceTimer;
let searchSuggestions = [];
let selectedSidebarPinId = null;
let memorySidebarQuery = "";

/* ---------------------------
   App startup
---------------------------- */
initializeTheme();
initializeMap();
renderStoredPins();
attemptLiveLocationCentering();
registerMapClickHandler();
registerLocationSearch();
registerMemorySidebarSearch();

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

  drawLifePath();
  renderMemorySidebar();
}

function drawLifePath() {
  if (!map) {
    return;
  }

  lifePathSegments.forEach((segment) => {
    map.removeLayer(segment);
  });
  lifePathSegments = [];

  const sortedPins = [...pins].sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    return aTime - bTime;
  });

  const pathPoints = sortedPins
    .map((pin) => [Number(pin.lat), Number(pin.lng)])
    .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

  if (pathPoints.length < 2) {
    return;
  }

  const accentColor =
    getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2a7fff";

  for (let i = 0; i < pathPoints.length - 1; i += 1) {
    const segment = L.polyline([pathPoints[i], pathPoints[i + 1]], {
      color: accentColor,
      weight: 3,
      opacity: 0.72,
      smoothFactor: 1,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    segment.bringToBack();
    lifePathSegments.push(segment);
  }
}

function registerLocationSearch() {
  if (!locationSearchInput || !locationSearchDropdown) {
    return;
  }

  locationSearchInput.addEventListener("input", () => {
    const query = locationSearchInput.value.trim();
    if (!query) {
      clearSearchSuggestions();
      return;
    }

    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    searchDebounceTimer = setTimeout(async () => {
      await fetchSearchSuggestions(query);
    }, 300);
  });

  locationSearchInput.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (searchSuggestions.length > 0) {
      selectSearchSuggestion(searchSuggestions[0]);
      return;
    }

    const query = locationSearchInput.value.trim();
    if (!query) {
      return;
    }

    const fallbackResults = await fetchSearchResults(query, 1);
    if (!fallbackResults.length) {
      window.alert("No locations found.");
      return;
    }

    selectSearchSuggestion(fallbackResults[0]);
  });

  locationSearchInput.addEventListener("blur", () => {
    setTimeout(() => {
      clearSearchSuggestions();
    }, 120);
  });
}

async function fetchSearchSuggestions(query) {
  try {
    const results = await fetchSearchResults(query, 20);
    if (!results.length) {
      renderSearchSuggestions([]);
      return;
    }

    const filteredResults = filterLocationResults(results);
    const suggestions = filteredResults.length ? filteredResults.slice(0, 5) : results.slice(0, 5);
    renderSearchSuggestions(suggestions);
  } catch (error) {
    console.warn("Location search failed.", error);
    renderSearchSuggestions([]);
  }
}

async function fetchSearchResults(query, limit) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Search failed with status ${response.status}`);
  }

  const results = await response.json();
  return Array.isArray(results) ? results.slice(0, limit) : [];
}

function filterLocationResults(results) {
  const allowedTypes = new Set(["city", "town", "village", "state", "country"]);
  const excludedTypes = new Set(["house", "road", "building", "residential", "commercial"]);
  const excludedClasses = new Set(["amenity", "building", "highway", "shop", "tourism"]);

  return results.filter((result) => {
    const type = String(result.type || "").toLowerCase();
    const resultClass = String(result.class || "").toLowerCase();
    const addresstype = String(result.addresstype || "").toLowerCase();

    if (excludedTypes.has(type) || excludedClasses.has(resultClass)) {
      return false;
    }

    if (allowedTypes.has(type) || allowedTypes.has(addresstype)) {
      return true;
    }

    if (resultClass === "place" && (allowedTypes.has(type) || allowedTypes.has(addresstype))) {
      return true;
    }

    if (resultClass === "boundary" && type === "administrative") {
      return allowedTypes.has(addresstype);
    }

    return false;
  });
}

function renderSearchSuggestions(results) {
  searchSuggestions = results;
  locationSearchDropdown.innerHTML = "";

  if (!results.length) {
    const emptyItem = document.createElement("div");
    emptyItem.className = "location-search-item is-empty";
    emptyItem.textContent = "No locations found";
    locationSearchDropdown.appendChild(emptyItem);
    locationSearchDropdown.hidden = false;
    return;
  }

  results.forEach((result) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "location-search-item";
    item.textContent = formatSuggestionLabel(result);
    item.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    item.addEventListener("click", () => {
      selectSearchSuggestion(result);
    });
    locationSearchDropdown.appendChild(item);
  });

  locationSearchDropdown.hidden = false;
}

function formatSuggestionLabel(result) {
  const address = result.address || {};
  const primaryName =
    result.name ||
    address.city ||
    address.town ||
    address.village ||
    address.state ||
    address.country ||
    String(result.display_name || "").split(",")[0] ||
    "Unknown location";

  const secondaryName =
    address.country ||
    address.state ||
    String(result.display_name || "")
      .split(",")
      .slice(1)
      .join(",")
      .trim();

  return secondaryName && secondaryName !== primaryName
    ? `${primaryName}, ${secondaryName}`
    : primaryName;
}

function clearSearchSuggestions() {
  searchSuggestions = [];
  locationSearchDropdown.innerHTML = "";
  locationSearchDropdown.hidden = true;
}

function selectSearchSuggestion(result) {
  const lat = Number(result.lat);
  const lon = Number(result.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    window.alert("Invalid location result.");
    return;
  }

  map.setView([lat, lon], 12);
  showTemporarySearchMarker(lat, lon, result.display_name || locationSearchInput.value.trim());
  locationSearchInput.value = result.display_name || locationSearchInput.value.trim();
  clearSearchSuggestions();
}

function showTemporarySearchMarker(lat, lon, label) {
  if (searchResultMarker) {
    map.removeLayer(searchResultMarker);
    searchResultMarker = null;
  }

  searchResultMarker = L.marker([lat, lon]).addTo(map);
  if (label) {
    searchResultMarker.bindPopup(label).openPopup();
  }

  setTimeout(() => {
    if (searchResultMarker) {
      map.removeLayer(searchResultMarker);
      searchResultMarker = null;
    }
  }, 5000);
}

function registerMemorySidebarSearch() {
  if (!memorySidebarSearch) {
    return;
  }

  memorySidebarSearch.addEventListener("input", () => {
    memorySidebarQuery = memorySidebarSearch.value.trim().toLowerCase();
    renderMemorySidebar();
  });
}

function renderMemorySidebar() {
  if (!memorySidebarList) {
    return;
  }

  memorySidebarList.innerHTML = "";

  const sortedPins = [...pins].sort((a, b) => {
    const aTime = new Date(a.date || "").getTime();
    const bTime = new Date(b.date || "").getTime();
    return bTime - aTime;
  });

  const visiblePins = sortedPins.filter((pin) => {
    if (!memorySidebarQuery) {
      return true;
    }

    const name = String(pin.name || "").toLowerCase();
    const notes = String(pin.notes || "").toLowerCase();
    return name.includes(memorySidebarQuery) || notes.includes(memorySidebarQuery);
  });

  if (!visiblePins.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "memory-sidebar-empty";
    emptyState.textContent = "No memories found.";
    memorySidebarList.appendChild(emptyState);
    return;
  }

  visiblePins.forEach((pin) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "memory-sidebar-item";
    if (pin.id === selectedSidebarPinId) {
      item.classList.add("active");
    }

    const title = document.createElement("div");
    title.className = "memory-sidebar-item-title";
    title.textContent = pin.name || "Untitled memory";

    const date = document.createElement("div");
    date.className = "memory-sidebar-item-date";
    date.textContent = pin.date || "No date";

    item.appendChild(title);
    item.appendChild(date);
    item.addEventListener("click", () => {
      selectedSidebarPinId = pin.id;
      map.flyTo([pin.lat, pin.lng], 13, { duration: 1.2 });
      renderMemorySidebar();
    });

    memorySidebarList.appendChild(item);
  });
}

/* ---------------------------
   Handle map clicks and ask for memory name
---------------------------- */
function registerMapClickHandler() {
  map.on("click", (event) => {
    openPinDetailModal(null, event.latlng);
  });
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
    selectedSidebarPinId = pin.id;
    renderMemorySidebar();
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
  if (selectedSidebarPinId === pinId) {
    selectedSidebarPinId = null;
  }
  savePinsToStorage();
  renderAllPins();
}

function openPinDetailModal(pinId, latlng = null) {
  const today = new Date().toISOString().slice(0, 10);
  const pin = pinId ? pins.find((item) => item.id === pinId) : null;
  const isNewPin = !pin;

  if (isNewPin && !latlng) {
    return;
  }

  if (!isNewPin && !pin) {
    return;
  }

  closePinDetailModal();

  const initialPhotos = normalizePinPhotos(pin || {});
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

  nameInput.value = pin ? pin.name || "" : "";
  dateInput.value = pin ? pin.date || today : today;
  notesInput.value = pin ? pin.notes || "" : "";
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

    const nextDate = /^\d{4}-\d{2}-\d{2}$/.test(dateInput.value) ? dateInput.value : today;

    if (isNewPin) {
      const newPin = {
        id: generateId(),
        name: nextName,
        lat: latlng.lat,
        lng: latlng.lng,
        date: nextDate,
        notes: notesInput.value.trim(),
        photos: photoData,
        photo: photoData.length ? photoData[0] : null,
      };

      pins.push(newPin);
      selectedSidebarPinId = newPin.id;
    } else {
      pin.name = nextName;
      pin.date = nextDate;
      pin.notes = notesInput.value.trim();
      pin.photos = photoData;
      pin.photo = photoData.length ? photoData[0] : null;
      selectedSidebarPinId = pin.id;
    }

    savePinsToStorage();
    closePinDetailModal();
    renderAllPins();
  });

  if (isNewPin) {
    deleteButton.style.display = "none";
  } else {
    deleteButton.addEventListener("click", () => {
      const confirmed = window.confirm("Delete this pin?");
      if (!confirmed) {
        return;
      }
      closePinDetailModal();
      removePin(pin.id);
    });
  }

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
