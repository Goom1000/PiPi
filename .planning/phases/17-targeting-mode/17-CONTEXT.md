# Phase 17: Targeting Mode - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Teachers can switch between manual questioning and targeted student selection with fair cycling. Manual mode uses 5 difficulty buttons (existing behavior). Targeted mode uses a single Question button that cycles through all students in random order, generating questions at each student's assigned grade level. Student display on projector is Phase 18.

</domain>

<decisions>
## Implementation Decisions

### Mode Toggle Behavior
- Toggle switch with labels: "Manual" and "Targeted"
- Default mode: Targeted (teacher opts out to Manual if needed)
- Toggle location: Claude's discretion based on existing UI
- Switching modes preserves tracking state (who's been asked)

### Targeted Mode UI (Key Design Decision)
- **Single "Question" button** replaces A/B/C/D/E buttons in Targeted mode
- System picks next student from randomized cycle
- AI generates question at that student's assigned grade level
- Guarantees every student asked once before any repeats
- Teacher doesn't select difficulty — grades pre-assigned in class bank

### Student Preview (Before Clicking)
- Next student name + grade level shown before clicking Question
- Format: "Next: Sarah (Grade C)"
- Skip button available if student absent/unavailable
- Skipped students counted as "asked" (won't reappear until cycle resets)

### After Question Generated
- Student name stays visible in teleprompter with question/answer
- Dismissing question returns to neutral state (no auto-preview)
- Teacher must click again to see next student

### Manual Mode UI
- Keep all 5 difficulty buttons (A/B/C/D/E)
- Teacher picks difficulty, no student selected
- Current behavior preserved

### Cycling Feedback
- Progress counter visible: "5 of 24 students asked"
- Counter tappable to expand list of students with checkmarks
- Teacher can manually mark students as "asked" (e.g., answered voluntarily)
- Silent restart when cycle completes (counter resets, reshuffles, continues)

### Edge Case Handling
- Single student: Works normally (same student shown every time)
- No class loaded: Targeted mode toggle disabled with tooltip
- Missing grade assignment: Prompt to assign grades before using Targeted mode
- All students asked: Auto-reshuffle and restart cycle

### Claude's Discretion
- Exact toggle placement in teleprompter UI
- Visual styling of skip button
- Counter and list UI implementation details
- Animation/transitions between states

</decisions>

<specifics>
## Specific Ideas

- The key insight: In Targeted mode, teacher shouldn't pick grades. The system knows each student's grade and handles fairness. This prevents scenarios where some students never get asked because teacher keeps picking certain difficulty levels.
- Counter should give teacher awareness of progress without being intrusive
- Expandable list lets teacher verify fairness and mark students who answered voluntarily

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-targeting-mode*
*Context gathered: 2026-01-22*
