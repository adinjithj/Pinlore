# Pinlore Tasks

## Execution Rules
- Optimize for leverage: ship features that improve retention, not vanity polish.
- Keep scope tight: avoid social/collaboration until single-user repeat usage is proven.
- Every task must end with a user-visible outcome and a verification step.

## Current Sprint (P0)

### 1) Data Integrity + Migration
- Add schema versioning for local storage payload.
- Create migration pipeline for older pin shapes.
- Enforce required memory fields on save: `id`, `name`, `lat`, `lng`, `date`.
- Verify no existing user data is dropped on upgrade.

Done when:
- App boots successfully with old and new local data.
- Invalid memory data is rejected with safe fallback.

### 2) Replay Mode v1
- Add play/pause controls for chronological journey playback.
- Implement speed options and step forward/back.
- Fly map to each memory in sequence.
- Highlight active memory in sidebar while replay runs.

Done when:
- Replay runs end-to-end without freezing map interactions.
- Stopping replay returns full manual control immediately.

### 3) Photo Management Hardening
- Add per-image size limit and total photo count cap.
- Compress images client-side before storage.
- Support remove photo from existing memory.
- Support reorder photos and persist order.

Done when:
- Large images do not break local storage behavior.
- Photo order survives reload.

### 4) Responsive Reliability Pass
- Eliminate map/sidebar overlap bugs at common breakpoints.
- Ensure sidebar open/close behavior is deterministic on mobile.
- Ensure map is fully interactive after panel close.

Done when:
- Manual test pass at `320/375/768/1024/1440` widths.

### 5) State UX Coverage
- Add explicit empty states (no memories, no search matches).
- Add non-blocking error states (search failure, image failure).
- Add loading indicators for expensive async actions.

Done when:
- No silent failure path remains in primary flows.

## Next Backlog (P1)
- Timeline panel synced with map + sidebar.
- JSON export/import for backup and portability.
- Memory tags + filter chips.
- Marker clustering for dense areas.
- First-run onboarding hints.

## Later Backlog (P2)
- Authentication (email/OAuth).
- Cloud sync with conflict handling.
- Multi-device offline queue + retry.
- Shared albums/journeys.
- AI-assisted summarization and semantic search.

## Top 10 Immediate Build Queue
1. Add local schema versioning and migration utility.
2. Implement replay mode v1 (play/pause/step/speed).
3. Add photo compression + max-size enforcement.
4. Add remove/reorder photos in memory modal.
5. Add complete empty/error/loading UI states.
6. Finish mobile sidebar transition and interaction hardening.
7. Add keyboard accessibility and modal focus trapping.
8. Build timeline view synced with map/sidebar.
9. Add JSON export/import backup flow.
10. Add analytics events for activation/retention/engagement.

## Verification Checklist
- Create/edit/delete memory works with date, notes, and photos.
- Search suggestions and map navigation work under network failure.
- Replay mode orders by date and does not duplicate active states.
- Sidebar list remains scrollable with large datasets.
- Data survives reload and migration path is stable.
