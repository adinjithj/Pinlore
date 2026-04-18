# Graph Report - .  (2026-04-18)

## Corpus Check
- 7 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 73 nodes · 97 edges · 12 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `app.js` - 33 edges
2. `search.js` - 9 edges
3. `main.js` - 8 edges
4. `modal.js` - 6 edges
5. `renderAllPins()` - 5 edges
6. `fetchSearchSuggestions()` - 4 edges
7. `openPinDetailModal()` - 4 edges
8. `init()` - 4 edges
9. `renderAll()` - 4 edges
10. `openPinDetailModal()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.17
Nodes (1): app.js

### Community 1 - "Community 1"
Cohesion: 0.31
Nodes (8): search.js, clearSearchSuggestions(), fetchSearchResults(), fetchSearchSuggestions(), filterLocationResults(), renderSearchSuggestions(), selectSearchSuggestion(), showTemporarySearchMarker()

### Community 2 - "Community 2"
Cohesion: 0.36
Nodes (7): main.js, attemptLiveLocationCentering(), init(), initializeSidebarToggle(), onDeletePin(), onSavePin(), renderAll()

### Community 3 - "Community 3"
Cohesion: 0.43
Nodes (5): modal.js, closePinDetailModal(), normalizePinPhotos(), openPinDetailModal(), renderPinDetailPhotoGrid()

### Community 4 - "Community 4"
Cohesion: 0.33
Nodes (6): buildPinPopupContent(), closePinDetailModal(), normalizePinPhotos(), openPinDetailModal(), renderPin(), renderPinDetailPhotoGrid()

### Community 5 - "Community 5"
Cohesion: 0.33
Nodes (6): drawLifePath(), removePin(), renderAllPins(), renderMemorySidebar(), renderStoredPins(), savePinsToStorage()

### Community 6 - "Community 6"
Cohesion: 0.4
Nodes (1): pins.js

### Community 7 - "Community 7"
Cohesion: 0.4
Nodes (1): storage.js

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (4): fetchSearchResults(), fetchSearchSuggestions(), filterLocationResults(), renderSearchSuggestions()

### Community 9 - "Community 9"
Cohesion: 0.67
Nodes (3): applyTheme(), initializeTheme(), toggleTheme()

### Community 10 - "Community 10"
Cohesion: 0.67
Nodes (3): clearSearchSuggestions(), selectSearchSuggestion(), showTemporarySearchMarker()

### Community 11 - "Community 11"
Cohesion: 1
Nodes (3): theme.js, applyTheme(), initializeTheme()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `app.js` connect `Community 0` to `Community 9`, `Community 5`, `Community 8`, `Community 10`, `Community 4`?**
  _High betweenness centrality (0.197) - this node is a cross-community bridge._