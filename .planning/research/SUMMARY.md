# Project Research Summary

**Project:** PiPi - AI-powered presentation tool for teachers
**Domain:** Browser-based dual-monitor presentation system
**Researched:** 2026-01-18
**Confidence:** HIGH

## Executive Summary

Building a reliable dual-monitor presentation system in a browser requires solving three problems: (1) launching a second window without triggering popup blockers, (2) synchronizing state between windows, and (3) optionally placing the window on the correct display. The current PiPi implementation's popup issues stem from calling `window.open()` inside a `useEffect` rather than directly in a click handler, causing browsers to block it as an untrusted popup. This is fixable without major architectural changes.

The recommended approach is **progressive enhancement**: build a robust BroadcastChannel-based sync system that works everywhere, then add Window Management API features for Chromium users (~30% of users get automatic display targeting). The student view should be a standalone route (`/student`) that loads its own styles, not an injected portal. This architecture avoids popup blockers entirely when users manually open the URL, and survives window refreshes.

The primary risks are: (1) popup blockers silently breaking the feature if user activation is lost, (2) non-Chromium users cannot auto-target displays so manual positioning is required, and (3) teachers may deny permission prompts without understanding them. Mitigation requires synchronous window opening in click handlers, graceful fallbacks with clear instructions, and permission priming UI before browser prompts.

## Key Findings

### Recommended Stack

No additional packages are needed—all required functionality uses native browser APIs. The stack consists of three complementary technologies that provide full browser coverage through progressive enhancement.

**Core technologies:**
- **Window Management API**: Auto-detect displays and position windows — Chromium only (Chrome 111+, Edge 111+), provides the "magic" experience
- **BroadcastChannel API**: Cross-window state synchronization — 95.8% browser support (Baseline 2022), simple and reliable
- **window.open() with user gesture**: Universal window creation — 100% browser support, but requires manual positioning as fallback

**Critical requirement:** `window.open()` MUST be called synchronously within a click handler. The current `useEffect`-based approach loses user activation context and will be blocked by Arc, Safari, and privacy-focused browsers.

### Expected Features

**Must have (table stakes):**
- Separate teacher/student displays that sync reliably
- Speaker notes visible to presenter only
- Current and next slide preview in presenter view
- Keyboard navigation (arrows, space, Page Up/Down for clickers)
- Progressive bullet reveal synchronized across windows
- Timer/clock display in presenter view (MISSING)
- Graceful exit without losing state

**Should have (competitive):**
- Auto display detection for Chromium users
- One-click "Present on [Display Name]" when API available
- Presenter remote/clicker support (Page Up/Down)
- Recovery when student window is closed and reopened

**Defer (v2+):**
- Annotation/drawing tools (anti-feature, PowerPoint territory)
- Video/audio embedding (scope creep)
- Custom transitions/animations (diminishing returns)
- Session recording (other tools do this better)

### Architecture Approach

The architecture should use a hybrid Portal + BroadcastChannel pattern. React Portal provides automatic state sharing through the component tree during normal operation, while BroadcastChannel provides resilience for reconnection scenarios and works even if the window reference is lost. The student view should be a standalone route (`/student`) that loads its own CSS, eliminating style injection complexity.

**Major components:**
1. **PresentationController** — Owns state (currentIndex, visibleBullets), orchestrates sync via BroadcastChannel
2. **StudentWindowManager** — Handles window lifecycle, style sync, display detection with graceful fallback
3. **TeacherView** — Controls, notes, previews in main window
4. **StudentView** — Pure presentation component, receives state via props/channel

### Critical Pitfalls

1. **Popup blockers silently block window.open()** — Call `window.open()` synchronously in click handler, never in `useEffect`. Detect `null` return and show instructions.

2. **Window reference lost after open** — Use BroadcastChannel for all communication instead of relying on window references. Implement heartbeat/ping to detect disconnection.

3. **Window Management API only works in Chromium** — Feature-detect with `'getScreenDetails' in window`, provide manual positioning fallback for Firefox/Safari with clear "drag to projector" instructions.

4. **Teachers confused by permission prompts** — Show explanation UI ("permission priming") before browser prompt. Provide recovery instructions when permission denied.

5. **Fullscreen exits unexpectedly** — Design student view to look good at any size, not just fullscreen. Add "restore fullscreen" button that appears when fullscreen is lost.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation (Popup Fix + Communication)
**Rationale:** The popup blocker issue is blocking all dual-window functionality. This must be fixed first. BroadcastChannel communication provides the foundation for everything else.
**Delivers:** Working dual-window with reliable sync
**Addresses:** Table stakes—separate teacher/student displays, sync between windows
**Avoids:** Pitfalls 1 (popup blockers), 2 (lost window reference), 11 (BroadcastChannel memory leaks), 12 (style copying fails)

Key tasks:
- Move `window.open()` into click handler (synchronous)
- Create `/student` route as standalone view with its own CSS
- Implement BroadcastChannel sync service with proper cleanup
- Add popup blocked detection with user-friendly fallback (show URL to open manually)
- Add heartbeat mechanism for connection status

### Phase 2: Window Management Enhancement
**Rationale:** After basic dual-window works everywhere, add Chromium-only enhancements for automatic display targeting. Non-Chromium users continue using Phase 1 functionality.
**Delivers:** Auto-detect projector, one-click display targeting for Chrome/Edge users
**Uses:** Window Management API with feature detection
**Avoids:** Pitfall 3 (browser support gap), 4 (permission confusion), 8 (screen position unreliability)

Key tasks:
- Add feature detection for Window Management API
- Create permission priming UI explaining why permission is needed
- Implement `getScreenDetails()` to find secondary displays
- Add display picker UI when multiple externals detected
- Graceful fallback with "drag to projector" instructions

### Phase 3: UX Polish
**Rationale:** With reliable dual-window working, add quality-of-life features that teachers expect from presentation tools.
**Delivers:** Timer, clicker support, fullscreen management, next slide preview
**Addresses:** Missing table stakes (timer), should-haves (clicker, preview)
**Avoids:** Pitfall 5 (fullscreen exit), 9 (resolution mismatch), 10 (focus stealing)

Key tasks:
- Add elapsed timer to presenter view header
- Add Page Up/Down keyboard support for presenter remotes
- Add next slide visual preview thumbnail
- Add "restore fullscreen" button when fullscreen exits
- Design student view responsively for various projector resolutions

### Phase Ordering Rationale

- **Phase 1 before Phase 2:** Window Management API is useless if the basic popup doesn't work. Fix the foundation first.
- **Phase 2 before Phase 3:** Display targeting improves the core dual-window experience; timer/clicker are conveniences.
- **BroadcastChannel in Phase 1:** This is the communication backbone. Everything else depends on reliable cross-window sync.
- **Standalone student route in Phase 1:** Eliminates multiple pitfalls (style copying, popup recovery) and enables manual URL fallback when popups blocked.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** BroadcastChannel message protocol design—define message types and state recovery flow before implementation
- **Phase 2:** Window Management API permission flow—test actual browser behavior for permission priming

Phases with standard patterns (skip research-phase):
- **Phase 3:** Timer, keyboard shortcuts, fullscreen handling—all well-documented, established patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All APIs verified via MDN, Chrome DevDocs, Can I Use |
| Features | HIGH | Verified against PowerPoint, Google Slides, reveal.js documentation |
| Architecture | HIGH | BroadcastChannel well-documented; Portal pattern established; Window Management API has Chrome DevRel examples |
| Pitfalls | HIGH | Root cause of popup issue identified via MDN User Activation docs; all pitfalls sourced from official documentation |

**Overall confidence:** HIGH

### Gaps to Address

- **Safari user activation timing:** Safari has stricter ~1 second window vs Chrome/Firefox ~5 seconds. May need testing on actual Safari to validate timing assumptions.
- **React 18+ portal quirks:** Some community reports of undocumented behavior with portals to external windows. Monitor during implementation.
- **CSS-in-JS edge cases:** Current app uses Tailwind CDN which simplifies style handling, but if build tooling changes, style injection may need revisiting.

## Sources

### Primary (HIGH confidence)
- [MDN: Window Management API](https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API)
- [MDN: BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)
- [MDN: User Activation](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation)
- [MDN: window.open()](https://developer.mozilla.org/en-US/docs/Web/API/Window/open)
- [Chrome Developers: Window Management](https://developer.chrome.com/docs/capabilities/web-apis/window-management)
- [Can I Use: BroadcastChannel](https://caniuse.com/broadcastchannel) — 95.8% global support
- [Can I Use: window-management](https://caniuse.com/mdn-api_permissions_permission_window-management) — ~30% global support

### Secondary (MEDIUM confidence)
- [Microsoft Support: PowerPoint Presenter View](https://support.microsoft.com/en-us/office/use-presenter-view-in-powerpoint-fe7638e4-76fb-4349-8d81-5eb6679f49d7)
- [Google Docs Editors Help: Present Slides](https://support.google.com/docs/answer/1696787)
- [reveal.js: Speaker View](https://revealjs.com/speaker-view/)
- [web.dev: Permission UX](https://web.dev/push-notifications-permissions-ux/)
- [React: createPortal](https://react.dev/reference/react-dom/createPortal)

### Tertiary (LOW confidence)
- Community reports of React 18 portal behavior in external windows — needs validation during implementation

---
*Research completed: 2026-01-18*
*Ready for roadmap: yes*
