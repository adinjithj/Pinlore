import { loadPins, savePins } from "./storage.js";
import { initializeTheme } from "./theme.js";
import { registerLocationSearch } from "./search.js";
import { openPinDetailModal } from "./modal.js";
import { renderMarkers, drawLifePath, renderSidebar } from "./pins.js";

const DEFAULT_CENTER = [23.4733, 77.9470];
const DEFAULT_ZOOM = 7;

let map;
let lightLayer;
let darkLayer;
let pins = loadPins();
const markersMap = new Map();
const lifePathSegments = [];
let selectedPinId = null;
let searchQuery = "";

function init() {
  map = L.map("map").setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  lightLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: "&copy; OpenStreetMap"
  });
  darkLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19, attribution: "&copy; OpenStreetMap &copy; CARTO"
  });

  initializeTheme(map, lightLayer, darkLayer);
  registerLocationSearch(map);
  
  map.on("click", (e) => openPinDetailModal(pins, onSavePin, onDeletePin, null, e.latlng));
  
  const sidebarSearch = document.getElementById("memorySidebarSearch");
  if (sidebarSearch) {
    sidebarSearch.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      renderSidebar(pins, selectedPinId, searchQuery, onSelectSidebarPin);
    });
  }

  initializeSidebarToggle();
  renderAll();
  attemptLiveLocationCentering();
}

function renderAll() {
  renderMarkers(map, pins, markersMap, onEditPin, (id) => {
    selectedPinId = id;
    renderSidebar(pins, selectedPinId, searchQuery, onSelectSidebarPin);
  });
  drawLifePath(map, pins, lifePathSegments);
  renderSidebar(pins, selectedPinId, searchQuery, onSelectSidebarPin);
}

function onSavePin(newPin) {
  const index = pins.findIndex(p => p.id === newPin.id);
  if (index > -1) pins[index] = newPin;
  else pins.push(newPin);
  
  selectedPinId = newPin.id;
  savePins(pins);
  renderAll();
}

function onDeletePin(id) {
  pins = pins.filter(p => p.id !== id);
  if (selectedPinId === id) selectedPinId = null;
  savePins(pins);
  renderAll();
}

function onEditPin(id) {
  map.closePopup();
  openPinDetailModal(pins, onSavePin, onDeletePin, id);
}

function onSelectSidebarPin(pin) {
  selectedPinId = pin.id;
  map.flyTo([pin.lat, pin.lng], 13, { duration: 1.2 });
  document.body.classList.remove("sidebar-open");
  renderSidebar(pins, selectedPinId, searchQuery, onSelectSidebarPin);
  setTimeout(() => {
    const m = markersMap.get(pin.id);
    if (m) m.openPopup();
  }, 1300);
}

function initializeSidebarToggle() {
  const sidebar = document.querySelector(".memory-sidebar");
  const backdrop = document.querySelector(".sidebar-backdrop");
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "sidebar-toggle-btn";
  toggleBtn.textContent = "☰";
  document.body.appendChild(toggleBtn);

  toggleBtn.onclick = () => document.body.classList.toggle("sidebar-open");
  backdrop.onclick = () => document.body.classList.remove("sidebar-open");
}

function attemptLiveLocationCentering() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(p => {
      map.setView([p.coords.latitude, p.coords.longitude], 12);
    }, () => {}, { enableHighAccuracy: true, timeout: 10000 });
  }
}

init();
