# Phase 1: Drag, Resize & Float - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Teacher can move and resize the preview window freely, and it stays above all other UI elements. This phase delivers core interaction only — snap-to-grid and persistence are Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Drag interaction
- Drag from anywhere on the window (no dedicated handle bar)
- Move cursor (4-way arrow) on hover to indicate draggability
- Reduce opacity slightly (~80%) while being dragged
- No drag threshold — immediate response when user starts dragging

### Resize handles
- Corner handles only (four corners for diagonal resizing)
- Handles appear on hover (not always visible, not invisible)
- Maintain slide aspect ratio during resize (no free stretch)
- Minimum size ~200px to keep content readable

### Float appearance
- Border only, no drop shadow
- Accent color for the border (stands out, not subtle gray)
- Match existing UI style for rounded corners
- No "Next" label — clean window, context is obvious from content

### Edge behavior
- Fully constrained to viewport (cannot drag any part off-screen)
- Automatically push back into view if browser window shrinks
- Slight resistance/magnetism near viewport edges (easier to park in corners)
- Initial position: keep current location in existing UI layout

### Claude's Discretion
- Exact opacity value during drag (around 80%)
- Precise edge magnetism threshold (pixels)
- Handle size and appearance details
- Animation timing for push-back behavior

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for drag/resize implementation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-drag-resize-float*
*Context gathered: 2026-01-18*
