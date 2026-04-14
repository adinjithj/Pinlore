# Pinlore (Phase 1)

Memory Map is a simple personal memory atlas where users can click the map, name a location, and save it as a pin.

## Features Included

- Full-screen Leaflet map using OpenStreetMap tiles
- Default map center at Madhya Pradesh, India (`23.4733, 77.9470`) with zoom `7`
- Optional live-location centering if the browser permission is granted
- Click-to-create pin flow with a "Name this memory" popup form
- Marker hover labels showing the memory name
- Pin persistence with `localStorage`
- Dark/light theme toggle with persistent theme preference

## Tech Stack

- Vanilla HTML, CSS, JavaScript
- Leaflet.js via CDN
- Browser `localStorage` (no backend)

## Project Files

```text
memory-map/
├── index.html
├── style.css
├── app.js
└── README.md
```

## Pin Data Model

Pins are stored in `localStorage` as:

```json
{
  "id": "unique-id",
  "name": "Memory Name",
  "lat": 23.47,
  "lng": 77.94,
  "notes": "",
  "photo": null
}
```

## Run Locally

1. Open `index.html` directly in your browser, or
2. Serve the folder with any static server and visit it in the browser.

## Notes

- This is Phase 1 only.
- Notes/photo editing per pin is intentionally not implemented yet (Phase 2).
