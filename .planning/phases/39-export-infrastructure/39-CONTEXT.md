# Phase 39: Export Infrastructure - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable teachers to export selected slides as A4 PDFs for classroom Working Wall display. This phase covers the export button trigger, modal with Quick Export vs AI Poster options, preview of selected slides, and Quick Export functionality that preserves exact slide content. AI Poster transformation is a separate phase (40).

</domain>

<decisions>
## Implementation Decisions

### Export button placement
- Location: In toolbar, grouped with selection controls (Select All/Deselect All)
- Label: "Export for Working Wall" (full descriptive text, no icon)
- Visibility: Always visible, disabled when no slides selected (no tooltip on disabled state)
- Behavior: Opens modal immediately when clicked (no loading delay)
- No keyboard shortcut
- No selection count on button (count already shows elsewhere in toolbar)

### Modal design & flow
- Claude's discretion on:
  - How to present Quick Export vs AI Poster mode options (cards, radio buttons, tabs)
  - Modal size (based on content needs)
  - Modal header text
  - Closing behavior (X button, click outside, Escape key)
  - Loading state presentation

### Preview presentation
- Can deselect slides directly in the preview (X button or similar on each preview)
- Removing slides in modal syncs to main selection state (changes persist after closing)
- Claude's discretion on:
  - Preview layout (grid, horizontal row, numbered list)
  - Empty preview behavior when all slides removed

### PDF layout & format
- Claude's discretion on:
  - Slides per page (1 per page recommended for wall display)
  - Headers/footers
  - A4 orientation (portrait vs landscape)
  - Filename format

### Claude's Discretion
- Button visual style (match toolbar patterns)
- Button position within toolbar
- Loading state UX
- Accessibility (aria-labels)
- Modal size and layout
- Preview presentation format
- All PDF formatting decisions

</decisions>

<specifics>
## Specific Ideas

- Button should feel integrated with existing selection controls, not a separate action
- Modal opens instantly (no perceived delay)
- Selection changes in modal persist after closing — single source of truth

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 39-export-infrastructure*
*Context gathered: 2026-01-27*
