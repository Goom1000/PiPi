---
phase: 41
plan: 02
subsystem: tour-infrastructure
tags: [localStorage, state-management, persistence, react-hooks]
requires:
  - phase: 41-01
    provides: Tour infrastructure foundation (driver.js, InfoTooltip)
provides:
  - TourState types (TourId, TourState, DEFAULT_TOUR_STATE)
  - useTourState hook with localStorage persistence
  - Tour completion tracking API (isCompleted, markCompleted, resetTour, resetAllTours)
affects: [41-03, 42-*, 43-*, 44-*]
tech-stack:
  added: []
  patterns: [localStorage-persistence-hooks, type-safe-unions, validation-guards]
key-files:
  created: [hooks/useTourState.ts]
  modified: [types.ts]
decisions:
  - id: tour-id-union-type
    choice: TourId as union type ('landing' | 'editor' | 'presentation')
    rationale: Type-safe tour identification prevents runtime errors from invalid tour IDs
  - id: storage-key-naming
    choice: pipi-tour-state key
    rationale: Matches existing pipi- prefix convention from useSettings (pipi-settings)
  - id: set-deduplication
    choice: Use Set spread in markCompleted to prevent duplicates
    rationale: Guards against accidentally marking same tour complete multiple times
duration: 2.5 minutes
completed: 2026-01-28
---

# Phase 41 Plan 02: Tour State Persistence Summary

**One-liner:** TourState types and useTourState hook with localStorage persistence for tracking landing/editor/presentation tour completion, following useSettings pattern with validation guards and type-safe TourId union.

## What Was Built

### TourState Types (types.ts)

Added tour-specific types to the types module:

**TourId Union Type:**
```typescript
export type TourId = 'landing' | 'editor' | 'presentation';
```
- Type-safe tour identification
- Constrains to three valid screen-specific tours
- Prevents runtime errors from invalid tour IDs

**TourState Interface:**
```typescript
export interface TourState {
  completedTours: TourId[];
  lastDismissed: Partial<Record<TourId, number>>;
}
```
- `completedTours`: Array of tour IDs user has completed
- `lastDismissed`: Optional timestamp tracking for "remind me later" functionality

**DEFAULT_TOUR_STATE Constant:**
```typescript
export const DEFAULT_TOUR_STATE: TourState = {
  completedTours: [],
  lastDismissed: {},
};
```
- Default state for new users
- Used as fallback when localStorage is empty or corrupted

### useTourState Hook (hooks/useTourState.ts)

Created localStorage persistence hook following the useSettings.ts pattern:

**Storage Key:** `pipi-tour-state`
- Matches existing pipi- prefix convention
- Stored in localStorage for cross-session persistence

**Validation Guard:**
```typescript
function isValidTourState(data: unknown): data is TourState {
  // Type checking for completedTours array and lastDismissed object
}
```
- Guards against corrupted localStorage data
- Falls back to DEFAULT_TOUR_STATE if validation fails

**Lazy Initialization:**
```typescript
const [state, setState] = useState<TourState>(readTourState);
```
- Reads from localStorage only on mount
- Avoids repeated localStorage reads on every render

**Automatic Persistence:**
```typescript
useEffect(() => {
  window.localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
}, [state]);
```
- Saves to localStorage on every state change
- Ensures tour completion persists across browser refresh

**Public API:**
- `isCompleted(tourId: TourId): boolean` - Check if tour is done (TOUR-03)
- `markCompleted(tourId: TourId): void` - Mark tour as complete (TOUR-03)
- `resetTour(tourId: TourId): void` - Allow re-watching a tour
- `resetAllTours(): void` - Reset everything (for testing/support)

**Set Deduplication:**
```typescript
completedTours: [...new Set([...prev.completedTours, tourId])]
```
- Prevents duplicate entries in completedTours array
- Ensures each tour appears once even if markCompleted called multiple times

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Commit | Type | Description | Files |
|--------|------|-------------|-------|
| c753c14 | feat | Add TourState types for persistence | types.ts |
| 6fd95d5 | feat | Create useTourState hook for persistence | hooks/useTourState.ts |

## Testing Performed

1. **TypeScript Compilation:** `npm run typecheck` passed with no errors after each task
2. **Type Exports:** Verified TourId, TourState, DEFAULT_TOUR_STATE exported from types.ts
3. **Hook Export:** Verified useTourState exported from hooks/useTourState.ts
4. **Pattern Matching:** Code review confirmed implementation follows useSettings.ts pattern:
   - ✓ Validation guard (isValidTourState)
   - ✓ Lazy initialization (readTourState)
   - ✓ Persistence effect (useEffect with localStorage.setItem)
   - ✓ Merge with defaults on read
   - ✓ Error handling with console.warn
5. **localStorage Integration:** Verified storage key and get/set pattern:
   - ✓ TOUR_STORAGE_KEY = 'pipi-tour-state'
   - ✓ localStorage.getItem(TOUR_STORAGE_KEY)
   - ✓ localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state))

**Manual functional testing deferred to Phase 42** when tours are implemented and hook is used in components.

## Technical Decisions

### TourId as Union Type

**Decision:** Use discriminated union type for TourId instead of string enum

**Context:** Three screen-specific tours need type-safe identification

**Rationale:**
- Union type is simpler than enum (no runtime code)
- TypeScript enforces only valid values can be passed
- Autocomplete support in IDEs
- Compile-time error if invalid tour ID used

**Alternative Considered:** String enum
**Rejected:** Adds runtime code, no benefit over union type for simple cases

**Implementation:**
```typescript
export type TourId = 'landing' | 'editor' | 'presentation';
```

### Storage Key Naming Convention

**Decision:** Use `pipi-tour-state` as localStorage key

**Context:** Existing pattern uses pipi- prefix (see useSettings with `pipi-settings`)

**Rationale:**
- Consistent with existing codebase conventions
- Namespaces localStorage to avoid conflicts with other apps
- Easy to identify and debug in browser devtools

**Alternative Considered:** `cue-tour-state` or `tour-state`
**Rejected:** Breaking existing naming convention adds confusion

**Implementation:**
```typescript
const TOUR_STORAGE_KEY = 'pipi-tour-state';
```

### Set Deduplication Strategy

**Decision:** Use Set spread to prevent duplicate tour completions

**Context:** User might mark same tour complete multiple times

**Rationale:**
- Set automatically deduplicates array elements
- Guards against UI bugs where markCompleted called twice
- No performance cost for small arrays (max 3 items)
- Clean, functional approach

**Alternative Considered:** Manual includes() check before push
**Rejected:** More verbose, Set pattern is idiomatic TypeScript

**Implementation:**
```typescript
completedTours: [...new Set([...prev.completedTours, tourId])]
```

## Next Phase Readiness

### Ready for 41-03 (Tour Implementation)

**Provided:**
- ✓ TourState types available for import
- ✓ useTourState hook ready to use
- ✓ Type-safe TourId constrains tour identification
- ✓ localStorage persistence working (verified via pattern matching)

**Blockers:** None

**Integration Example:**
```tsx
import { useTourState } from 'hooks/useTourState';

function LandingPage() {
  const { isCompleted, markCompleted } = useTourState();

  useEffect(() => {
    if (!isCompleted('landing')) {
      // Start landing tour
      tourDriver.drive();
      // After completion:
      markCompleted('landing');
    }
  }, [isCompleted, markCompleted]);
}
```

### Considerations for Phase 42+

**Tour Completion Check Pattern:**
- Check `isCompleted(tourId)` on component mount
- Only start tour if `!isCompleted(tourId)`
- Call `markCompleted(tourId)` after tour finishes (driver.js onDestroyed callback)

**Reset Functionality:**
- `resetTour(tourId)` for individual tour reset (Settings UI)
- `resetAllTours()` for full reset (Debug/support scenarios)

**Student View Safety:**
- Student view (#/student) should NOT use useTourState hook
- Tours are teacher-only feature
- Verify in Phase 44 that BroadcastChannel doesn't sync tour state

## Lessons Learned

### Validation Guard Pattern

**Finding:** isValidTourState guard prevents localStorage corruption crashes

**Evidence:** Following useSettings pattern with type guards

**Impact:** App gracefully handles corrupted localStorage data

**Recommendation:** Always use validation guards when reading from localStorage in hooks

### Lazy Initialization with Functions

**Finding:** useState with function initializer prevents repeated localStorage reads

**Evidence:** `useState<TourState>(readTourState)` calls readTourState only on mount

**Impact:** Performance optimization - no localStorage read on every render

**Recommendation:** Always use function initializers for expensive state initialization

### Set for Array Deduplication

**Finding:** Set spread pattern is clean way to deduplicate arrays in React state

**Evidence:** `[...new Set([...array, newItem])]` prevents duplicates

**Impact:** Guards against UI bugs without manual checking logic

**Recommendation:** Use Set pattern for small arrays where uniqueness matters

## Metrics

**Execution:**
- Duration: 2.5 minutes (154 seconds)
- Started: 2026-01-28T06:32:59Z (UTC)
- Completed: 2026-01-28T06:35:33Z (UTC)
- Tasks completed: 2/2
- Commits: 2
- Files created: 1
- Files modified: 1
- Lines added: ~117 (19 types.ts, 98 hook)

**Implementation Details:**
- Hook lines of code: 98
- Type definitions: 3 (TourId, TourState, DEFAULT_TOUR_STATE)
- Public API methods: 4 (isCompleted, markCompleted, resetTour, resetAllTours)
- Internal functions: 2 (isValidTourState, readTourState)

**Bundle Impact:**
- No new dependencies added
- Pure TypeScript/React code
- Negligible bundle size increase (~1kb)

---

**Phase Progress:** 2/3 plans complete (67%)
**Next Plan:** 41-03-PLAN.md - Tour Implementation for Landing/Editor/Presentation screens
