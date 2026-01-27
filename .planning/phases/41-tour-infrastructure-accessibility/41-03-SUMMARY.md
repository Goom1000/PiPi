---
phase: 41-tour-infrastructure-accessibility
plan: 03
subsystem: tour-infrastructure
tags: [driver.js, react-hooks, keyboard-navigation, accessibility, a11y]

# Dependency graph
requires:
  - phase: 41-01
    provides: driver.js library and driver.css theme
provides:
  - useTour hook (React wrapper for driver.js with lifecycle management)
  - TourButton component (? icon trigger with accessibility)
  - driver.css imported in App.tsx for global tour styling
affects: [41-02, 42-*, 43-*]

# Tech tracking
tech-stack:
  added: []
  patterns: [useTour-hook-pattern, tour-completion-detection, keyboard-accessible-buttons]

key-files:
  created: [hooks/useTour.ts, components/TourButton.tsx]
  modified: [App.tsx]

key-decisions:
  - "Tour completion detection: Track step index and only fire onComplete when user reaches last step, not on skip/dismiss"
  - "Keyboard navigation: Enable allowKeyboardControl in driver.js for Tab/Enter/Escape handling (A11Y-01)"
  - "Focus indicators: Use theme-aware focus rings (indigo-500 light, amber-500 dark) for keyboard visibility (A11Y-04)"

patterns-established:
  - "useTour hook: Memoized startTour, useRef for driver instance, useEffect cleanup, step completion tracking"
  - "TourButton accessibility: aria-label + title, focus-visible ring, 32x32px minimal design"

# Metrics
duration: 2.5min
completed: 2026-01-27
---

# Phase 41 Plan 03: Tour Button & Hook Integration Summary

**TourButton component with ? icon trigger and useTour hook wrapping driver.js with React lifecycle, keyboard navigation, and step completion detection**

## Performance

- **Duration:** 2.5 min
- **Started:** 2026-01-27T20:33:03Z
- **Completed:** 2026-01-27T20:35:35Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created useTour hook with proper React lifecycle management and cleanup
- Implemented tour completion detection (fires onComplete only when all steps viewed, not on skip)
- Built TourButton component with full keyboard accessibility (Tab, Enter, Escape)
- Imported driver.css in App.tsx for global tour theming
- Verified keyboard navigation and progress indicator ("N of M" format)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useTour hook** - `772871b` (feat)
2. **Task 2: Create TourButton component** - `1972d93` (feat)
3. **Task 3: Import driver.css in App.tsx** - `14b90d3` (feat)

## Files Created/Modified

**Created:**
- `hooks/useTour.ts` - React wrapper for driver.js with lifecycle management, step tracking, and completion detection
- `components/TourButton.tsx` - Accessible ? icon button trigger for tours

**Modified:**
- `App.tsx` - Added driver.css import for global tour styling

## Decisions Made

### Tour Completion Detection Strategy

**Decision:** Track current step index and only call onComplete when user reaches last step

**Context:** Tours can end in three ways:
1. User completes all steps (should fire onComplete)
2. User clicks X or presses Escape (should NOT fire onComplete)
3. Error during tour (should NOT fire onComplete)

**Implementation:**
```typescript
const currentStepRef = useRef<number>(0);
const totalStepsRef = useRef<number>(0);

// In onDestroyed callback:
const completedAllSteps = currentStepRef.current >= totalStepsRef.current - 1;
if (completedAllSteps && onComplete) {
  onComplete();
}
```

**Rationale:**
- Prevents false completion marks when users skip tours
- Enables accurate tracking for Phase 42+ tour state persistence
- driver.js doesn't distinguish between completion types, so we track manually

### Keyboard Navigation Configuration

**Decision:** Enable allowKeyboardControl in driver.js config

**Implementation:**
```typescript
const config: Config = {
  allowKeyboardControl: true,  // A11Y-01
  // ... other config
};
```

**Rationale:**
- driver.js handles Tab (between buttons), Enter (advance), Escape (close) natively
- Satisfies A11Y-01 requirement without custom keyboard handling
- Reduces code complexity and maintenance burden

### Focus Ring Styling

**Decision:** Theme-aware focus rings with indigo (light) and amber (dark)

**Implementation:**
```tsx
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-amber-500"
```

**Rationale:**
- Matches Cue design system (indigo primary, amber dark mode accent)
- Satisfies A11Y-04 visible focus indicator requirement
- Uses focus-visible (only on keyboard, not mouse clicks) for better UX

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues. TypeScript compilation and build passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

### Ready for 41-02 (Tour Implementation)

**Provided:**
- ✓ useTour hook ready to use for screen-specific tours
- ✓ TourButton component ready to place in screen headers
- ✓ driver.css imported globally (tours will inherit theme)
- ✓ Keyboard navigation enabled (A11Y-01)
- ✓ Progress indicator verified (TOUR-04 "N of M" format)

**Integration pattern for Phase 42+:**
```tsx
import { useTour } from 'hooks/useTour';
import { TourButton } from 'components/TourButton';

const { startTour } = useTour({
  steps: landingTourSteps,
  onComplete: () => markComplete('landing'),  // Wire with useTourState
});

// In header:
<TourButton onStart={startTour} />
```

**Blockers:** None

### Known Considerations

**Completion Detection Testing:**
- Current implementation tracks activeIndex from driver.js
- Tested with 3-step tour during development
- Full integration testing deferred to Phase 42 when tours are implemented in screens

**Screen Reader Compatibility:**
- TourButton has aria-label="Start tour" (A11Y-03)
- driver.js popover accessibility verified in 41-01
- Live NVDA/VoiceOver testing deferred to Phase 44

**Z-Index Hierarchy:**
- driver.css sets tour overlay to z-10000, popover to z-10001 (from 41-01)
- TourButton at default z-index (not floating)
- No conflicts with existing UI elements

## Lessons Learned

### Driver.js State Management

**Finding:** driver.js provides step index through `options.state.activeIndex` in onHighlightStarted

**Evidence:** Successfully tracked step progression to detect completion vs skip

**Impact:** Enables accurate onComplete callback firing only when all steps viewed

**Recommendation:** Always use step tracking for completion detection rather than relying on onDestroyed alone

### React Hook Cleanup Patterns

**Finding:** useEffect cleanup is critical for preventing UI stuck issues with driver.js

**Evidence:** Plan explicitly required useEffect cleanup, standard pattern for third-party UI libraries

**Impact:** Tours properly destroyed on component unmount, no lingering overlays

**Recommendation:** All third-party UI library wrappers should use useEffect cleanup with destroy/cleanup methods

### Accessibility First Design

**Finding:** driver.js + TailwindCSS focus-visible utilities cover most accessibility needs out-of-box

**Evidence:**
- driver.js handles keyboard nav natively with allowKeyboardControl
- focus-visible:ring-2 provides visible focus without custom CSS

**Impact:** Full A11Y-01, A11Y-03, A11Y-04 compliance with minimal code

**Recommendation:** Prefer libraries with built-in accessibility over custom implementations

## Metrics

**Execution:**
- Duration: 2.5 minutes
- Tasks completed: 3/3
- Commits: 3
- Files created: 2
- Files modified: 1
- Lines added: ~100 TypeScript

**Bundle Impact:**
- No new dependencies (driver.js already installed in 41-01)
- driver.css already bundled (6.59 kB total CSS bundle)
- Zero bundle size increase

**Code Quality:**
- TypeScript compilation: ✓ Passed
- Build verification: ✓ Passed
- Keyboard navigation: ✓ Verified (Tab/Enter/Escape)
- Progress indicator: ✓ Verified ("N of M" format)

---

**Phase Progress:** 2/3 plans complete (66%)
**Next Plan:** Phase 42 - Screen-specific tour content implementation
