# Technology Stack: Dual-Monitor Presentation System

**Project:** PiPi - AI-powered presentation tool for teachers
**Researched:** 2026-01-18
**Research Focus:** Browser APIs for dual-monitor presenter/student view

---

## Executive Summary

Browser-based dual-monitor presentation is a **partially solved problem** in 2025/2026. The ideal solution (Window Management API) exists but has **Chromium-only support (~30% of users)**. A production-ready implementation requires a **progressive enhancement strategy**: use advanced APIs when available, fall back gracefully when not.

**Key finding:** The current `window.open()` approach in PresentationView.tsx is not fundamentally broken---it works when called with user gesture. The "popup blocker" issue likely stems from timing (async operations consuming user activation) or missing user gesture context.

---

## Recommended Stack

### Primary API: Window Management API (Chromium)

| Property | Value |
|----------|-------|
| **API** | Window Management API |
| **Key Methods** | `getScreenDetails()`, `window.open()` with screen coords, `requestFullscreen({ screen })` |
| **Permission** | `window-management` |
| **Browser Support** | Chrome 111+, Edge 111+, Opera 97+ |
| **Global Coverage** | ~30% |
| **Confidence** | HIGH (verified via [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API), [Can I Use](https://caniuse.com/mdn-api_permissions_permission_window-management)) |

**Why use it:**
- Purpose-built for this exact use case (slideshow presenter views)
- Enumerate all connected displays with position/size
- Open windows on specific screens automatically
- Fullscreen on secondary monitor with one API call
- Event-based detection when screens connect/disconnect

**Implementation pattern:**
```typescript
// Feature detection
if ('getScreenDetails' in window) {
  // Request permission and get screen info
  const screenDetails = await window.getScreenDetails();
  const secondaryScreen = screenDetails.screens.find(s => !s.isPrimary);

  if (secondaryScreen) {
    // Open student window on secondary monitor
    const studentWindow = window.open(
      '/student-view',
      'student',
      `left=${secondaryScreen.availLeft},top=${secondaryScreen.availTop},width=${secondaryScreen.availWidth},height=${secondaryScreen.availHeight}`
    );

    // Or go fullscreen on secondary
    await document.body.requestFullscreen({ screen: secondaryScreen });
  }
}
```

### Fallback API: Enhanced window.open() (All Browsers)

| Property | Value |
|----------|-------|
| **API** | `window.open()` with user gesture |
| **Browser Support** | All browsers (96%+) |
| **Constraint** | Must be called within 5 seconds of user click |
| **Constraint** | Cannot auto-detect secondary monitor |
| **Confidence** | HIGH (verified via [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/open)) |

**Why this is the universal fallback:**
- Works in ALL browsers
- User manually drags window to secondary monitor
- Still enables presenter/student split---just with manual positioning

**Critical: User Activation Requirements**

The popup blocker blocks `window.open()` when called:
1. Without any user gesture (automatic)
2. More than 5 seconds after user gesture (Chrome/Firefox)
3. More than 1 second after user gesture (Safari---stricter)
4. After another "activation-consuming API" was called (e.g., `navigator.share()`)

**Current code issue identified:**
```typescript
// Current PresentationView.tsx line 15
const win = window.open('', '', 'width=800,height=600,left=200,top=200');
```

This is called inside `useEffect` which runs AFTER render---potentially losing user activation context. The fix is to open the window synchronously in the click handler, then populate it.

### Cross-Window Communication: BroadcastChannel API

| Property | Value |
|----------|-------|
| **API** | BroadcastChannel API |
| **Browser Support** | Baseline since March 2022 (all modern browsers) |
| **Constraint** | Same-origin only |
| **Confidence** | HIGH (verified via [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)) |

**Why use it over postMessage:**
- Simpler API (no need to maintain window references)
- Works across any number of windows/tabs
- Automatic cleanup when channel closed
- Structured clone for complex data

**Implementation pattern:**
```typescript
// In presenter window
const channel = new BroadcastChannel('pipi-presentation');
channel.postMessage({
  type: 'SLIDE_CHANGE',
  slideIndex: 5,
  visibleBullets: 2
});

// In student window
const channel = new BroadcastChannel('pipi-presentation');
channel.onmessage = (event) => {
  if (event.data.type === 'SLIDE_CHANGE') {
    setCurrentSlide(event.data.slideIndex);
    setVisibleBullets(event.data.visibleBullets);
  }
};
```

### Alternative Considered: Document Picture-in-Picture API

| Property | Value |
|----------|-------|
| **API** | Document Picture-in-Picture API |
| **Key Method** | `documentPictureInPicture.requestWindow()` |
| **Browser Support** | Chrome 116+ only |
| **Global Coverage** | ~25% |
| **Confidence** | MEDIUM |

**Why NOT recommended as primary:**
- Even narrower browser support than Window Management
- Creates small floating window, not full secondary display
- Cannot be positioned or navigated by website
- Better suited for video players, not full presentation views

**Potential use case:** Teacher's floating mini-preview of student view while working in other apps.

### Alternative Considered: Presentation API

| Property | Value |
|----------|-------|
| **API** | Presentation API |
| **Browser Support** | Chromium only, primarily for Cast/wireless displays |
| **Confidence** | LOW |

**Why NOT recommended:**
- Designed for wireless displays (Chromecast, Miracast)
- Not for wired secondary monitors
- Complex setup for simple dual-monitor use case
- Cast receivers often have limited web capabilities

---

## Browser Compatibility Matrix

| API | Chrome | Edge | Firefox | Safari | Use Case |
|-----|--------|------|---------|--------|----------|
| Window Management | 111+ | 111+ | NO | NO | Auto-detect screens, place windows |
| window.open() | Yes | Yes | Yes | Yes | Manual dual-window (fallback) |
| BroadcastChannel | Yes | Yes | Yes (38+) | Yes (15.4+) | Window sync |
| Fullscreen | 71+ | 79+ | 64+ | 16.4+ | Student view fullscreen |
| postMessage | Yes | Yes | Yes | Yes | Window communication (alt) |
| Doc PiP | 116+ | 116+ | NO | NO | Floating preview |

**Source:** [Can I Use](https://caniuse.com), [MDN](https://developer.mozilla.org)

---

## Recommended Architecture

### Progressive Enhancement Pattern

```
User clicks "Launch Student View"
        |
        v
[Check: 'getScreenDetails' in window?]
        |
    YES |                NO
        v                 v
[Request window-management   [Open window.open() immediately]
 permission]                  |
        |                     v
        v              [Show instructions:
[Get screen details]    "Drag to secondary monitor"]
        |
        v
[Find secondary screen]
        |
    FOUND               NOT FOUND
        v                   v
[Open window on        [Open window centered,
 secondary screen]      prompt user to drag]
        |                   |
        v                   v
[Connect BroadcastChannel for sync]
```

### Component Architecture

```
/src
  /hooks
    useWindowManagement.ts    # Feature detection, permission handling
    useBroadcastChannel.ts    # Cross-window state sync
    useStudentWindow.ts       # Student window lifecycle
  /components
    PresentationView.tsx      # Teacher's presenter console
    StudentView.tsx           # Student display (separate route)
    StudentWindowLauncher.tsx # Button with proper user gesture handling
  /contexts
    PresentationContext.tsx   # Shared state (current slide, bullets)
```

---

## What NOT to Use

### 1. Synchronous window.open() in useEffect

**Why:** Loses user activation context, triggers popup blocker.

**Instead:** Open window in click handler, populate content after.

### 2. React Portal to external window (current approach)

**Why:** Creates DOM directly in `window.open()` result. Fragile, loses styles, complex lifecycle.

**Instead:** Open student view as separate route (`/student`), sync via BroadcastChannel.

### 3. localStorage for cross-window sync

**Why:** Storage events don't fire in the same tab, requires workarounds. Synchronous, can block UI.

**Instead:** BroadcastChannel is purpose-built for this.

### 4. Presentation API for wired monitors

**Why:** Designed for wireless casting (Chromecast/AirPlay), not HDMI/DisplayPort.

**Instead:** Window Management API or window.open().

---

## Installation

No additional packages required---all APIs are native browser APIs.

**Optional helper libraries:**

```bash
# If you want React hooks for BroadcastChannel
npm install react-broadcast-channel
# or
npm install @broadcaster/react
```

**Recommendation:** Write custom hooks. The API is simple enough that third-party libraries add more complexity than value.

---

## Implementation Priorities

### Phase 1: Fix Current Popup Blocker Issue (Quick Win)

1. Move `window.open()` call into click handler (synchronous)
2. Remove `useEffect` wrapper for window creation
3. Test across Chrome, Firefox, Safari

### Phase 2: Add BroadcastChannel Sync

1. Create `useBroadcastChannel` hook
2. Create `/student` route with its own component
3. Sync slide state across windows
4. Remove React Portal approach

### Phase 3: Add Window Management API (Chromium Enhancement)

1. Add feature detection
2. Add permission request UI
3. Auto-detect and use secondary monitor
4. Graceful fallback for Firefox/Safari

### Phase 4: Polish UX

1. Add "Drag to secondary monitor" instructions for fallback
2. Add screen detection status indicator
3. Handle screen connect/disconnect events
4. Add fullscreen toggle for student window

---

## Confidence Assessment

| Recommendation | Confidence | Basis |
|----------------|------------|-------|
| BroadcastChannel for sync | HIGH | MDN, widely supported since 2022 |
| Window Management API for Chromium | HIGH | MDN, Chrome DevRel docs, Can I Use |
| window.open() fallback | HIGH | Universal browser support, well-documented |
| User activation timing fix | HIGH | MDN User Activation docs, Chrome DevRel |
| Avoid Presentation API | MEDIUM | Limited to wireless displays per spec |
| Avoid Doc PiP for main view | MEDIUM | Wrong UX pattern for full-screen presenter |

---

## Sources

### Official Documentation (HIGH confidence)
- [MDN: Window Management API](https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API)
- [MDN: Using the Window Management API](https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API/Using)
- [MDN: Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)
- [MDN: User Activation](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation)
- [MDN: Transient Activation](https://developer.mozilla.org/en-US/docs/Glossary/Transient_activation)
- [MDN: window.open()](https://developer.mozilla.org/en-US/docs/Web/API/Window/open)
- [Chrome for Developers: Window Management](https://developer.chrome.com/docs/capabilities/web-apis/window-management)

### Browser Compatibility (HIGH confidence)
- [Can I Use: window-management permission](https://caniuse.com/mdn-api_permissions_permission_window-management)
- [Can I Use: Fullscreen API](https://caniuse.com/fullscreen)

### Community Resources (MEDIUM confidence)
- [DEV.to: BroadcastChannel in React](https://dev.to/sachinchaurasiya/how-to-use-broadcast-channel-api-in-react-5eec)
- [Medium: Popup Blocking Solutions](https://muhammadamas.medium.com/javascript-solution-overcoming-popup-blocking-issues-in-browser-ea1b7c21aaad)
