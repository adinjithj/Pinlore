# Pinlore PRD

## 1. Product Vision
Pinlore becomes the default personal memory atlas: a private, map-first timeline where people can reliably capture, revisit, and understand their life story through place, time, and context.  
Long term, Pinlore should feel like "Google Photos + personal journaling + life replay," but owned by the user, not optimized for social vanity.

## 2. Problem Statement
People remember life by place and moment, but their memories are fragmented across camera rolls, notes apps, and social feeds.  
Current tools fail on three fronts:
- No single timeline tied to geography.
- No lightweight way to capture context at the moment (why this place mattered).
- No coherent replay of personal journeys over months/years.

Result: high emotional-value memories are effectively lost in noisy storage.

## 3. Target Users
- Primary: reflective individuals (18-40) who already capture photos/notes but want deeper memory organization.
- Secondary: frequent travelers, students living away from home, couples documenting shared journeys.
- Tertiary: creators who want a private "life log" source for storytelling.

## 4. Core User Stories
- As a user, I want to drop a memory pin quickly so that I can capture moments with minimal friction.
- As a user, I want to add date, notes, and photos so that each memory has meaning beyond location.
- As a user, I want to browse memories in a sidebar and timeline so that I can navigate my past efficiently.
- As a user, I want to search places and jump there instantly so that memory creation is fast.
- As a user, I want life-path lines across pins so that I can see how my life moved over time.
- As a user, I want replay mode so that I can relive journeys chronologically.
- As a user, I want my data synced securely across devices so that Pinlore is dependable long term.
- As a user, I want privacy controls so that deeply personal memories stay under my control.

## 5. MVP Scope
Must-have only:
- Create/edit/delete memory pins on map.
- Memory metadata: title, date, notes, photos.
- Sidebar list with search/filter and map navigation.
- Location search with suggestions.
- Light/dark themes.
- Date-based life-path rendering.
- Local persistence and stable reload behavior.
- Responsive layout for mobile + desktop.

Explicitly out of MVP:
- Multi-user sharing.
- Social feed/comments/likes.
- AI-generated memory writing.
- Complex analytics dashboards.

## 6. Current Completed Features
- Fullscreen interactive Leaflet map.
- Click map to create memory pin.
- Detail modal with title, date, notes, photos.
- Dark/light mode.
- Location search with suggestions.
- Memories sidebar overlay + search.
- Pin connections via life-path lines.

## 7. Next Priority Features
P0 (must ship next):
- Data integrity pass: enforce required fields, valid dates, and migration safety for old localStorage shapes.
- Replay mode v1: play memories chronologically with map fly-to + highlighted active memory.
- Better photo management: remove/reorder thumbnails, image size limits, compression, error states.
- Robust responsive behavior: no map/sidebar overlap on all breakpoints.
- Empty/error/loading states for every user flow.

P1 (important, post-P0):
- Timeline view (horizontal or vertical) synced with map.
- Export/import (JSON) for backup and portability.
- Memory tags and filters (trip, people, mood, etc.).
- Map clustering for dense pin regions.
- Basic onboarding and first-run hints.

P2 (later):
- Auth (email/OAuth).
- Cloud sync + conflict resolution.
- Cross-device offline queue and merge.
- Shared albums/journeys.
- AI-assisted memory summarization/search.

## 8. UX Principles
- Capture-first: fastest path from "I remember this" to saved memory.
- Calm and reflective: product should feel intimate, not noisy.
- Spatial truth: map interactions must be predictable and accurate.
- One action, one outcome: no hidden side effects or duplicate saves.
- Progressive depth: quick save first, rich editing when needed.
- Mobile dignity: no "desktop-only" assumptions in primary workflows.

## 9. Functional Requirements
Pins:
- User can create a pin from map interaction in one flow.
- Exactly one pin is created per save action.
- Pin requires stable unique ID and valid lat/lng.
- Pins persist across sessions.

Editing:
- Marker click opens edit modal for that pin.
- Edit supports update and delete with confirmation.
- Save writes atomically (either all fields update or none).

Photos:
- Accept multiple images per memory.
- Store compressed versions for performance.
- Show previews, remove single photo, preserve order.
- Guardrails for max count and max file size.

Search:
- Location search supports debounced suggestions.
- Suggestion selection centers map and optionally previews marker.
- Failures/non-results show clear non-blocking feedback.

Timeline:
- Timeline sorts by date (newest/oldest toggles).
- Clicking timeline item navigates map and focuses memory.
- Timeline and sidebar stay state-synced.

Sidebar:
- Search input fixed at top.
- Memory list scrolls independently.
- Click navigates map; modal opens from marker interaction only.
- Active memory item remains visually highlighted.

Replay mode:
- Play/pause chronological memory journey.
- Configurable speed and step controls.
- Map fly-to each memory with active state in sidebar/timeline.
- Stop replay restores manual control instantly.

Authentication (future):
- User sign-up/sign-in/sign-out.
- Session management and token refresh.
- Password reset and account deletion.

Sync (future):
- Cloud save/retrieve by authenticated user.
- Delta sync for changed memories.
- Conflict policy for concurrent edits (last-write-wins v1, upgrade later).
- Offline-first queue with retry.

## 10. Non Functional Requirements
Performance:
- Initial interactive load target: <2.5s on mid-range mobile.
- Map pan/zoom remains smooth at 60fps target for normal memory counts.
- Sidebar search response <100ms for typical datasets.

Responsiveness:
- Fully usable from 320px to large desktop.
- No overlap that blocks core map actions unless intentionally opened.

Accessibility:
- Keyboard-navigable controls and modal trapping.
- Minimum contrast compliance for text and controls.
- Meaningful labels for interactive elements.

Privacy:
- Private-by-default data model.
- Clear local-vs-cloud behavior messaging.
- Explicit user control for export/delete.

Security:
- Input validation/sanitization across all memory fields.
- Secure auth/token storage strategy in backend phase.
- Rate limiting and abuse protection for API endpoints.

## 11. Suggested Tech Roadmap
Phase 1 (current, frontend-only):
- Harden current vanilla + Leaflet app.
- Finalize reliable local model and UX polish.
- Add replay mode and data migration/versioning.

Phase 2 (backend introduction):
- Introduce auth + cloud persistence.
- Add REST API and storage service for photos.
- Implement sync, backup, and account lifecycle.

Phase 3 (scale):
- Improve indexing/search performance.
- Add analytics and reliability monitoring.
- Prepare multi-platform clients and collaboration features.

## 12. Database Schema
Users
- id (uuid, pk)
- email (unique)
- password_hash / oauth_provider
- created_at, updated_at

Memories
- id (uuid, pk)
- user_id (fk users.id)
- title (text, required)
- notes (text)
- date (date, required)
- lat (decimal, required)
- lng (decimal, required)
- created_at, updated_at
- deleted_at (nullable, soft delete)

MemoryPhotos
- id (uuid, pk)
- memory_id (fk memories.id)
- storage_url
- thumbnail_url
- sort_order (int)
- created_at

Tags
- id (uuid, pk)
- user_id (fk users.id)
- name (text)

MemoryTags
- memory_id (fk memories.id)
- tag_id (fk tags.id)

SyncEvents (optional, for robust sync)
- id (uuid, pk)
- user_id
- entity_type
- entity_id
- event_type
- payload_json
- created_at

## 13. API Endpoints
Auth:
- POST /v1/auth/signup
- POST /v1/auth/login
- POST /v1/auth/logout
- POST /v1/auth/refresh
- POST /v1/auth/forgot-password

Memories:
- GET /v1/memories
- POST /v1/memories
- GET /v1/memories/:id
- PATCH /v1/memories/:id
- DELETE /v1/memories/:id

Photos:
- POST /v1/memories/:id/photos
- DELETE /v1/memories/:id/photos/:photoId
- PATCH /v1/memories/:id/photos/reorder

Tags:
- GET /v1/tags
- POST /v1/tags
- PATCH /v1/tags/:id
- DELETE /v1/tags/:id

Sync:
- GET /v1/sync?cursor=...
- POST /v1/sync/push

## 14. Success Metrics
Activation:
- % users who create first memory within first session.
- Time-to-first-memory.

Retention:
- D1 / D7 / D30 return rates.
- % users with at least 5 memories after 7 days.

Engagement:
- Memories created per active user per week.
- Replay mode usage rate.
- Sidebar/timeline interaction rate.

## 15. Risks
Product risks:
- Niche behavior: memory journaling may have lower natural frequency than expected.
- Emotional utility may be high but habit formation may be weak.
- Overbuilding advanced features before validating repeat usage.

Technical risks:
- localStorage limits and corruption for photo-heavy usage.
- Performance degradation with large pin/photo sets.
- Complex sync conflict handling once multi-device editing starts.
- Migration debt if data model is not versioned early.

## 16. 30/60/90 Day Solo Founder Execution Plan
0-30 days:
- Stabilize core create/edit/delete/search flows.
- Add replay mode v1 and data migrations.
- Instrument basic analytics events.
- Ship polished responsive behavior and accessibility pass.

31-60 days:
- Introduce backend skeleton (auth, memories CRUD, photo upload).
- Build local-to-cloud sync for single device account.
- Add import/export and backup story.

61-90 days:
- Harden sync and error recovery.
- Improve performance for large datasets.
- Run user interviews/usability tests and trim low-value features.
- Prepare public beta with clear onboarding and privacy messaging.

## 17. Immediate Build Queue
1. Add schema versioning + migration utility for local data.
2. Implement replay mode v1 (play/pause/step/speed).
3. Add photo compression + max-size enforcement on upload.
4. Add remove/reorder photos in modal.
5. Build robust empty/error/loading UI states across app.
6. Improve mobile sidebar behavior and transition reliability.
7. Add keyboard + accessibility improvements (focus states, modal trap).
8. Implement timeline panel synced with map and sidebar.
9. Add export/import JSON backup flow.
10. Add analytics hooks for activation/retention/engagement events.
