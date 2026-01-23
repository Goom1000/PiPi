---
phase: 21-millionaire-game
plan: 02
subsystem: games
tags: [react, millionaire, quiz-game, game-ui, sequential-animation]

# Dependency graph
requires:
  - phase: 21-01
    provides: MoneyTree component, millionaireConfig, extended MillionaireState
provides:
  - MillionaireQuestion component with answer selection and reveal animations
  - Full MillionaireGame gameplay flow with Money Tree and question progression
  - PresentationView launchMillionaire with question count selection (3/5/10)
  - Millionaire-specific control handlers (select, lock-in, next)
affects: [21-03-lifelines, 21-04-student-sync]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Sequential reveal animation (300ms between options, 800ms before result)
    - Game state factory pattern for initial state creation
    - Modal-based game setup with question count selection

key-files:
  created:
    - components/games/millionaire/MillionaireQuestion.tsx
  modified:
    - components/games/MillionaireGame.tsx
    - components/PresentationView.tsx
    - components/games/GameContainer.tsx

key-decisions:
  - "Sequential reveal animation uses nested setTimeout pattern for dramatic timing"
  - "Question count selection (3/5/10) happens before question generation in modal"
  - "GameContainer extended with Millionaire-specific props for proper handler routing"
  - "Victory detection: currentQuestionIndex === questions.length - 1 AND correct answer"
  - "Game over shows safe haven amount (calculated from passed safe havens)"

patterns-established:
  - "Game-specific handlers passed through GameContainer to individual game components"
  - "Setup modals for game configuration before launch (question count, difficulty, etc.)"

# Metrics
duration: 4min
completed: 2026-01-23
---

# Phase 21 Plan 02: Millionaire Question Display and Core Game Flow Summary

**Millionaire launches with question count selection (3/5/10), classic blue/purple question display, answer selection with dramatic sequential reveal, Money Tree visualization, and full progression through correct/wrong answers**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-23T07:49:18Z
- **Completed:** 2026-01-23T07:53:33Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- MillionaireQuestion component displays question with classic Millionaire styling and answer selection
- MillionaireGame rebuilt with full gameplay: Money Tree sidebar, question display, reveal sequence, result screens
- PresentationView integration with question count selection modal and game control handlers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MillionaireQuestion component with answer selection and reveal** - `6a21a98` (feat)
2. **Task 2: Rebuild MillionaireGame with full gameplay flow** - `7e024ab` (feat)
3. **Task 3: Add launchMillionaire to PresentationView with question count selection** - `39d403c` (feat)

## Files Created/Modified
- `components/games/millionaire/MillionaireQuestion.tsx` - Question display with A-D answer options, selection states, lock-in button, sequential reveal animation support, eliminated options for lifelines
- `components/games/MillionaireGame.tsx` - Full game view with Money Tree (30% left column), question/controls (70% right column), reveal sequence logic, victory/game over result screens
- `components/PresentationView.tsx` - createMillionaireState factory, launchMillionaire with async question generation, Millionaire setup modal (3/5/10 questions), Millionaire control handlers (select/lock-in/next)
- `components/games/GameContainer.tsx` - Extended props to accept and route Millionaire-specific handlers to MillionaireGame

## Decisions Made
- Sequential reveal animation uses nested setTimeout with 300ms between options and 800ms before showing result (dramatic Millionaire timing)
- Question count selection happens in modal before question generation starts (teacher chooses 3/5/10 upfront)
- GameContainer extended with optional Millionaire-specific props (onMillionaireSelectOption, onMillionaireLockIn, onMillionaireNext) for proper handler routing
- Victory detection: currentQuestionIndex === questions.length - 1 AND selectedOption === correctAnswerIndex
- Game over shows safe haven amount (calculated from passed safe havens based on current position)
- Lifeline buttons shown as disabled placeholders with "Coming in Phase 21 Plan 03" message

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Millionaire core gameplay complete and functional
- Ready for lifeline implementations in Plan 03 (50:50, Phone a Friend, Ask the Audience)
- Student view sync will be added in Plan 04 (broadcast game state to student window)
- Question generation works via existing generateImpromptuQuiz provider method

---
*Phase: 21-millionaire-game*
*Completed: 2026-01-23*
