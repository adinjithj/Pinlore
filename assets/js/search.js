let searchDebounceTimer;
let searchSuggestions = [];
let searchResultMarker;

export function registerLocationSearch(map) {
  const locationSearchInput = document.getElementById("locationSearchInput");
  const locationSearchDropdown = document.getElementById("locationSearchDropdown");

  if (!locationSearchInput || !locationSearchDropdown) return;

  locationSearchInput.addEventListener("input", () => {
    const query = locationSearchInput.value.trim();
    if (!query) {
      clearSearchSuggestions(locationSearchDropdown);
      return;
    }
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(async () => {
      await fetchSearchSuggestions(query, locationSearchDropdown, map);
    }, 300);
  });

  locationSearchInput.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();

    if (searchSuggestions.length > 0) {
      selectSearchSuggestion(searchSuggestions[0], map, locationSearchDropdown);
      return;
    }

    const query = locationSearchInput.value.trim();
    if (!query) return;

    try {
      const fallbackResults = await fetchSearchResults(query, 1);
      if (fallbackResults.length) {
        selectSearchSuggestion(fallbackResults[0], map, locationSearchDropdown);
      } else {
        window.alert("No locations found.");
      }
    } catch (e) {
      console.warn("Search failed", e);
    }
  });

  locationSearchInput.addEventListener("blur", () => {
    setTimeout(() => clearSearchSuggestions(locationSearchDropdown), 120);
  });
}

async function fetchSearchSuggestions(query, dropdown, map) {
  try {
    const results = await fetchSearchResults(query, 20);
    const filteredResults = filterLocationResults(results);
    searchSuggestions = filteredResults.length ? filteredResults.slice(0, 5) : results.slice(0, 5);
    renderSearchSuggestions(searchSuggestions, dropdown, map);
  } catch (error) {
    console.warn("Location search failed.", error);
    renderSearchSuggestions([], dropdown, map);
  }
}

async function fetchSearchResults(query, limit) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Search failed");
  return await response.json();
}

function filterLocationResults(results) {
  const allowedTypes = new Set(["city", "town", "village", "state", "country"]);
  const excludedTypes = new Set(["house", "road", "building", "residential", "commercial"]);
  const excludedClasses = new Set(["amenity", "building", "highway", "shop", "tourism"]);

  return results.filter((result) => {
    const type = String(result.type || "").toLowerCase();
    const resultClass = String(result.class || "").toLowerCase();
    const addresstype = String(result.addresstype || "").toLowerCase();
    if (excludedTypes.has(type) || excludedClasses.has(resultClass)) return false;
    return allowedTypes.has(type) || allowedTypes.has(addresstype);
  });
}

function renderSearchSuggestions(results, dropdown, map) {
  dropdown.innerHTML = "";
  if (!results.length) {
    const emptyItem = document.createElement("div");
    emptyItem.className = "location-search-item is-empty";
    emptyItem.textContent = "No locations found";
    dropdown.appendChild(emptyItem);
    dropdown.hidden = false;
    return;
  }

  results.forEach((result) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "location-search-item";
    item.textContent = formatSuggestionLabel(result);
    item.addEventListener("mousedown", (e) => e.preventDefault());
    item.addEventListener("click", () => selectSearchSuggestion(result, map, dropdown));
    dropdown.appendChild(item);
  });
  dropdown.hidden = false;
}

function selectSearchSuggestion(result, map, dropdown) {
  const lat = Number(result.lat);
  const lon = Number(result.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

  map.setView([lat, lon], 12);
  showTemporarySearchMarker(lat, lon, result.display_name, map);
  document.getElementById("locationSearchInput").value = result.display_name;
  clearSearchSuggestions(dropdown);
}

function showTemporarySearchMarker(lat, lon, label, map) {
  if (searchResultMarker) map.removeLayer(searchResultMarker);
  searchResultMarker = L.marker([lat, lon]).addTo(map);
  if (label) searchResultMarker.bindPopup(label).openPopup();
  setTimeout(() => {
    if (searchResultMarker) {
      map.removeLayer(searchResultMarker);
      searchResultMarker = null;
    }
  }, 5000);
}

function clearSearchSuggestions(dropdown) {
  searchSuggestions = [];
  dropdown.innerHTML = "";
  dropdown.hidden = true;
}

function formatSuggestionLabel(result) {
  const address = result.address || {};
  const primaryName = result.name || address.city || address.town || address.village || "Unknown location";
  const secondaryName = address.country || address.state || "";
  return secondaryName && secondaryName !== primaryName ? `${primaryName}, ${secondaryName}` : primaryName;
}
