import { openPinDetailModal, closePinDetailModal } from "./modal.js";

export function renderMarkers(map, pins, markersMap, onEditPin, onSelectPin) {
  markersMap.forEach(m => map.removeLayer(m));
  markersMap.clear();

  pins.forEach(pin => {
    const marker = L.marker([pin.lat, pin.lng]).addTo(map);
    markersMap.set(pin.id, marker);
    
    marker.bindTooltip(pin.name, { direction: "top", opacity: 0.95, sticky: true });
    
    const popupContent = buildPinPopupContent(pin, onEditPin);
    marker.bindPopup(popupContent, { maxWidth: 280, className: "pin-popup-container" });

    marker.on("click", () => {
      onSelectPin(pin.id);
    });
  });
}

export function drawLifePath(map, pins, segments) {
  segments.forEach(s => map.removeLayer(s));
  segments.length = 0;

  const sorted = [...pins].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const points = sorted.map(p => [Number(p.lat), Number(p.lng)]).filter(pt => Number.isFinite(pt[0]));

  if (points.length < 2) return;

  const color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2a7fff";
  for (let i = 0; i < points.length - 1; i++) {
    const s = L.polyline([points[i], points[i+1]], {
      color, weight: 3, opacity: 0.72, smoothFactor: 1, lineCap: "round", lineJoin: "round"
    }).addTo(map);
    s.bringToBack();
    segments.push(s);
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
