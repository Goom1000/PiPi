# Phase 1: Settings & API Key UI - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

User can configure their AI provider and API key with clear setup guidance. This phase delivers the settings panel UI, API key entry/validation, provider selection, and setup instructions. Multi-provider AI integration is Phase 2; this phase focuses on the configuration interface.

</domain>

<decisions>
## Implementation Decisions

### Panel access & layout
- Gear icon in header right (standard position, next to other header controls)
- Opens as modal dialog (centered overlay, dims background, clear focus)
- Stacked vertical layout: provider dropdown above, API key field below, full width
- Explicit Save/Cancel buttons (user clicks Save to apply, Cancel to discard)

### API key entry experience
- Hidden by default with eye icon toggle to reveal (password field behavior)
- Test button with inline status feedback (success/error message below field)
- Validation only on test button click (no automatic validation on blur)
- Require successful test before saving (can only save after key passes validation)

### Setup instructions presentation
- Collapsible accordion (click to expand/collapse instructions section)
- Per-provider instructions that update when provider changes (e.g., "Go to Google AI Studio...")
- Button-style links to provider API pages (prominent buttons like "Open Google AI Studio →")
- Show cost estimates per provider (approximate cost per slide/quiz generation)

### Security messaging
- "Stored locally only" as subtle footnote at bottom of modal
- "Clear all data" at bottom of modal in danger zone section
- Type-to-confirm for clear data (user must type 'delete' or similar to proceed)
- Clear data removes settings only (keeps current presentation)

### Claude's Discretion
- Exact modal width and padding
- Color scheme for success/error states
- Accordion animation timing
- Cost estimate formatting and values
- Danger zone styling

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-settings-api-key-ui*
*Context gathered: 2026-01-19*
