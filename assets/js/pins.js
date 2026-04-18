import { openPinDetailModal, closePinDetailModal } from "./modal.js";

function pinSVG(accent, centerFill = "white", glowBlur = 2) {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 52' width='40' height='52'%3E%3Cdefs%3E%3Cfilter id='g' x='-50%25' y='-50%25' width='200%25' height='200%25'%3E%3CfeGaussianBlur stdDeviation='${glowBlur}' result='b'/%3E%3CfeMerge%3E%3CfeMergeNode in='b'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/defs%3E%3Cpath d='M20 0C9 0 0 9 0 20c0 14 20 32 20 32s20-18 20-32C40 9 31 0 20 0z' fill='${accent}' filter='url(%23g)'/%3E%3Ccircle cx='20' cy='18' r='6' fill='${centerFill}' fill-opacity='0.95'/%3E%3C/svg%3E`;
}

function selectedPinSVG(accent, centerFill) {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 56' width='44' height='56'%3E%3Cdefs%3E%3Cfilter id='g' x='-50%25' y='-50%25' width='200%25' height='200%25'%3E%3CfeGaussianBlur stdDeviation='4' result='b'/%3E%3CfeMerge%3E%3CfeMergeNode in='b'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/defs%3E%3Ccircle cx='22' cy='20' r='18' fill='none' stroke='${accent}' stroke-width='2' opacity='0.4'%3E%3Canimate attributeName='r' from='16' to='22' dur='1s' repeatCount='indefinite'/%3E%3Canimate attributeName='opacity' from='0.5' to='0' dur='1s' repeatCount='indefinite'/%3E%3C/circle%3E%3Cpath d='M22 2C10 2 2 10 2 22c0 14 20 32 20 32s20-18 20-32C42 10 34 2 22 2z' fill='${accent}' filter='url(%23g)'/%3E%3Ccircle cx='22' cy='20' r='7' fill='${centerFill}' fill-opacity='0.95'/%3E%3C/svg%3E`;
}

const lightTheme = { accent: "#2a7fff", darkAccent: "#4b9dff" };
const darkTheme = { accent: "#4b9dff", darkAccent: "#67aeff" };

function getCurrentAccent() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  return isDark ? darkTheme.accent : lightTheme.accent;
}

function createCustomIcon(svgData = null, hover = false) {
  const accent = getCurrentAccent();
  const data = svgData || (hover ? pinSVG(accent, "white", 3) : pinSVG(accent));
  return L.icon({
    iconUrl: data,
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -52],
    tooltipAnchor: [20, -44],
  });
}

function createSelectedIcon() {
  const accent = getCurrentAccent();
  return L.icon({
    iconUrl: selectedPinSVG(accent, "white"),
    iconSize: [44, 56],
    iconAnchor: [22, 56],
    popupAnchor: [0, -56],
    tooltipAnchor: [22, -48],
  });
}

export function renderMarkers(map, pins, markersMap, onEditPin, onSelectPin, selectedIdForHover = null) {
  markersMap.forEach(m => map.removeLayer(m));
  markersMap.clear();

  const normalIcon = createCustomIcon();

  pins.forEach(pin => {
    const marker = L.marker([pin.lat, pin.lng], { icon: normalIcon }).addTo(map);
    markersMap.set(pin.id, marker);
    
    marker.bindTooltip(pin.name, { direction: "top", opacity: 0.95, sticky: true });
    
    const popupContent = buildPinPopupContent(pin, onEditPin);
    marker.bindPopup(popupContent, { maxWidth: 280, className: "pin-popup-container" });

    marker.on("click", () => {
      onSelectPin(pin.id);
    });

    const isSelected = selectedIdForHover && pin.id === selectedIdForHover;
    marker.on("mouseover", () => {
      if (!isSelected) marker.setIcon(createCustomIcon(null, true));
    });
    marker.on("mouseout", () => {
      if (!isSelected) marker.setIcon(createCustomIcon());
    });
  });
}

export function setMarkerSelected(marker, selected) {
  if (!marker) return;
  marker.setIcon(selected ? createSelectedIcon() : createCustomIcon());
}

export function drawLifePath(map, pins, segments) {
  segments.forEach(s => map.removeLayer(s));
  segments.length = 0;

  const sorted = [...pins].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const points = sorted.map(p => {
    const lat = Number(p.lat);
    const lng = Number(p.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return null;
    return [lat, lng];
  }).filter(pt => pt !== null);

  if (points.length < 2) return;

  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const color = isDark ? "#4b9dff" : "#2a7fff";
  const common = { color, smoothFactor: 2, lineCap: "round", lineJoin: "round", interactive: false, dashArray: "8, 12" };

  segments.push(L.polyline(points, { ...common, weight: 10, opacity: 0.08 }).addTo(map).bringToBack());
  segments.push(L.polyline(points, { ...common, weight: 5, opacity: 0.18 }).addTo(map).bringToBack());
  segments.push(L.polyline(points, { 
    ...common, weight: 2.5, opacity: 0.85, className: "life-path-line", dashOffset: "0" 
  }).addTo(map).bringToBack());
}

export function renderSidebar(pins, selectedId, query, onSelect) {
  const list = document.getElementById("memorySidebarList");
  if (!list) return;
  list.innerHTML = "";

  const filtered = pins
    .filter(p => !query || (p.name + p.notes).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "memory-sidebar-empty";
    empty.textContent = "No memories found.";
    list.appendChild(empty);
    return;
  }

  filtered.forEach(pin => {
    const item = document.createElement("button");
    item.className = `memory-sidebar-item ${pin.id === selectedId ? "active" : ""}`;
    item.innerHTML = `<div class="memory-sidebar-item-title">${pin.name || "Untitled"}</div>
                      <div class="memory-sidebar-item-date">${pin.date || "No date"}</div>`;
    item.addEventListener("click", () => onSelect(pin));
    list.appendChild(item);
  });
}

function buildPinPopupContent(pin, onEdit) {
  const container = document.createElement("div");
  container.className = "pin-popup";

  if (pin.photos?.length || pin.photo) {
    const img = document.createElement("img");
    img.className = "pin-popup-thumbnail";
    img.src = pin.photos?.[0] || pin.photo;
    container.appendChild(img);
  }

  const title = document.createElement("div");
  title.className = "pin-popup-title";
  title.textContent = pin.name || "Untitled memory";
  container.appendChild(title);

  if (pin.date) {
    const date = document.createElement("div");
    date.className = "pin-popup-date";
    date.textContent = pin.date;
    container.appendChild(date);
  }

  if (pin.notes) {
    const notes = document.createElement("div");
    notes.className = "pin-popup-notes";
    notes.textContent = pin.notes;
    container.appendChild(notes);
  }

  const editBtn = document.createElement("button");
  editBtn.className = "pin-popup-edit-btn";
  editBtn.textContent = "Edit";
  editBtn.onclick = (e) => {
    e.stopPropagation();
    onEdit(pin.id);
  };
  container.appendChild(editBtn);

  return container;
}
