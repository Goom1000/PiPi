# Phase 3: Resilience & Polish - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Presentation survives interruptions and supports presenter convenience features. This includes recovery from student window disconnection, visual connection status, session persistence across refresh, keyboard navigation for presenter remotes, and next slide preview for the teacher.

</domain>

<decisions>
## Implementation Decisions

### Connection Indicator
- Separate status chip (not integrated into the button)
- Icon + text hybrid format: "● Connected" / "○ Disconnected"
- Non-interactive (pure status display, no click action)
- Position: Claude's discretion based on layout

### Recovery Flow
- Button re-enables immediately when student window closes
- Reopening resumes at current teacher position (not slide 1)
- Teacher page refresh reconnects automatically to existing student window via BroadcastChannel
- Brief toast/notification shown on successful reconnect (auto-dismiss)

### Keyboard Navigation
- Page Up/Down + Arrow keys (Left/Right) for slide navigation
- Global scope: keys work regardless of where focus is on the page
- Escape key closes the student window remotely
- Hover tooltips on nav buttons show keyboard shortcuts

### Next Slide Preview
- Toggleable via button (not always visible)
- Shows "End of presentation" placeholder when on last slide
- Position and size: Claude's discretion based on layout

### Claude's Discretion
- Status chip positioning within the UI
- Preview thumbnail size and exact placement
- Toast notification styling and duration
- Tooltip styling and exact wording

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

*Phase: 03-resilience-polish*
*Context gathered: 2026-01-18*
