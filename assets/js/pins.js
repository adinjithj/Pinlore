import { openPinDetailModal, closePinDetailModal } from "./modal.js";

export function pinSVG(accent, centerFill = "white", glowBlur = 2) {
  const clr = accent.replace("#", "%23");
  const fill = centerFill.replace("#", "%23");
  const blur = glowBlur > 2 ? 3 : 2;
  const alpha = glowBlur > 2 ? 0.5 : 0.3;
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 52'%3E%3Cdefs%3E%3Cfilter id='g'%3E%3CfeGaussianBlur in='SourceAlpha' stdDeviation='${blur}'/%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M20 2C10 2 2 10 2 20c0 13 18 30 18 30s18-17 18-30C38 10 30 2 20 2z' fill='${clr}' opacity='${alpha}' filter='url(%23g)'/%3E%3Cpath d='M20 2C10 2 2 10 2 20c0 13 18 30 18 30s18-17 18-30C38 10 30 2 20 2z' fill='${clr}'/%3E%3Ccircle cx='20' cy='18' r='5' fill='${fill}'/%3E%3C/svg%3E`;
}

export function pinSVGWithPhoto(accent, photoUrl) {
  const clr = accent.replace("#", "%23");
  const photoEncoded = photoUrl.replace(/'/g, "%27");
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 52' width='40' height='52'%3E%3Cdefs%3E%3CclipPath id='pc'%3E%3Ccircle cx='20' cy='18' r='5'/%3E%3C/clipPath%3E%3Cfilter id='g'%3E%3CfeGaussianBlur stdDeviation='1.5' result='b'/%3E%3CfeMerge%3E%3CfeMergeNode in='b'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/defs%3E%3Cpath d='M20 0C9 0 0 9 0 20c0 14 20 32 20 32s20-18 20-32C40 9 31 0 20 0z' fill='${clr}' filter='url(%23g)'/%3E%3Cimage x='15' y='13' width='10' height='10' clip-path='url(%23pc)' href='${photoEncoded}'/%3E%3C/svg%3E`;
}

function selectedPinSVG(accent) {
  const clr = accent.replace("#", "%23");
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 56'%3E%3Ccircle cx='22' cy='20' r='18' fill='none' stroke='${clr}' stroke-width='2' opacity='0.4'%3E%3Canimate attributeName='r' from='16' to='22' dur='1.5s' repeatCount='indefinite'/%3E%3Canimate attributeName='opacity' values='0.5;0;0.5' dur='1.5s' repeatCount='indefinite'/%3E%3C/circle%3E%3Cpath d='M22 4C12 4 4 12 4 22c0 13 18 30 18 30s18-17 18-30C40 12 32 4 22 4z' fill='${clr}'/%3E%3Ccircle cx='22' cy='20' r='6' fill='white'/%3E%3C/svg%3E`;
}

const lightTheme = { accent: "#2a7fff", darkAccent: "#4b9dff" };
const darkTheme = { accent: "#4b9dff", darkAccent: "#67aeff" };

export function getCurrentAccent() {
  const theme = document.documentElement.getAttribute("data-theme");
  if (theme === "dark") return darkTheme.accent;
  if (theme === "light") return lightTheme.accent;
  return lightTheme.accent;
}

function createCustomIcon(hover = false) {
  const accent = getCurrentAccent();
  return L.icon({
    iconUrl: hover ? pinSVG(accent, "white", 3) : pinSVG(accent),
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -52],
    tooltipAnchor: [20, -44],
  });
}

function createSelectedIcon() {
  return L.icon({
    iconUrl: selectedPinSVG(getCurrentAccent()),
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
      if (!isSelected) marker.setIcon(createCustomIcon(true));
    });
    marker.on("mouseout", () => {
      if (!isSelected) marker.setIcon(createCustomIcon(false));
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

  if (isDark) {
    // Stronger glow for dark mode
    segments.push(L.polyline(points, { ...common, weight: 12, opacity: 0.15 }).addTo(map).bringToBack());
    segments.push(L.polyline(points, { ...common, weight: 7, opacity: 0.25 }).addTo(map).bringToBack());
    segments.push(L.polyline(points, { 
      ...common, weight: 3, opacity: 0.95, className: "life-path-line", dashOffset: "0" 
    }).addTo(map).bringToBack());
  } else {
    segments.push(L.polyline(points, { ...common, weight: 10, opacity: 0.08 }).addTo(map).bringToBack());
    segments.push(L.polyline(points, { ...common, weight: 5, opacity: 0.18 }).addTo(map).bringToBack());
    segments.push(L.polyline(points, { 
      ...common, weight: 2.5, opacity: 0.85, className: "life-path-line", dashOffset: "0" 
    }).addTo(map).bringToBack());
  }
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
