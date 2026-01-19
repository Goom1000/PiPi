# Phase 7: Branding - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace LessonLens branding with PiPi identity throughout the app. This includes header logo, browser tab title, favicon, and ResourceHub watermark. No new features — purely visual identity swap.

</domain>

<decisions>
## Implementation Decisions

### Logo placement & sizing
- Logo only in header, no "PiPi" text beside it
- Position: far left (same location as current LessonLens icon/text)
- Size: match current icon height (~24-32px)
- Logo is not clickable — purely visual

### Brand colors & typography
- Keep all current colors — no color palette changes
- Keep all current fonts — no typography changes
- This is a logo/name swap, not a visual redesign

### ResourceHub watermark
- Replace text watermark with small logo image
- Not "PiPi" text, actual logo graphic

### Browser tab
- Page title: "PiPi"
- Favicon: yes, update to PiPi branding
- Derive favicon from main logo (crop/resize)

### Logo assets
- Source: JPEG file (user will provide)
- Background removal: Claude handles via CSS/tooling
- Favicon: derived from main logo, not separate file

### Claude's Discretion
- Exact technique for JPEG background handling (CSS mix-blend-mode, or convert to PNG)
- Favicon sizing and format (16x16, 32x32, ICO vs PNG)
- Watermark logo size in ResourceHub

</decisions>

<specifics>
## Specific Ideas

- Logo should feel the same size as the current icon, not bigger or more prominent
- Watermark should be subtle like current one, just using logo instead of text

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-branding*
*Context gathered: 2026-01-19*
