# Pinlore Architecture

## System Overview
Pinlore is currently a frontend-only single-page web app:
- UI: Vanilla HTML/CSS/JavaScript
- Map engine: Leaflet.js
- Persistence: browser localStorage

Target architecture evolves to:
1. Frontend-only local mode (current)
2. Auth + cloud persistence backend
3. Scaled sync/search/reliability platform

## Client Architecture (Current)

### Core Modules
- Map module: map init, tile layers, marker rendering, life path rendering.
- Memory module: create/edit/delete memory modal and validation.
- Sidebar module: sorted memory list, active selection, search filtering.
- Search module: location autocomplete and map recenter behavior.
- Theme module: dark/light switch + tile layer switch.
- Storage module: load/save/migrate local memory payload.

### State Model
- `pins[]` as canonical client memory state.
- Derived UI state: filtered list, selected memory, replay state, search suggestions.
- Persisted state: memories + theme preference + schema version.

## Functional Behavior Requirements

### Pins
- Create exactly one pin per save action.
- Required fields: `id`, `name`, `lat`, `lng`, `date`.
- Persist across reload with deterministic rendering.

### Editing
- Marker click opens memory modal.
- Save applies atomic update.
- Delete requires confirmation and re-renders map/list/path.

### Photos
- Multiple photos per memory.
- Preview, remove, reorder support.
- Compression before storage to reduce local quota pressure.

### Search
- Debounced location suggestions.
- Select suggestion -> map fly and optional temporary marker.
- Graceful no-result and error handling.

### Timeline
- Date-based sorting (`newest` and `oldest` modes).
- Timeline interactions must sync with map and sidebar active state.

### Sidebar
- Search bar fixed.
- List independently scrollable.
- Sidebar click navigates map only.
- Marker click is primary modal entry point.

### Replay Mode
- Chronological playback.
- Play/pause/step/speed controls.
- Active memory highlighting across UI during playback.

### Authentication (Future)
- Email/OAuth sign-in.
- Session lifecycle with token refresh.
- Account deletion and data ownership controls.

### Sync (Future)
- Delta-based pull/push API.
- Conflict strategy: last-write-wins in v1.
- Offline queue with retry and reconciliation.

## Non-Functional Requirements

### Performance
- Interactive load target: `< 2.5s` on mid-range mobile.
- Smooth pan/zoom under normal memory volumes.
- Sidebar filtering under `100ms` for typical datasets.

### Responsiveness
- Usable from `320px` to desktop.
- No blocking overlap except intentional modal/panel states.

### Accessibility
- Keyboard navigation for controls and modal.
- Focus trap and visible focus states.
- Sufficient contrast and semantic labels.

### Privacy
- Private by default.
- Clear local-vs-cloud behavior.
- User-controlled export/delete mechanisms.

### Security
- Input validation/sanitization on all memory fields.
- Secure token handling in backend phase.
- API rate limiting and abuse protection.

## Data Model

### Current Client Memory Shape
```json
{
  "id": "uuid",
  "name": "string",
  "lat": 0,
  "lng": 0,
  "date": "YYYY-MM-DD",
  "notes": "string",
  "photos": ["base64-or-url"]
}
```

### Future Database Schema

#### users
- `id` (uuid, pk)
- `email` (unique)
- `password_hash` or `oauth_provider`
- `created_at`, `updated_at`

#### memories
- `id` (uuid, pk)
- `user_id` (fk -> users.id)
- `title` (required)
- `notes`
- `date` (required)
- `lat` (required)
- `lng` (required)
- `created_at`, `updated_at`
- `deleted_at` (soft delete)

#### memory_photos
- `id` (uuid, pk)
- `memory_id` (fk -> memories.id)
- `storage_url`
- `thumbnail_url`
- `sort_order`
- `created_at`

#### tags
- `id` (uuid, pk)
- `user_id` (fk -> users.id)
- `name`

#### memory_tags
- `memory_id` (fk -> memories.id)
- `tag_id` (fk -> tags.id)

#### sync_events (optional)
- `id` (uuid, pk)
- `user_id`
- `entity_type`
- `entity_id`
- `event_type`
- `payload_json`
- `created_at`

## API Contract (Future REST)

### Auth
- `POST /v1/auth/signup`
- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `POST /v1/auth/refresh`
- `POST /v1/auth/forgot-password`

### Memories
- `GET /v1/memories`
- `POST /v1/memories`
- `GET /v1/memories/:id`
- `PATCH /v1/memories/:id`
- `DELETE /v1/memories/:id`

### Photos
- `POST /v1/memories/:id/photos`
- `DELETE /v1/memories/:id/photos/:photoId`
- `PATCH /v1/memories/:id/photos/reorder`

### Tags
- `GET /v1/tags`
- `POST /v1/tags`
- `PATCH /v1/tags/:id`
- `DELETE /v1/tags/:id`

### Sync
- `GET /v1/sync?cursor=...`
- `POST /v1/sync/push`

## Key Technical Risks
- localStorage quota and payload corruption with photo-heavy usage.
- Performance drop with high pin density and path rendering.
- Data migration debt if schema versioning is postponed.
- Sync conflicts becoming expensive if ignored until late.
