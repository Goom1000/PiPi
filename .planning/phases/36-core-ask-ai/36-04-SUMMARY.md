---
phase: 36-core-ask-ai
plan: 04
subsystem: ui
tags: [ask-ai, streaming, react, dropdown, teleprompter, chat-ui]

# Dependency graph
requires:
  - phase: 36-01
    provides: ChatContext interface and buildChatContext helper
  - phase: 36-02
    provides: Gemini streaming chat implementation
  - phase: 36-03
    provides: Claude streaming chat implementation
provides:
  - Ask AI dropdown panel in PresentationView header
  - Streaming character-by-character response display
  - Quick action buttons for common prompts
  - Copy to clipboard and error handling UI
  - Teacher-only privacy indicator
affects: [37-history-persistence, future-ai-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual-state pattern for smooth streaming animation (askAIResponse + askAIDisplayedText)"
    - "requestAnimationFrame for character-by-character text display"
    - "Dropdown component in header with z-index overlay positioning"

key-files:
  created: []
  modified:
    - components/PresentationView.tsx

key-decisions:
  - "Moved Ask AI from inline teleprompter panel to header dropdown (better UX)"
  - "Dropdown opens on left side, overlays presentation area (not teleprompter)"
  - "White/inverse button styling for high visibility in header"
  - "Character animation at 200 chars/sec (5ms per char) for smooth streaming"
  - "Arrow keys blur input to preserve slide navigation"

patterns-established:
  - "Header dropdown pattern: Button in header, panel overlays content with high z-index"
  - "Streaming animation: Dual-state with requestAnimationFrame for smooth display"
  - "Quick actions: Preset prompts populate input field"

# Metrics
duration: 18min
completed: 2026-01-26
---

# Phase 36 Plan 04: Ask AI Panel UI Summary

**Header dropdown with streaming chat interface, quick action buttons, and character-by-character display animation**

## Performance

- **Duration:** 18 min
- **Started:** 2026-01-26T03:09:00Z (estimated from commit timestamps)
- **Completed:** 2026-01-26T03:27:06Z
- **Tasks:** 2 + checkpoint (user approval)
- **Files modified:** 1
- **Iterations:** 3 (initial inline → header dropdown → button repositioning)

## Accomplishments
- Ask AI button in header with high-contrast white styling
- Dropdown panel opens on left side, overlays presentation area
- Text input with Enter key support and Send button
- Three quick action buttons: "Get 3 facts", "Explain simply", "Answer question"
- Smooth character-by-character streaming animation (200 chars/sec)
- "Thinking..." loading indicator with spinner
- Copy button with toast feedback
- Clear button to reset conversation
- Error display with "Try again" retry button
- "Not visible to students" privacy indicator
- Arrow keys blur input to preserve slide navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Ask AI state and streaming logic** - `adf8e3f` (feat)
2. **Task 2: Add Ask AI panel UI** - `00be986` (feat)

**User feedback iterations:**
- Refactor to header dropdown - `b386c72` (refactor)
- Improve button visibility and z-index - `017560f` (fix)
- Move button to left side - `accf398` (fix)

**Plan metadata:** (to be committed after SUMMARY.md creation)

## Files Created/Modified
- `components/PresentationView.tsx` - Added Ask AI dropdown panel with streaming chat UI, state management, animation logic, and handler functions

## Decisions Made

**Moved from inline teleprompter to header dropdown:** Initial implementation placed Ask AI panel inline in the teleprompter. User feedback revealed this was visually cluttered. Moved to header dropdown pattern (similar to slide jump dropdown) for cleaner UX.

**Dropdown overlays presentation area:** Dropdown opens on left side and overlays the presentation view (not the teleprompter). This keeps the teleprompter script visible while using Ask AI.

**White/inverse button styling:** Used white button with black text for maximum visibility in the dark header. This makes the Ask AI feature discoverable.

**Character-by-character animation:** Implemented dual-state pattern (askAIResponse accumulates chunks, askAIDisplayedText shows animated output) with requestAnimationFrame at 200 chars/sec. This creates smooth streaming effect without jerky chunk-based updates.

**Arrow keys blur input:** When user presses arrow keys while input is focused, input automatically blurs to allow slide navigation. This preserves keyboard shortcuts while Ask AI panel is open.

## Deviations from Plan

### User Feedback Iterations

**1. [UX Improvement] Moved Ask AI from inline to header dropdown**
- **Found during:** Task 3 checkpoint verification
- **Issue:** Initial inline placement in teleprompter panel felt cluttered and visually overwhelming
- **Fix:** Refactored to header dropdown pattern (button in header, panel overlays content)
- **Files modified:** components/PresentationView.tsx
- **Verification:** User tested and requested further refinements
- **Committed in:** `b386c72` (refactor)

**2. [UX Improvement] Improved button visibility and dropdown z-index**
- **Found during:** Post-refactor verification
- **Issue:** Button wasn't visible enough, dropdown appeared behind content
- **Fix:** Changed button to white/inverse colors, increased z-index to 40
- **Files modified:** components/PresentationView.tsx
- **Verification:** User tested and requested button repositioning
- **Committed in:** `017560f` (fix)

**3. [UX Improvement] Moved button to left of Preview**
- **Found during:** Post-styling verification
- **Issue:** Button placement on right side wasn't ideal
- **Fix:** Moved button to leftmost position in header, dropdown overlays presentation (not teleprompter)
- **Files modified:** components/PresentationView.tsx
- **Verification:** User approved final implementation
- **Committed in:** `accf398` (fix)

---

**Total deviations:** 3 UX improvements based on user feedback
**Impact on plan:** All changes were iterative refinements to achieve better UX. Core functionality (streaming, quick actions, privacy, error handling) remained as planned.

## Issues Encountered

**Initial placement strategy:** Plan specified inline teleprompter placement, but user testing revealed header dropdown pattern was superior. This required architectural refactoring but resulted in better UX.

**Dropdown positioning:** Required careful z-index and positioning adjustments to ensure dropdown appeared above content while not interfering with teleprompter visibility.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ask AI UI complete and approved. Ready for:
- Phase 37: Multi-turn conversation history (session-only, not persisted)
- Future enhancements: Persisted history, conversation threading
- All UI requirements (CHAT-01 through UX-03) verified and approved by user

**Note:** Current implementation uses hardcoded "Year 6 (10-11 years old)" grade level. Future enhancement could source this from lesson metadata or user settings.

---
*Phase: 36-core-ask-ai*
*Completed: 2026-01-26*
