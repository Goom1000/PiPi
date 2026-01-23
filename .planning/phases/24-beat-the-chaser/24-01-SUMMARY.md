---
phase: 24-beat-the-chaser
plan: 01
subsystem: game-types
tags: [typescript, game-state, react, configuration]

# Dependency graph
requires:
  - phase: 20-game-foundation
    provides: BaseGameState interface and discriminated union pattern
provides:
  - Extended BeatTheChaserState type with phase management
  - Difficulty configuration with time ratios and AI accuracy ranges
  - Setup modal component for game launch
affects: [24-02, 24-03, 24-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [Difficulty-based time ratio calculation, AI accuracy ranges]

key-files:
  created:
    - components/games/beat-the-chaser/beatTheChaserConfig.ts
    - components/games/beat-the-chaser/SetupModal.tsx
  modified:
    - types.ts
    - components/PresentationView.tsx

key-decisions:
  - "BeatTheChaserPhase includes setup phase before Cash Builder (unlike Chase which starts at cash-builder)"
  - "Difficulty affects both time ratio (0.8/1.0/1.2) and AI accuracy ranges for balanced gameplay"
  - "Cash Builder awards 5 seconds per correct answer with 60-second cap"
  - "Setup modal defaults to Medium difficulty and AI-Controlled for optimal classroom experience"

patterns-established:
  - "BeatTheChaserDifficulty type with time ratio and accuracy range configuration"
  - "Helper functions (calculateChaserTime, getChaserAccuracy) for gameplay logic"

# Metrics
duration: 3min
completed: 2026-01-23
---

# Phase 24 Plan 01: Beat the Chaser Setup Summary

**Extended BeatTheChaserState with phase management (setup/cash-builder/timed-battle/game-over), difficulty config (Easy 80%/Medium 100%/Hard 120% time ratios), and setup modal for game launch**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-23T16:35:59Z
- **Completed:** 2026-01-23T16:38:47Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Extended BeatTheChaserState with comprehensive phase and battle state management
- Created difficulty configuration with time ratios and AI accuracy ranges
- Built setup modal with difficulty selection and AI control toggle
- Updated placeholder factory for type-safe game initialization

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend BeatTheChaserState type** - `c716a03` (feat)
2. **Task 2: Create difficulty configuration** - `31f6a44` (feat)
3. **Task 3: Create setup modal component** - `bb2566a` (feat)

## Files Created/Modified
- `types.ts` - Extended BeatTheChaserState with phase, difficulty, Cash Builder tracking, and battle state fields
- `components/PresentationView.tsx` - Updated placeholder factory with all required BeatTheChaserState fields
- `components/games/beat-the-chaser/beatTheChaserConfig.ts` - Difficulty configuration with time ratios, AI accuracy ranges, and helper functions
- `components/games/beat-the-chaser/SetupModal.tsx` - Setup modal with difficulty selection grid and AI control toggle

## Decisions Made

**1. BeatTheChaserPhase includes 'setup' phase**
- Rationale: Unlike Chase which starts directly at cash-builder, Beat the Chaser needs setup phase for consistent state management before question generation

**2. Difficulty affects time ratio and AI accuracy**
- Easy: 80% time, 50-60% accuracy
- Medium: 100% time, 70-80% accuracy (default)
- Hard: 120% time, 85-95% accuracy
- Rationale: Dual-parameter difficulty provides balanced challenge progression

**3. Cash Builder awards 5 seconds per correct with 60-second cap**
- Rationale: Prevents runaway time accumulation while rewarding skill (10 questions × 5s = 50s max base time)

**4. Setup modal defaults to Medium + AI-Controlled**
- Rationale: Provides optimal classroom experience out-of-box while allowing teacher customization

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated placeholder BeatTheChaserState factory**
- **Found during:** Task 1 (Type extension)
- **Issue:** PresentationView.tsx placeholder factory missing newly required BeatTheChaserState fields, causing TypeScript compilation errors
- **Fix:** Updated factory return value to include all required fields (phase, accumulatedTime, cashBuilderQuestionsAnswered, cashBuilderCorrectAnswers, chaserDifficulty, isAIControlled, contestantAnswer, chaserAnswer, showTimeBonusEffect, winner)
- **Files modified:** components/PresentationView.tsx
- **Verification:** TypeScript compiles without errors
- **Committed in:** c716a03 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessary for type safety. No scope creep.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- BeatTheChaserState type system complete and type-safe
- Difficulty configuration ready for game orchestrator
- Setup modal ready for integration
- Next: Plan 02 (Cash Builder round implementation)

---
*Phase: 24-beat-the-chaser*
*Completed: 2026-01-23*
