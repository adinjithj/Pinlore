export function openPinDetailModal(pins, onSave, onDelete, pinId, latlng = null) {
  const today = new Date().toISOString().slice(0, 10);
  const pin = pinId ? pins.find((p) => p.id === pinId) : null;
  const isNewPin = !pin;

  if (isNewPin && !latlng) return;
  closePinDetailModal();

  const initialPhotos = normalizePinPhotos(pin || {});
  let photoData = [...initialPhotos];

  const modal = document.createElement("div");
  modal.id = "pinDetailModal";
  modal.className = "pin-detail-modal-root";
  modal.innerHTML = `
    <div id="pinDetailBackdrop" class="pin-detail-backdrop">
      <div id="pinDetailCard" class="pin-detail-card">
        <input id="pinDetailName" class="pin-detail-title-input" type="text" maxlength="80" placeholder="Memory title" />
        <input id="pinDetailDate" class="pin-detail-date-input" type="date" />
        <textarea id="pinDetailNotes" class="pin-detail-notes-input" rows="7" placeholder="Write your memory..."></textarea>
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

  const nameInput = document.getElementById("pinDetailName");
  const dateInput = document.getElementById("pinDetailDate");
  const notesInput = document.getElementById("pinDetailNotes");
  const photoInput = document.getElementById("pinDetailPhotos");
  const photoGrid = document.getElementById("pinDetailPhotoGrid");

  nameInput.value = pin ? pin.name || "" : "";
  dateInput.value = pin ? pin.date || today : today;
  notesInput.value = pin ? pin.notes || "" : "";
  renderPinDetailPhotoGrid(photoData, photoGrid);

  photoInput.addEventListener("change", async () => {
    const files = Array.from(photoInput.files || []);
    if (!files.length) return;
    try {
      const base64Images = await Promise.all(files.map(fileToBase64));
      photoData = [...photoData, ...base64Images];
      renderPinDetailPhotoGrid(photoData, photoGrid);
      photoInput.value = "";
    } catch (e) { console.warn("Image read failed", e); }
  });

  document.getElementById("pinDetailSave").addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) return nameInput.focus();
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateInput.value) ? dateInput.value : today;
    
    onSave({
      id: isNewPin ? generateId() : pin.id,
      name,
      date,
      notes: notesInput.value.trim(),
      photos: photoData,
      photo: photoData[0] || null,
      lat: isNewPin ? latlng.lat : pin.lat,
      lng: isNewPin ? latlng.lng : pin.lng
    });
    closePinDetailModal();
  });

  const deleteBtn = document.getElementById("pinDetailDelete");
  if (isNewPin) deleteBtn.style.display = "none";
  else deleteBtn.addEventListener("click", () => {
    if (window.confirm("Delete this pin?")) {
      onDelete(pin.id);
      closePinDetailModal();
    }
  });

  document.getElementById("pinDetailBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "pinDetailBackdrop") closePinDetailModal();
  });

  nameInput.focus();
}

export function closePinDetailModal() {
  const m = document.getElementById("pinDetailModal");
  if (m) m.remove();
}

function normalizePinPhotos(pin) {
  if (Array.isArray(pin.photos)) return pin.photos.filter(p => typeof p === "string" && p);
  if (typeof pin.photo === "string" && pin.photo) return [pin.photo];
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
  photos.forEach((p) => {
    const img = document.createElement("img");
    img.className = "pin-detail-photo-thumb";
    img.src = p;
    container.appendChild(img);
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

function generateId() {
  return window.crypto?.randomUUID?.() || `pin-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
