# Pinlore Roadmap

## Product Vision
Build the most useful personal memory atlas: map-first, private-by-default, and emotionally meaningful.  
Pinlore should help users remember not just what happened, but where and when it mattered.

## Problem Statement
Memories are fragmented across photos, notes, and social apps.  
Users need one coherent place to capture and revisit life by location and time.

## Target Users
- Reflective users who already capture moments but lose context.
- Travelers/students/couples with strong place-based memories.
- Creators who want structured personal memory archives.

## Core User Outcomes
- Fast capture from map interaction.
- Rich context per memory (date, notes, photos).
- Easy revisit via sidebar, timeline, and replay.
- Confidence that memories are private and durable.

## MVP Scope
Must-have:
- Create/edit/delete memory pins.
- Title/date/notes/photos support.
- Sidebar browse + search.
- Location autocomplete search.
- Dark/light theme.
- Date-based life path.
- Reliable local persistence.
- Responsive desktop/mobile UX.

Not in MVP:
- Collaboration/social.
- AI memory writing.
- Advanced analytics dashboards.

## Current State (Built)
- Interactive fullscreen Leaflet map.
- Memory modal with title/date/notes/photos.
- Dark/light mode + map tile switching.
- Location search with suggestions.
- Memory sidebar overlay and filtering.
- Life-path connections between pins.

## Prioritized Feature Ladder
P0:
- Data integrity + migration system.
- Replay mode v1.
- Photo pipeline hardening (compression, remove/reorder, limits).
- Responsive reliability pass.
- Empty/error/loading state coverage.

P1:
- Timeline panel synced with map/sidebar.
- JSON import/export backups.
- Tags and memory filtering.
- Marker clustering.
- Better onboarding.

P2:
- Auth.
- Cloud sync + offline queue.
- Multi-device conflict handling improvements.
- Shared journeys.
- AI assist features.

## Suggested Tech Roadmap

### Phase 1 - Stabilize Core (Current)
- Harden local-first app behavior and UX.
- Add replay mode.
- Add schema migrations and strong data safeguards.

### Phase 2 - Add Backend
- Introduce auth + memory CRUD APIs.
- Move photos to object storage.
- Implement sync and account-level persistence.

### Phase 3 - Scale and Differentiate
- Improve indexing/search and reliability.
- Add product analytics and alerting.
- Expand into collaboration and advanced discovery.

## 30 / 60 / 90 Day Solo Founder Plan

### Days 0-30
- Lock core flow quality (create/edit/delete/search).
- Ship replay mode v1.
- Complete responsiveness + accessibility pass.
- Add baseline product analytics events.

### Days 31-60
- Ship backend skeleton (auth + memory API + photo upload).
- Deliver first local-cloud sync loop for single-device users.
- Add backup/import-export tooling.

### Days 61-90
- Harden sync/retry/error recovery.
- Optimize large-memory performance.
- Run user interviews and prune low-value scope.
- Prepare private beta with clear onboarding and privacy messaging.

## Success Metrics

### Activation
- First memory creation rate in first session.
- Time to first memory.

### Retention
- D1, D7, D30 return rates.
- Share of users with >=5 memories by day 7.

### Engagement
- Memories created per active user/week.
- Replay mode usage rate.
- Sidebar/timeline navigation interactions per session.

## Risks and Mitigations
Product risk:
- Memory journaling frequency may be lower than expected.
- Mitigation: optimize for emotional payoff (replay/timeline), not feature volume.

Technical risk:
- localStorage limits with heavy photos can break trust.
- Mitigation: compression + limits + migration + backup/export early.

Execution risk:
- Solo founder scope creep.
- Mitigation: strict P0/P1/P2 gating and weekly scope cuts.
