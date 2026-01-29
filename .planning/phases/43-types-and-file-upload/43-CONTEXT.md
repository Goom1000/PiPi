# Phase 43: Types and File Upload - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Teachers can upload existing resources (worksheets, handouts) in common formats (PDF, images, Word) for AI enhancement. Includes file validation, size/page limits, and preview thumbnail. AI analysis and enhancement are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Upload interaction
- Dedicated panel in resource sidebar, always visible when editing resources
- Classic dashed border drop zone with upload cloud icon and "Drag files here" text
- Progress bar replaces drop zone content during upload
- Multiple files allowed — can select/drop multiple files, processed as separate resources

### Claude's Discretion
- Error presentation style (inline vs toast vs modal for validation errors)
- Preview thumbnail size and placement
- Visual indicators for different file types (PDF vs image vs Word)
- Browse button styling and placement within drop zone

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for error handling and preview display.

</specifics>

<deferred>
## Deferred Ideas

- **Slide alignment indicator** — Enhanced resources should display which slide number they align with, so teachers know which resource to use at which point in the lesson. (Relevant to Phase 45/46: Enhancement and Preview UI)

</deferred>

---

*Phase: 43-types-and-file-upload*
*Context gathered: 2026-01-29*
