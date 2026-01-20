# Phase 12: CSS Layout Fixes - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix CSS layout bugs in flowchart rendering and teacher view slide display. Flowcharts have misaligned arrows and wasted vertical space. Teacher view slide display is cut off due to teleprompter and controls taking space. Student view is unaffected.

</domain>

<decisions>
## Implementation Decisions

### Flowchart Arrow Alignment
- Arrows connect to center of entire box (vertical midpoint of box container)
- Arrows have arrowheads showing direction
- Arrow color and thickness match the flowchart box borders
- Claude's discretion: horizontal vs angled arrows when boxes have different heights

### Flowchart Vertical Spacing
- All boxes in a row stretch to equal height (match tallest box)
- Content is vertically centered within stretched boxes
- Consistent padding around flowchart — don't stretch boxes to fill container
- Claude's discretion: horizontal spacing adjustments if needed for visual consistency

### Teacher View Slide Display
- Main slide display in teacher view is getting cut off (top and bottom) due to teleprompter/controls
- Scale slide to fit entirely — teacher needs to see complete slide content
- Preserve aspect ratio (letterbox if needed, no distortion)
- Student view is fine — no changes needed there

### Claude's Discretion
- Arrow angle behavior with varying box heights
- Horizontal spacing tweaks if needed
- Exact scaling implementation for teacher view

</decisions>

<specifics>
## Specific Ideas

- Teacher view cutoff happens because teleprompter and extra teacher features take up screen space
- Student view renders correctly since it has no teleprompter overlay
- Flowchart issues affect both views equally

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-css-layout-fixes*
*Context gathered: 2026-01-20*
