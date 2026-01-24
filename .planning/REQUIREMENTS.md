# Requirements: Cue v3.2

**Defined:** 2026-01-25
**Core Value:** Students see only the presentation; teachers see the teleprompter script

## v3.2 Requirements

Requirements for Pedagogical Slide Types milestone. Each maps to roadmap phases.

### Single Teleprompter Regeneration

- [ ] **REGEN-01**: User can regenerate teleprompter script for a single slide via button in teleprompter panel
- [ ] **REGEN-02**: Regeneration respects current verbosity level selection (Concise/Standard/Detailed)
- [ ] **REGEN-03**: Regeneration uses full slide context (surrounding slides) for coherent script

### Elaborate Slides

- [ ] **ELAB-01**: User can insert Elaborate slide via "+" menu option
- [ ] **ELAB-02**: AI generates 3-5 paragraphs expanding on current slide content
- [ ] **ELAB-03**: Generated content includes examples, explanations, and context for deeper understanding
- [ ] **ELAB-04**: Teleprompter provides guide for delivering detailed content

### Work Together Slides

- [ ] **WORK-01**: User can insert Work Together slide via "+" menu option
- [ ] **WORK-02**: AI generates collaborative activity instructions for pairs (with group-of-3 alternative)
- [ ] **WORK-03**: Activity uses only basic classroom resources (pen, paper, whiteboard)
- [ ] **WORK-04**: Teleprompter shows facilitation notes for teacher

### Class Challenge Slides

- [ ] **CHAL-01**: User can insert Class Challenge slide via "+" menu option
- [ ] **CHAL-02**: Slide displays editable prompt/question at top
- [ ] **CHAL-03**: Teacher can input student contributions during presentation mode
- [ ] **CHAL-04**: Contributions display as styled cards on slide
- [ ] **CHAL-05**: Contributions sync to student view in real-time via BroadcastChannel
- [ ] **CHAL-06**: Contributions lock (become read-only) when navigating away from slide

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Teleprompter Enhancements

- **REGEN-04**: Visual indicator when script may be stale (content edited since generation)
- **REGEN-05**: Regenerate all three verbosity levels at once (populate full cache)

### Elaborate Enhancements

- **ELAB-05**: Multiple elaboration styles (examples-focused, misconceptions-focused, visual-focused)
- **ELAB-06**: Automatic content adjustment for student age/grade level

### Work Together Enhancements

- **WORK-05**: Grade-aware grouping suggestions using class bank data
- **WORK-06**: Multiple activity type templates (think-pair-share, peer teaching, discussion)

### Class Challenge Enhancements

- **CHAL-07**: Animation on new contributions appearing
- **CHAL-08**: Export challenge results for Working Wall display
- **CHAL-09**: Profanity filter / input sanitization

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Student device polling for Class Challenge | Breaks client-only model, creates equity issues |
| Pre-built activity template libraries | Scope creep, generic templates disconnect from lesson content |
| Automatic script regeneration on content edit | Destroys teacher manual refinements |
| Live word cloud visualization | High complexity, marginal value over simple list |
| Real-time collaborative editing | High complexity, not core to teleprompter value |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REGEN-01 | TBD | Pending |
| REGEN-02 | TBD | Pending |
| REGEN-03 | TBD | Pending |
| ELAB-01 | TBD | Pending |
| ELAB-02 | TBD | Pending |
| ELAB-03 | TBD | Pending |
| ELAB-04 | TBD | Pending |
| WORK-01 | TBD | Pending |
| WORK-02 | TBD | Pending |
| WORK-03 | TBD | Pending |
| WORK-04 | TBD | Pending |
| CHAL-01 | TBD | Pending |
| CHAL-02 | TBD | Pending |
| CHAL-03 | TBD | Pending |
| CHAL-04 | TBD | Pending |
| CHAL-05 | TBD | Pending |
| CHAL-06 | TBD | Pending |

**Coverage:**
- v3.2 requirements: 17 total
- Mapped to phases: 0
- Unmapped: 17 ⚠️

---
*Requirements defined: 2026-01-25*
*Last updated: 2026-01-25 after initial definition*
