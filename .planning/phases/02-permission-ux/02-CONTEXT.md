# Phase 2: Permission UX - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Teacher always knows the current auto-placement capability and can act on it. This phase delivers UI that communicates permission state clearly — through button labels, toasts, and recovery guidance. The teacher needs to understand where their student view will open and have clear paths to fix permission issues.

</domain>

<decisions>
## Implementation Decisions

### Button labels & states
- When permission granted: "Launch → External Display" (friendly label, not raw display name)
- When permission prompt: "Launch Student View" (generic, permission requested on click)
- When permission denied: Button shows warning icon, recovery info appears nearby
- Use friendly label "External Display" rather than raw device names like "DELL U2718Q"

### Permission request UI
- Inline near launch button (not in settings or modal)
- Only visible when relevant (prompt or denied state), hidden when granted
- Styled as text link: "Enable auto-placement"
- No pre-prompt explanation — click triggers browser prompt immediately

### Launch feedback
- Toast confirms where window opened: "Opened on External Display" or "Opened on this screen"
- Duration: 5 seconds
- Auto-dismiss only, no close button
- Claude's discretion: whether to differentiate auto-placed vs manual fallback in message

### Denied recovery
- Inline text + link format: "Permission denied. Reset in browser settings" with help link
- Browser-specific guidance: detect browser and show relevant instructions
- Help link opens in-app modal with step-by-step instructions for current browser
- Claude's discretion: whether to include screenshots in the modal

### Claude's Discretion
- Toast message wording for auto-placed vs manual scenarios
- Whether recovery modal includes browser UI screenshots
- Exact spacing, colors, and visual styling of all elements

</decisions>

<specifics>
## Specific Ideas

- Button format with arrow: "Launch → External Display"
- Warning icon on button when denied (not text change)
- Permission link should be subtle (text link, not button)
- 5-second toast is firm requirement

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-permission-ux*
*Context gathered: 2026-01-18*
