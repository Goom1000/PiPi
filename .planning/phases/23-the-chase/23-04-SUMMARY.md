---
phase: 23-the-chase
plan: 04
subsystem: game-ui
tags: [react, broadcast-channel, voting, the-chase]

# Dependency graph
requires:
  - phase: 23-01
    provides: ChaseOffer type definition and broadcast sync infrastructure
provides:
  - Offer selection UI with teacher-editable prizes and positions
  - Class voting system via BroadcastChannel with real-time vote tallies
  - Student voting widget for offer selection
affects: [23-05-head-to-head, 23-06-final-chase]

# Tech tracking
tech-stack:
  added: []
  patterns: [broadcast-voting, real-time-tallies, editable-offer-cards]

key-files:
  created:
    - components/games/the-chase/OfferSelection.tsx
    - components/games/the-chase/VotingWidget.tsx
  modified: []

key-decisions:
  - "Teacher manually edits offer amounts and positions before starting vote"
  - "Vote counts update live as CHASE_VOTE_CAST messages arrive"
  - "Majority determined by tallies.indexOf(Math.max(...tallies))"
  - "VotingWidget hidden (returns null) when not in voting mode"
  - "Name input shown on VotingWidget if studentName prop not provided"

patterns-established:
  - "Vote state: Map<studentName, offerIndex> for one-vote-per-student"
  - "Position badge calculated as (7 - position) for display steps"
  - "Offer editing disabled when voting is open"

# Metrics
duration: 1.5min
completed: 2026-01-23
---

# Phase 23 Plan 04: Offer Selection Summary

**Class-voted offer selection with teacher-editable prizes, live vote tallies, and student voting interface via BroadcastChannel**

## Performance

- **Duration:** 1.5 min
- **Started:** 2026-01-23T10:52:51Z
- **Completed:** 2026-01-23T10:54:19Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Teacher can present three offers with manually editable amounts and starting positions
- Class voting opens via broadcast, students vote from their view, teacher sees live tallies
- Majority winner determined automatically when voting ends
- Selected offer proceeds to Head-to-Head phase with chosen starting position

## Task Commits

Each task was committed atomically:

1. **Task 1: Create OfferSelection component for teacher view** - `15fa9ab` (feat)
2. **Task 2: Create VotingWidget component for student view** - `b47682a` (feat)

## Files Created/Modified
- `components/games/the-chase/OfferSelection.tsx` - Teacher-facing offer selection with editable amounts/positions, vote collection, and majority determination
- `components/games/the-chase/VotingWidget.tsx` - Student-facing voting UI that listens for CHASE_VOTE_START and broadcasts CHASE_VOTE_CAST

## Decisions Made

1. **Teacher manually edits offers before voting** - Per CONTEXT.md, offers are not calculated automatically; teacher has full control over amounts and positions

2. **Vote tallies calculated on-demand** - `getVoteCount(index)` filters votes Map rather than maintaining separate tally state for simplicity

3. **Majority winner via Math.max** - `tallies.indexOf(Math.max(...tallies))` finds winning index; ties go to first offer with max votes

4. **VotingWidget hidden when inactive** - Returns `null` when not voting to avoid unnecessary UI clutter on student view

5. **Optional name input** - VotingWidget shows name input if `studentName` prop not provided, allowing anonymous student voting

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Offer selection complete and ready for integration into TheChaseGame component
- Head-to-Head phase (Plan 05) can use selected offer's position to initialize contestant starting position
- VotingWidget can be mounted conditionally in student view when phase='offer-selection'

---
*Phase: 23-the-chase*
*Completed: 2026-01-23*
