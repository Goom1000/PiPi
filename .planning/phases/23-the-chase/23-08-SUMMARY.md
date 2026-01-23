---
phase: 23-the-chase
plan: 08
subsystem: ui
tags: [react, typescript, broadcast-channel, the-chase, student-view, game-ui]

# Dependency graph
requires:
  - phase: 23-02
    provides: GameBoard component for head-to-head display
  - phase: 23-04
    provides: VotingWidget for offer selection
  - phase: 23-07
    provides: TheChaseState type and game orchestration
provides:
  - TheChaseStudentView component rendering all Chase phases
  - Student-facing game display synced via BroadcastChannel
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [phase-specific student view rendering, BroadcastChannel state sync]

key-files:
  created: []
  modified:
    - components/StudentGameView.tsx

key-decisions:
  - "Cash Builder displays timer with urgency styling at 10s threshold"
  - "Offer Selection shows VotingWidget when voting open, offer display when waiting"
  - "Head-to-Head shows GameBoard scaled up with current question sidebar"
  - "Final Chase shows dual timers/scores with phase-specific highlighting"
  - "Game Over calculates win/loss from final scores and displays prize if won"

patterns-established:
  - "Phase-specific rendering pattern for multi-phase games in student view"
  - "Read-only student displays sync via BroadcastChannel from teacher view"

# Metrics
duration: 2min
completed: 2026-01-23
---

# Phase 23 Plan 08: Student View Summary

**Complete student view for The Chase game with phase-specific displays: Cash Builder timer/score, Offer Selection voting, Head-to-Head board, Final Chase dual timers, and Game Over results**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-23T11:03:10Z
- **Completed:** 2026-01-23T11:05:24Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- TheChaseStudentView component renders all 6 phases (5 game phases + game-over)
- Cash Builder shows countdown timer with urgency styling and running prize pot
- Offer Selection integrates VotingWidget when voting open, displays offers when waiting
- Head-to-Head shows GameBoard with positions and current question with answers
- Final Chase displays dual timers and scores for both contestant and chaser rounds
- Game Over shows victory/defeat screen with final scores and prize if won
- All displays sync automatically via BroadcastChannel from teacher view

## Task Commits

Each task was committed atomically:

1. **Task 1: Add TheChaseStudentView component** - `cf97ace` (feat)

## Files Created/Modified
- `components/StudentGameView.tsx` - Added TheChaseStudentView component with phase-specific rendering for all Chase game phases, routed from main StudentGameView component

## Decisions Made

**Cash Builder display decisions:**
- Timer shows urgency styling (red, pulsing) when 10 seconds or less remain
- Prize pot displays as formatted dollar amount with live updates
- Current question and answers shown with answer feedback (correct/incorrect highlighting)

**Offer Selection display decisions:**
- VotingWidget component renders when isVotingOpen is true
- When voting not open, displays offers with position indicators and amounts
- Waiting message shown when teacher hasn't started vote yet

**Head-to-Head display decisions:**
- GameBoard scaled 1.5x for better visibility on projected display
- Current question shown in sidebar with contestant and chaser answer highlighting
- Both player answers shown with color coding (blue for contestant, red for chaser)

**Final Chase display decisions:**
- Active phase gets highlighted border (blue for contestant, red for chaser)
- Timer urgency styling activates at 10 seconds for active player
- Questions show answer highlighting based on which phase is active

**Game Over display decisions:**
- Win condition: contestant score > chaser score OR chaser didn't reach target
- Victory screen shows green gradient, defeat shows red gradient
- Prize amount displayed only if contestant won
- Final scores shown side-by-side with vs separator

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Student view complete for all Chase phases
- Ready for end-to-end testing of teacher-student view synchronization
- All game phases have corresponding student displays
- BroadcastChannel sync ensures students see game state in real-time

---
*Phase: 23-the-chase*
*Completed: 2026-01-23*
