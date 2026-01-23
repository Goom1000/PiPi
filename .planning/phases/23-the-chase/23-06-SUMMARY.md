---
phase: 23-the-chase
plan: 06
subsystem: game-mechanics
tags: [react, typescript, the-chase, final-chase, pushback, timer, hooks]

# Dependency graph
requires:
  - phase: 23-01
    provides: Timer hook and Chase type system
  - phase: 23-02
    provides: Chaser AI hook for answer generation
provides:
  - Final Chase round with dual timed phases (contestant 2min, chaser 2min)
  - Pushback mechanic implementation (wrong chaser answer triggers contestant opportunity)
  - Component-local FinalPhase type for internal UI state management
  - Win/loss determination based on chaser timer expiry or score catch-up
affects: [23-07, game-orchestration]

# Tech tracking
tech-stack:
  added: []
  patterns: [component-local phase types for UI-only state management]

key-files:
  created:
    - components/games/the-chase/FinalChaseRound.tsx
  modified: []

key-decisions:
  - "FinalPhase type is component-local for internal UI state (intro, contestant-round, transition, chaser-round, pushback-opportunity, complete) - does not conflict with global ChasePhase"
  - "Pushbacks increase effective lead by 1 - chaser must beat (contestantScore + pushbacksEarned) to win"
  - "2-minute timers for both contestant and chaser phases with 10-second urgency threshold"
  - "Pushback opportunity pauses chaser timer until resolved"
  - "Contestant phase has keyboard shortcuts (1-4) for rapid answering"
  - "Auto-triggers AI chaser answers when entering chaser-round phase"

patterns-established:
  - "Component-local phase types distinct from global state types for separation of concerns"
  - "Timer pause/resume for pushback interruption mechanic"
  - "Effective target calculation: contestantScore + pushbacksEarned"

# Metrics
duration: 2min
completed: 2026-01-23
---

# Phase 23 Plan 06: Final Chase Round Summary

**Final Chase with 2-min timed phases, pushback mechanic on wrong chaser answers, and win/loss determination**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-23T10:57:29Z
- **Completed:** 2026-01-23T10:59:53Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Final Chase round with intro, contestant phase, transition, chaser phase, and completion
- Pushback mechanic: when chaser answers wrong, contestant gets opportunity to push back
- Successful pushbacks increase effective lead for win condition calculation
- 2-minute countdown timers with urgency styling at 10 seconds
- Component-local FinalPhase type for internal UI state management separate from global ChasePhase

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FinalChaseRound component with pushback mechanics** - `d96dea3` (feat)

## Files Created/Modified
- `components/games/the-chase/FinalChaseRound.tsx` - Final Chase round with dual timed phases, pushback mechanic, and win/loss determination

## Decisions Made

**Component-local phase type:**
- FinalPhase type used internally for UI state management (intro, contestant-round, transition, chaser-round, pushback-opportunity, complete)
- Separate from global ChasePhase in types.ts which orchestrator uses ('final-chase-contestant', 'final-chase-chaser')
- This separation keeps UI-only concerns local to the component

**Pushback mechanic implementation:**
- Wrong chaser answer pauses timer and triggers pushback-opportunity phase
- Contestant gets same question to answer
- Correct pushback increases pushbacksEarned counter by 1
- Win condition: chaser must beat (contestantScore + pushbacksEarned) to catch contestant

**Timer management:**
- 2-minute (120 second) countdown for each phase
- Urgency threshold at 10 seconds (red text, pulse animation)
- Chaser timer pauses during pushback opportunity
- Timer expiry triggers automatic phase transitions or win determination

**Answer handling:**
- Contestant phase: keyboard shortcuts (1-4) for rapid answering
- Chaser phase: auto-triggers AI via useChaserAI when entering phase
- Manual chaser mode supported if isAIControlled is false
- 300ms feedback delay for contestant, 800ms for chaser answers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Final Chase round is complete and ready for integration into The Chase game orchestrator (Plan 07).

Key integration points:
- onComplete callback passes 'win' or 'loss' outcome with final scores
- prizeAmount prop displays stake throughout round
- chaserDifficulty and isAIControlled props configure chaser behavior
- Component expects questions array for both phases

Ready for:
- Integration into TheChaseGame orchestrator
- Phase transitions from head-to-head to final-chase
- Game-over state handling after Final Chase completion

---
*Phase: 23-the-chase*
*Completed: 2026-01-23*
