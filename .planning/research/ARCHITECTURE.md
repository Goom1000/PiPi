# Architecture Patterns: Browser-Based Dual-Monitor Presentation System

**Domain:** Multi-window state synchronization for presentation apps
**Researched:** 2026-01-18
**Confidence:** HIGH (BroadcastChannel, React Portals) | MEDIUM (Window Management API - experimental)

## Executive Summary

Building a dual-monitor presentation system in a browser-based React app requires solving three core problems: (1) state synchronization between teacher and student windows, (2) window lifecycle management, and (3) cross-window styling. The current PiPi implementation uses `window.open()` + `createPortal()` which provides shared state but has CSS injection issues and no display targeting. The recommended architecture uses **BroadcastChannel for state sync** with the existing portal pattern, plus graceful enhancement with the **Window Management API** for display placement.

## Current Architecture Analysis

### What PiPi Has Today

```
App.tsx (centralized state)
    |
    +-- PresentationView.tsx
            |
            +-- Teacher View (main window)
            |       - Slide preview
            |       - Speaker notes
            |       - Controls
            |
            +-- StudentWindow (createPortal to window.open)
                    - SlideContentRenderer
                    - Shares state via React tree
```

**Strengths:**
- State is already centralized in PresentationView
- `createPortal` means child window IS part of React tree - props flow naturally
- `currentIndex` and `visibleBullets` already control both views

**Weaknesses:**
1. CSS injection is manual and fragile (copying stylesheets in useEffect)
2. No awareness of which monitor to place student window on
3. Window positioning uses hardcoded `width=800,height=600,left=200,top=200`
4. If student window is opened before styles load, rendering breaks
5. No recovery if student window is accidentally closed and reopened

## Recommended Architecture

### Component Boundaries

```
+------------------------------------------+
|              App.tsx                      |
|  (Global state: slides, lessonTitle)     |
+------------------------------------------+
              |
              v
+------------------------------------------+
|       PresentationController.tsx         |  <-- NEW: Orchestrates presentation
|  - Owns: currentIndex, visibleBullets    |
|  - Owns: BroadcastChannel                |
|  - Owns: Window lifecycle                |
+------------------------------------------+
       |                    |
       v                    v
+----------------+  +------------------------+
| TeacherView    |  | StudentWindowManager   |  <-- NEW: Window lifecycle
|  (same window) |  |  - Opens/manages window|
|  - Controls    |  |  - Injects styles      |
|  - Notes       |  |  - Handles close/reopen|
+----------------+  +------------------------+
                              |
                              v (createPortal)
                    +------------------------+
                    | StudentView            |
                    |  - SlideContentRenderer|
                    |  - Pure presentation   |
                    +------------------------+
```

### State Synchronization: BroadcastChannel

**Why BroadcastChannel over alternatives:**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| React Portal (current) | Shared state automatically | CSS issues, tight coupling | Keep for rendering |
| BroadcastChannel | 95.8% browser support, simple API, real-time | No state persistence | **Use for sync** |
| SharedWorker | Centralized state, WebSocket sharing | No Safari iOS, complex | Overkill for this |
| localStorage events | Universal support | Disk I/O, hacky, not real-time | Fallback only |

**Recommended Pattern: Portal + BroadcastChannel hybrid**

```typescript
// PresentationController.tsx
const channel = useRef<BroadcastChannel | null>(null);

useEffect(() => {
  channel.current = new BroadcastChannel('pipi-presentation');

  // Listen for messages (for recovery/reconnection)
  channel.current.onmessage = (event) => {
    if (event.data.type === 'STUDENT_READY') {
      // Student window reconnected, send current state
      channel.current?.postMessage({
        type: 'STATE_SYNC',
        payload: { currentIndex, visibleBullets }
      });
    }
  };

  return () => channel.current?.close();
}, []);

// Broadcast state changes
useEffect(() => {
  channel.current?.postMessage({
    type: 'STATE_UPDATE',
    payload: { currentIndex, visibleBullets }
  });
}, [currentIndex, visibleBullets]);
```

**Why keep createPortal too:**
- Portal gives you automatic React tree benefits (context, event bubbling)
- BroadcastChannel provides recovery when window reopens
- Belt-and-suspenders approach: Portal for normal operation, BroadcastChannel for resilience

### Window Management: Display Detection

**Browser Support Reality:**
- Window Management API (`getScreenDetails`): 80% support (Chromium only - no Firefox, no Safari)
- Fallback to basic `window.open()` with user-positioned window

**Recommended: Progressive Enhancement**

```typescript
// StudentWindowManager.tsx
interface ScreenPlacement {
  left: number;
  top: number;
  width: number;
  height: number;
}

async function getStudentWindowPlacement(): Promise<ScreenPlacement> {
  // Feature detect
  if ('getScreenDetails' in window) {
    try {
      const screenDetails = await window.getScreenDetails();

      // Find non-primary screen (external monitor)
      const externalScreen = screenDetails.screens.find(s => !s.isPrimary);

      if (externalScreen) {
        return {
          left: externalScreen.left,
          top: externalScreen.top,
          width: externalScreen.availWidth,
          height: externalScreen.availHeight
        };
      }
    } catch (err) {
      console.warn('Window Management permission denied:', err);
    }
  }

  // Fallback: position to the right of current window
  return {
    left: window.screenX + window.outerWidth + 50,
    top: window.screenY,
    width: 1280,
    height: 720
  };
}
```

### CSS Injection Strategy

**Current Problem:** StyleSheets are copied once at window open, but:
1. Tailwind CDN may not be loaded yet
2. Dynamic styles (CSS-in-JS, Tailwind JIT) aren't captured
3. No mechanism to update styles after initial copy

**Recommended: Style Observer Pattern**

```typescript
// StudentWindowManager.tsx
function useStyleSync(externalWindow: Window | null) {
  useEffect(() => {
    if (!externalWindow) return;

    // 1. Copy existing styles
    copyStylesToWindow(externalWindow);

    // 2. Watch for new style additions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'STYLE' || node.nodeName === 'LINK') {
            copyNodeToWindow(node, externalWindow);
          }
        });
      });
    });

    observer.observe(document.head, { childList: true });

    return () => observer.disconnect();
  }, [externalWindow]);
}

function copyStylesToWindow(targetWindow: Window) {
  // Copy link tags (external stylesheets)
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    const clone = targetWindow.document.createElement('link');
    clone.rel = 'stylesheet';
    clone.href = (link as HTMLLinkElement).href;
    targetWindow.document.head.appendChild(clone);
  });

  // Copy inline style tags
  document.querySelectorAll('style').forEach(style => {
    const clone = targetWindow.document.createElement('style');
    clone.textContent = style.textContent;
    targetWindow.document.head.appendChild(clone);
  });

  // Inject Tailwind CDN explicitly
  const tailwind = targetWindow.document.createElement('script');
  tailwind.src = 'https://cdn.tailwindcss.com';
  targetWindow.document.head.appendChild(tailwind);
}
```

## Data Flow Diagram

```
User Input (keyboard/click)
        |
        v
+-------------------+
| PresentationController |
|   currentIndex    |-----> BroadcastChannel.postMessage()
|   visibleBullets  |              |
+-------------------+              |
   |          |                    |
   |          |                    v
   |          |         +-------------------+
   |          |         | StudentWindow     |
   |          |         | (reconnection     |
   |          |         |  recovery only)   |
   |          |         +-------------------+
   |          |
   v          v (createPortal)
+-------+  +-------------+
|Teacher|  | Student     |
| View  |  | View        |
+-------+  +-------------+
```

**Normal flow:** State changes -> React re-render -> Both views update via React tree
**Recovery flow:** Student window reopens -> sends STUDENT_READY -> receives STATE_SYNC

## Build Order (Dependencies)

The components should be built in this order due to dependencies:

### Phase 1: Foundation
1. **BroadcastChannel service** - No dependencies, can be unit tested in isolation
   - Message types definition
   - Channel creation/cleanup
   - Message serialization

2. **Style injection utilities** - No dependencies
   - copyStylesToWindow function
   - MutationObserver setup

### Phase 2: Window Lifecycle
3. **StudentWindowManager** - Depends on: Style injection
   - Window open/close
   - Lifecycle events (beforeunload)
   - Style sync activation

4. **Display detection service** - Independent, can parallel with #3
   - Feature detection
   - Permission handling
   - Fallback calculations

### Phase 3: Integration
5. **PresentationController** - Depends on: BroadcastChannel, StudentWindowManager
   - State management
   - Event handling
   - Channel integration

6. **StudentView** - Depends on: None (pure presentation)
   - Receives props only
   - No internal state

### Phase 4: Enhancement
7. **Display picker UI** - Depends on: Display detection
   - User selects target screen
   - Permission request flow

8. **Recovery mechanisms** - Depends on: All above
   - Reconnection handling
   - State resync

## Component Interface Specifications

### BroadcastChannel Messages

```typescript
type PresentationMessage =
  | { type: 'STATE_UPDATE'; payload: { currentIndex: number; visibleBullets: number } }
  | { type: 'STUDENT_READY' }
  | { type: 'STATE_SYNC'; payload: { currentIndex: number; visibleBullets: number } }
  | { type: 'WINDOW_CLOSING' };
```

### StudentWindowManager Props

```typescript
interface StudentWindowManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onReady: () => void;
  children: React.ReactNode;
  targetScreen?: 'auto' | 'primary' | 'secondary';
}
```

### PresentationController Props

```typescript
interface PresentationControllerProps {
  slides: Slide[];
  initialSlideIndex: number;
  studentNames: string[];
  onExit: () => void;
}

// Internal state
interface PresentationState {
  currentIndex: number;
  visibleBullets: number;
  isStudentWindowOpen: boolean;
  windowStatus: 'closed' | 'opening' | 'open' | 'reconnecting';
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct Window Manipulation from Child
**Problem:** StudentView directly calling `window.close()` or manipulating parent state
**Why bad:** Breaks unidirectional data flow, makes debugging hard
**Instead:** Emit events up through BroadcastChannel or callbacks

### Anti-Pattern 2: Storing State in Both Windows
**Problem:** Duplicating currentIndex in student window's local state
**Why bad:** State divergence, sync bugs
**Instead:** Single source of truth in PresentationController, portal passes props

### Anti-Pattern 3: Synchronous Style Copying
**Problem:** Copying styles synchronously in window.open callback
**Why bad:** Styles may not be loaded yet, race conditions
**Instead:** Use MutationObserver, wait for DOMContentLoaded

### Anti-Pattern 4: Relying Only on Window Management API
**Problem:** Building display selection that requires the API
**Why bad:** 20% of users (Firefox, Safari) get broken experience
**Instead:** Progressive enhancement with graceful fallback

## Patterns to Follow

### Pattern 1: Event-Driven State Updates
```typescript
// Good: Single handler, broadcasts to all consumers
const handleNext = useCallback(() => {
  const newState = calculateNextState(currentIndex, visibleBullets, totalBullets);
  setCurrentIndex(newState.currentIndex);
  setVisibleBullets(newState.visibleBullets);
  // BroadcastChannel handles sync automatically via useEffect
}, [currentIndex, visibleBullets, totalBullets]);
```

### Pattern 2: Defensive Window References
```typescript
// Good: Always check window validity
const postToStudent = useCallback((message: PresentationMessage) => {
  if (studentWindow && !studentWindow.closed) {
    channel.current?.postMessage(message);
  }
}, [studentWindow]);
```

### Pattern 3: Graceful Degradation
```typescript
// Good: Feature detect and provide alternatives
const canTargetDisplay = 'getScreenDetails' in window;

return (
  <Button onClick={openStudentWindow}>
    {canTargetDisplay ? 'Open on External Display' : 'Open Student Window'}
  </Button>
);
```

## Testing Considerations

### Unit Testable Components
- BroadcastChannel service (mock channel)
- Style injection utilities (mock DOM)
- Display detection (mock window.getScreenDetails)
- State calculations (pure functions)

### Integration Test Scenarios
1. Open student window -> verify styles present
2. Navigate slides -> verify both views update
3. Close student window -> verify cleanup
4. Reopen student window -> verify state recovery
5. Navigate while window opening -> verify no race condition

### Manual Test Scenarios
1. Single monitor: Student window positions correctly
2. Dual monitor: Student window targets external (when API supported)
3. Permission denied: Falls back gracefully
4. Rapid navigation: No state desync

---

# Permission Flow Architecture (v1.2 Focus)

**Updated:** 2026-01-18
**Confidence:** HIGH (patterns verified against MDN documentation and React best practices)

## Problem Analysis

### Current Flow (Race Condition)

```
+-------------------------------------------------------------------------+
| CURRENT ARCHITECTURE (Problematic)                                       |
+-------------------------------------------------------------------------+
|                                                                          |
|  PresentationView mounts                                                 |
|         |                                                                |
|         v                                                                |
|  useWindowManagement() called                                            |
|         |                                                                |
|         +---> screen.isExtended check (SYNC) ---> hasMultipleScreens=true|
|         |                                                                |
|         +---> navigator.permissions.query() (ASYNC) ------------+        |
|                                                                 |        |
|  useEffect in PresentationView runs                            |        |
|         |                                                       |        |
|         v                                                       |        |
|  Checks: isSupported && hasMultipleScreens && permissionState  |        |
|         |                                                       |        |
|         v                                                       |        |
|  permissionState is STILL 'unavailable' (initial value)        |        |
|         |                                                       |        |
|         v                                                       |        |
|  Condition FALSE ---> PermissionExplainer NOT shown            |        |
|                                                                 |        |
|                     ... async query completes ...               <--------+
|                                                                 |
|                     permissionState becomes 'prompt'            |
|                                                                 |
|                     BUT useEffect already ran!                  |
|                     UI never shows PermissionExplainer          |
|                                                                 |
+-------------------------------------------------------------------------+
```

### Root Cause

The race condition occurs because:

1. **Initial state is misleading**: `permissionState` starts as `'unavailable'`, which is a valid terminal state (API not supported). The useEffect cannot distinguish between "still loading" and "actually unavailable".

2. **No loading state**: There is no explicit "loading" or "pending" state to gate UI decisions.

3. **Effect runs too early**: The useEffect in PresentationView fires on mount, before the async permission query completes.

4. **No re-run trigger**: When `permissionState` updates from `'unavailable'` to `'prompt'`, the useEffect does run again, but by that time the user may have already clicked "Launch Student" (the button is enabled immediately).

## Recommended Architecture

### Pattern: Explicit Loading State with Gated Interaction

The fix requires introducing an explicit loading state that gates user interaction until permission status is known.

```
+-------------------------------------------------------------------------+
| RECOMMENDED ARCHITECTURE                                                 |
+-------------------------------------------------------------------------+
|                                                                          |
|  +---------------------------------------------------------------+      |
|  | useWindowManagement Hook                                       |      |
|  |                                                                |      |
|  |  States:                                                       |      |
|  |    isLoading: boolean      <-- NEW: true until async completes |      |
|  |    permissionState: 'prompt' | 'granted' | 'denied' | null    |      |
|  |                            <-- CHANGED: null = not yet known   |      |
|  |    hasMultipleScreens: boolean                                 |      |
|  |    secondaryScreen: ScreenTarget | null                        |      |
|  |                                                                |      |
|  |  Initialization:                                               |      |
|  |    isLoading = true                                            |      |
|  |    permissionState = null                                      |      |
|  |                                                                |      |
|  |  After async query:                                            |      |
|  |    isLoading = false                                           |      |
|  |    permissionState = result.state                              |      |
|  |                                                                |      |
|  +---------------------------------------------------------------+      |
|                                                                          |
|  +---------------------------------------------------------------+      |
|  | PresentationView Component                                     |      |
|  |                                                                |      |
|  |  Decision Logic:                                               |      |
|  |                                                                |      |
|  |  if (isLoading) {                                              |      |
|  |    // Don't show permission UI yet                             |      |
|  |    // BUT also don't enable "Launch Student" yet               |      |
|  |  }                                                             |      |
|  |                                                                |      |
|  |  if (!isLoading && hasMultipleScreens &&                       |      |
|  |      permissionState === 'prompt') {                           |      |
|  |    // NOW safe to show PermissionExplainer                     |      |
|  |  }                                                             |      |
|  |                                                                |      |
|  |  "Launch Student" button:                                      |      |
|  |    disabled={isLoading || isConnected}                         |      |
|  |                                                                |      |
|  +---------------------------------------------------------------+      |
|                                                                          |
+-------------------------------------------------------------------------+
```

## Component Structure

### Option A: Gated Loading in Hook (Recommended)

**Modify `useWindowManagement` hook to expose loading state.**

```typescript
export interface UseWindowManagementResult {
  isSupported: boolean;
  hasMultipleScreens: boolean;
  isLoading: boolean;  // NEW: true until permission query completes
  permissionState: 'prompt' | 'granted' | 'denied' | null;  // null = unknown
  secondaryScreen: ScreenTarget | null;
  requestPermission: () => Promise<boolean>;
}
```

**Advantages:**
- Single source of truth for permission state
- Encapsulates async complexity in the hook
- Consumers don't need to understand the async timing

**Hook internal changes:**

```typescript
function useWindowManagement(): UseWindowManagementResult {
  const [isSupported] = useState(() => 'getScreenDetails' in window);
  const [hasMultipleScreens, setHasMultipleScreens] = useState(false);
  const [isLoading, setIsLoading] = useState(true);  // Start loading
  const [permissionState, setPermissionState] =
    useState<'prompt' | 'granted' | 'denied' | null>(null);  // null = unknown

  // ... existing screen detection logic ...

  useEffect(() => {
    if (!isSupported) {
      setIsLoading(false);
      setPermissionState(null);  // null indicates "not applicable"
      return;
    }

    if (!hasMultipleScreens) {
      setIsLoading(false);
      setPermissionState(null);
      return;
    }

    // Query permission state
    const checkPermission = async () => {
      try {
        const status = await navigator.permissions.query({
          name: 'window-management' as PermissionName
        });

        if (!mountedRef.current) return;

        setPermissionState(status.state as 'prompt' | 'granted' | 'denied');
        setIsLoading(false);  // Loading complete

        // Listen for changes
        status.addEventListener('change', () => {
          if (mountedRef.current) {
            setPermissionState(status.state as 'prompt' | 'granted' | 'denied');
          }
        });
      } catch {
        if (mountedRef.current) {
          setPermissionState('prompt');  // Assume prompt if query fails
          setIsLoading(false);
        }
      }
    };

    checkPermission();
  }, [isSupported, hasMultipleScreens]);

  // ...
}
```

### Option B: Derived Loading State in Component

**Keep hook unchanged, derive loading state in PresentationView.**

```typescript
// In PresentationView
const { isSupported, hasMultipleScreens, permissionState, ... } = useWindowManagement();

// Derive "is still initializing"
const permissionIsLoading = isSupported &&
                            hasMultipleScreens &&
                            permissionState === 'unavailable';
```

**Disadvantages:**
- Requires consumer to understand internal timing
- `'unavailable'` is overloaded (means both "not applicable" and "still loading")
- Less explicit, more error-prone

**Recommendation: Option A is strongly preferred.**

## State Flow Diagram

```
+----------------------------------------------------------------------------+
|                         STATE FLOW DIAGRAM                                  |
+----------------------------------------------------------------------------+
|                                                                             |
|  MOUNT                                                                      |
|    |                                                                        |
|    v                                                                        |
|  +-----------------------------------------------------------+             |
|  | isLoading: true                                            |             |
|  | permissionState: null                                      |             |
|  | hasMultipleScreens: false                                  |             |
|  +-----------------------------------------------------------+             |
|    |                                                                        |
|    | screen.isExtended check (sync)                                         |
|    v                                                                        |
|  +------------------------+    +--------------------------------+           |
|  | Single Screen          |    | Multiple Screens               |           |
|  |                        |    |                                |           |
|  | isLoading: false       |    | isLoading: true (still)        |           |
|  | permissionState: null  |    | permissionState: null          |           |
|  | hasMultipleScreens:    |    | hasMultipleScreens: true       |           |
|  |   false                |    |                                |           |
|  |                        |    | ---> Query permissions         |           |
|  | ---> DONE              |    +----------------+---------------+           |
|  +------------------------+                     |                           |
|                                   navigator.permissions.query()             |
|                                                 |                           |
|                   +-----------------------------+------------------------+  |
|                   |                             |                        |  |
|                   v                             v                        v  |
|  +-------------------+   +---------------------+   +--------------------+   |
|  | PROMPT            |   | GRANTED             |   | DENIED             |   |
|  |                   |   |                     |   |                    |   |
|  | isLoading: false  |   | isLoading: false    |   | isLoading: false   |   |
|  | state: 'prompt'   |   | state: 'granted'    |   | state: 'denied'    |   |
|  |                   |   |                     |   |                    |   |
|  | Show Explainer UI |   | Fetch screen coords |   | Show Manual        |   |
|  | Gate "Launch" btn |   | Enable "Launch"     |   | Placement Guide    |   |
|  +-------------------+   +---------------------+   +--------------------+   |
|                                                                             |
+----------------------------------------------------------------------------+
```

## UI Gating Strategy

### Before Permission Status Known (isLoading = true)

| Element | State | Reason |
|---------|-------|--------|
| "Launch Student" button | Disabled OR Shows "Checking..." | Prevents user action before we know if we should prompt |
| PermissionExplainer | Hidden | Don't know if needed yet |
| ManualPlacementGuide | Hidden | Don't know if needed yet |

### After Permission Status Known (isLoading = false)

| permissionState | Launch Button | PermissionExplainer | ManualPlacementGuide |
|-----------------|---------------|---------------------|----------------------|
| null (single screen) | Enabled, normal text | Hidden | Hidden |
| 'prompt' | Enabled, shows target | **Visible** | Hidden |
| 'granted' | Enabled, shows screen name | Hidden | Hidden |
| 'denied' | Enabled, normal text | Hidden | **Visible** |

## Inline vs Upfront Permission Request

### Option 1: Upfront Permission (Current Approach)
- Show PermissionExplainer as soon as multi-screen detected + state is 'prompt'
- User grants/denies before clicking "Launch Student"

**Pros:**
- User understands what will happen before action
- Permission is cached for future launches
- No surprise browser dialogs mid-action

**Cons:**
- Requires extra user interaction
- User might skip, then get confused

### Option 2: Inline Permission (On Button Click)
- Don't show PermissionExplainer automatically
- When user clicks "Launch Student", call `getScreenDetails()` which triggers prompt
- Handle result in the same click handler

**Pros:**
- Fewer steps for user
- Permission request tied to specific action

**Cons:**
- Browser might block popup if permission prompt is async
- User might be surprised by permission dialog
- Current button handler is synchronous (critical for popup blocker avoidance)

### Recommendation: Upfront with Improved Gating

Keep the upfront approach but fix the race condition:

1. Gate the "Launch Student" button while `isLoading` is true
2. Show PermissionExplainer reliably when `!isLoading && permissionState === 'prompt'`
3. Allow user to skip (they can still launch, just won't auto-place on secondary screen)

This preserves the current user-friendly flow while eliminating the race condition.

## Implementation Checklist

### Hook Changes (`useWindowManagement.ts`)

- [ ] Add `isLoading` state, initialize to `true`
- [ ] Change `permissionState` initial value from `'unavailable'` to `null`
- [ ] Set `isLoading = false` after:
  - API not supported (immediately)
  - Single screen detected (immediately)
  - Permission query completes (after async)
  - Permission query fails (catch block)
- [ ] Return `isLoading` in hook result

### Component Changes (`PresentationView.tsx`)

- [ ] Destructure `isLoading` from `useWindowManagement()`
- [ ] Update PermissionExplainer condition:
  ```typescript
  {!isLoading && isSupported && hasMultipleScreens && permissionState === 'prompt' && (
    <PermissionExplainer ... />
  )}
  ```
- [ ] Consider disabling "Launch Student" while `isLoading`:
  ```typescript
  disabled={isLoading || isConnected}
  ```
- [ ] Update button text to show loading state:
  ```typescript
  {isLoading ? 'Checking displays...' : secondaryScreen ? `Launch on ${secondaryScreen.label}` : ...}
  ```

### Remove Race Condition useEffect

The current useEffect that shows PermissionExplainer based on state changes is unnecessary once the hook properly gates loading state. The conditional render directly in JSX is sufficient:

```typescript
// REMOVE this useEffect:
useEffect(() => {
  if (isSupported && hasMultipleScreens && permissionState === 'prompt') {
    setShowPermissionExplainer(true);
  }
}, [isSupported, hasMultipleScreens, permissionState]);

// REPLACE with direct conditional render:
{!isLoading && isSupported && hasMultipleScreens && permissionState === 'prompt' && !showPermissionExplainerDismissed && (
  <PermissionExplainer ... />
)}
```

Note: You'll need a `showPermissionExplainerDismissed` state to track if user clicked "Skip".

## Anti-Patterns to Avoid (Permission Flow)

### 1. Checking `permissionState === 'unavailable'` as Loading Indicator

**Why bad:** Overloads meaning. Can't distinguish "still loading" from "API not supported".

### 2. Using `setTimeout` to "Wait for State"

**Why bad:** Arbitrary timing, doesn't work reliably across devices/networks.

### 3. Multiple useEffects with Cascading State Updates

**Why bad:** Creates race conditions and makes flow hard to reason about.

### 4. Triggering Permission in Async Handler Before `window.open`

**Why bad:** Breaks popup blocker exception (user activation consumed by permission dialog).

## Sources (v1.2)

### HIGH Confidence (Official Documentation)
- [BroadcastChannel API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
- [Window Management API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API)
- [createPortal - React](https://react.dev/reference/react-dom/createPortal)
- [Window Management - Chrome Developers](https://developer.chrome.com/docs/capabilities/web-apis/window-management)
- [MDN: Using the Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API/Using_the_Permissions_API) - Official pattern for querying and listening to permission state changes

### MEDIUM Confidence (Browser Support Data)
- [BroadcastChannel - Can I Use](https://caniuse.com/broadcastchannel) - 95.8% global support
- [getScreenDetails - Can I Use](https://caniuse.com/mdn-api_window_getscreendetails) - 80.11% global support (Chromium only)

### MEDIUM Confidence (Community Patterns)
- [Popout Windows in React - Scott Logic](https://blog.scottlogic.com/2019/10/29/popout-windows-in-react.html)
- [react-new-window - GitHub](https://github.com/rmariuzzo/react-new-window)
- [How to Manage State Across Multiple Tabs](https://blog.pixelfreestudio.com/how-to-manage-state-across-multiple-tabs-and-windows/)
- [Fixing Race Conditions in React with useEffect](https://maxrozen.com/race-conditions-fetching-data-react-with-useeffect) - Boolean flag pattern for preventing stale state updates
- [Race conditions in useEffect with async: modern patterns for ReactJS 2025](https://medium.com/@sureshdotariya/race-conditions-in-useeffect-with-async-modern-patterns-for-reactjs-2025-9efe12d727b0) - Modern patterns including AbortController
- [UI best practices for loading, error, and empty states in React](https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/) - Loading state patterns for async operations
- [Handling API request race conditions in React](https://sebastienlorber.com/handling-api-request-race-conditions-in-react) - Comprehensive overview of race condition issues and solutions

### LOW Confidence (Needs Validation)
- CSS-in-JS injection patterns may vary by library (current PiPi uses Tailwind CDN)
- React 18+ portal behavior in new windows may have undocumented quirks

---

# Architecture Research: v2.0 Shareable Presentations

**Project:** PiPi (LessonLens)
**Researched:** 2026-01-19
**Overall Confidence:** HIGH (patterns verified with official documentation)

---

## Executive Summary

The v2.0 architecture integrates four major systems: a ZIP-based `.pipi` file format using JSZip, a provider-agnostic AI abstraction layer using the Vercel AI SDK pattern, a React Context-based settings architecture with localStorage persistence, and GitHub Pages deployment via Vite base path configuration. These systems are largely independent and can be built in parallel after establishing shared types. The recommended build order prioritizes the settings/configuration layer first (enables all other features), then file format (enables save/load), then AI abstraction (enables provider switching), with GitHub Pages deployment as a final infrastructure concern.

---

## File Format Design (.pipi)

### Recommended Approach: ZIP Archive with Custom Extension

Use JSZip to create ZIP archives with a `.pipi` extension. This approach is proven, well-supported, and handles the core requirement of bundling JSON metadata with binary assets (images).

**Confidence:** HIGH (JSZip is mature, well-documented, actively maintained)

### File Structure

```
presentation.pipi (ZIP archive)
|-- manifest.json          # Version, metadata, file index
|-- slides.json            # Slide data (title, content, speakerNotes, layout, etc.)
|-- settings.json          # User preferences captured at save time
|-- assets/
    |-- slide-0-image.jpg  # Binary image files
    |-- slide-1-image.png
    |-- ...
```

### manifest.json Schema

```typescript
interface PiPiManifest {
  version: "1.0.0";                    // Semantic versioning for format
  formatVersion: 1;                     // Integer for migration logic
  createdAt: string;                    // ISO timestamp
  modifiedAt: string;
  appVersion: string;                   // PiPi version that created file
  title: string;
  slideCount: number;
  hasAssets: boolean;
}
```

### Forward Compatibility Strategy

1. **Format version number**: Integer `formatVersion` enables migration logic
2. **Graceful degradation**: Unknown fields ignored, missing optional fields get defaults
3. **Asset references**: Slides reference assets by filename, not embedded base64
4. **Migration function**: `migrateManifest(oldVersion, newVersion)` handles upgrades

### Save Implementation

```typescript
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

async function savePiPi(slides: Slide[], settings: Settings, title: string): Promise<void> {
  const zip = new JSZip();

  // Create manifest
  const manifest: PiPiManifest = {
    version: "1.0.0",
    formatVersion: 1,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    title,
    slideCount: slides.length,
    hasAssets: slides.some(s => s.imageUrl)
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // Process slides - extract images to assets folder
  const assetsFolder = zip.folder("assets");
  const processedSlides = slides.map((slide, index) => {
    if (slide.imageUrl?.startsWith('data:')) {
      const filename = `slide-${index}-image.${getExtension(slide.imageUrl)}`;
      const base64Data = slide.imageUrl.split(',')[1];
      assetsFolder?.file(filename, base64Data, { base64: true });
      return { ...slide, imageUrl: `assets/${filename}` };
    }
    return slide;
  });

  zip.file("slides.json", JSON.stringify(processedSlides, null, 2));
  zip.file("settings.json", JSON.stringify(settings, null, 2));

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${sanitizeFilename(title)}.pipi`);
}
```

### Load Implementation

```typescript
async function loadPiPi(file: File): Promise<LoadedPresentation> {
  const zip = await JSZip.loadAsync(file);

  // Read and validate manifest
  const manifestJson = await zip.file("manifest.json")?.async("string");
  if (!manifestJson) throw new Error("Invalid .pipi file: missing manifest");
  const manifest: PiPiManifest = JSON.parse(manifestJson);

  // Version migration if needed
  if (manifest.formatVersion < CURRENT_FORMAT_VERSION) {
    // Run migration logic
  }

  // Load slides
  const slidesJson = await zip.file("slides.json")?.async("string");
  let slides: Slide[] = JSON.parse(slidesJson || "[]");

  // Restore image data from assets
  slides = await Promise.all(slides.map(async (slide) => {
    if (slide.imageUrl?.startsWith('assets/')) {
      const assetFile = zip.file(slide.imageUrl);
      if (assetFile) {
        const base64 = await assetFile.async("base64");
        const ext = slide.imageUrl.split('.').pop();
        slide.imageUrl = `data:image/${ext};base64,${base64}`;
      }
    }
    return slide;
  }));

  // Load settings (optional)
  const settingsJson = await zip.file("settings.json")?.async("string");
  const settings = settingsJson ? JSON.parse(settingsJson) : null;

  return { manifest, slides, settings };
}
```

### Component Boundaries

```
services/
  fileService.ts          # savePiPi(), loadPiPi(), validateManifest()

types.ts                  # PiPiManifest, LoadedPresentation interfaces
```

### Dependencies

```bash
npm install jszip file-saver
npm install -D @types/file-saver
```

---

## AI Provider Abstraction

### Recommended Approach: Vercel AI SDK Pattern (Custom Implementation)

The Vercel AI SDK demonstrates the ideal pattern: a unified interface where switching providers requires only changing the model parameter. For PiPi's specific needs (Gemini's image generation, structured JSON output), implement a custom abstraction following the same pattern.

**Confidence:** HIGH (Vercel AI SDK pattern is industry-proven, adopted by major companies)

### Why Custom Over Vercel AI SDK Directly

1. **Current Gemini integration uses `@google/genai`** - already working, tested
2. **Image generation specifics** - Gemini's image API has unique parameters (aspectRatio)
3. **Structured output schemas** - already defined in geminiService.ts
4. **Incremental migration** - can refactor without breaking existing functionality

### Provider Interface Design

```typescript
// services/ai/types.ts
export interface AIProviderConfig {
  apiKey: string;
  model?: string;
}

export interface GenerateTextOptions {
  systemPrompt?: string;
  prompt: string;
  responseFormat?: 'text' | 'json';
  schema?: object;  // JSON schema for structured output
}

export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: '4:3' | '16:9' | '3:4' | '1:1';
  style?: string;
}

export interface AIProvider {
  readonly name: string;
  readonly supportsImageGeneration: boolean;
  readonly supportsStructuredOutput: boolean;

  generateText(options: GenerateTextOptions): Promise<string>;
  generateStructuredOutput<T>(options: GenerateTextOptions): Promise<T>;
  generateImage?(options: GenerateImageOptions): Promise<string | undefined>;
}
```

### Provider Implementations

```typescript
// services/ai/providers/gemini.ts
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  readonly supportsImageGeneration = true;
  readonly supportsStructuredOutput = true;

  private ai: GoogleGenAI;
  private textModel: string;
  private imageModel: string;

  constructor(config: AIProviderConfig) {
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.textModel = config.model || "gemini-3-flash-preview";
    this.imageModel = "gemini-2.5-flash-image";
  }

  async generateText(options: GenerateTextOptions): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: this.textModel,
      contents: options.prompt,
      config: {
        systemInstruction: options.systemPrompt,
        responseMimeType: options.responseFormat === 'json'
          ? "application/json"
          : "text/plain"
      }
    });
    return response.text || "";
  }

  async generateStructuredOutput<T>(options: GenerateTextOptions): Promise<T> {
    const response = await this.ai.models.generateContent({
      model: this.textModel,
      contents: options.prompt,
      config: {
        systemInstruction: options.systemPrompt,
        responseMimeType: "application/json",
        responseSchema: options.schema
      }
    });
    return JSON.parse(response.text || "{}");
  }

  async generateImage(options: GenerateImageOptions): Promise<string | undefined> {
    const response = await this.ai.models.generateContent({
      model: this.imageModel,
      contents: options.prompt,
      config: {
        imageConfig: { aspectRatio: options.aspectRatio as any }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  }
}
```

```typescript
// services/ai/providers/anthropic.ts (future)
export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  readonly supportsImageGeneration = false;  // Claude doesn't generate images
  readonly supportsStructuredOutput = true;

  // Implementation using @anthropic-ai/sdk
}

// services/ai/providers/openai.ts (future)
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly supportsImageGeneration = true;   // DALL-E
  readonly supportsStructuredOutput = true;

  // Implementation using openai SDK
}
```

### Provider Factory

```typescript
// services/ai/index.ts
import { GeminiProvider } from './providers/gemini';
import type { AIProvider, AIProviderConfig } from './types';

export type ProviderName = 'gemini' | 'anthropic' | 'openai';

const providers: Record<ProviderName, new (config: AIProviderConfig) => AIProvider> = {
  gemini: GeminiProvider,
  // anthropic: AnthropicProvider,  // Add when implemented
  // openai: OpenAIProvider,
};

export function createAIProvider(name: ProviderName, config: AIProviderConfig): AIProvider {
  const Provider = providers[name];
  if (!Provider) {
    throw new Error(`Unknown AI provider: ${name}`);
  }
  return new Provider(config);
}

// Singleton for app-wide use
let activeProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!activeProvider) {
    throw new Error("AI provider not initialized. Call initializeAIProvider first.");
  }
  return activeProvider;
}

export function initializeAIProvider(name: ProviderName, config: AIProviderConfig): void {
  activeProvider = createAIProvider(name, config);
}
```

### Migration Strategy for Existing Code

**Phase 1:** Create abstraction layer alongside existing geminiService.ts
**Phase 2:** Update geminiService.ts functions to use abstraction internally
**Phase 3:** Update App.tsx to use new initialization pattern
**Phase 4:** Remove direct `@google/genai` imports from service functions

### Component Boundaries

```
services/
  ai/
    types.ts              # AIProvider interface, options types
    index.ts              # Factory, singleton management
    providers/
      gemini.ts           # GeminiProvider class
      anthropic.ts        # Future: AnthropicProvider
      openai.ts           # Future: OpenAIProvider
  geminiService.ts        # Refactored to use ai/index.ts internally
```

---

## Settings Architecture

### Recommended Approach: React Context + localStorage Sync

Use a dedicated SettingsContext with automatic localStorage persistence. This pattern is well-established in React applications and avoids the overhead of external state management libraries for a client-side app.

**Confidence:** HIGH (standard React pattern, well-documented)

### Settings Interface

```typescript
// types/settings.ts
export interface AppSettings {
  // AI Provider
  aiProvider: 'gemini' | 'anthropic' | 'openai';
  aiApiKey: string;
  aiModel?: string;

  // Generation Preferences
  autoGenerateImages: boolean;
  defaultSlideLayout: 'split' | 'full-image' | 'center-text';
  defaultTheme: 'default' | 'purple' | 'blue' | 'green' | 'warm';

  // UI Preferences
  darkMode: boolean;

  // Class Management (persisted separately?)
  studentNames: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'gemini',
  aiApiKey: '',
  aiModel: undefined,
  autoGenerateImages: true,
  defaultSlideLayout: 'split',
  defaultTheme: 'default',
  darkMode: false,
  studentNames: [],
};
```

### Context Implementation

```typescript
// contexts/SettingsContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';

const STORAGE_KEY = 'pipi-settings';

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new settings added in updates
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (e) {
        console.warn('Failed to save settings:', e);
      }
    }
  }, [settings, isLoaded]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
```

### Integration with AI Provider

```typescript
// App.tsx or dedicated initialization
import { useSettings } from './contexts/SettingsContext';
import { initializeAIProvider } from './services/ai';

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { settings, isLoaded } = useSettings();
  const [aiReady, setAiReady] = useState(false);

  useEffect(() => {
    if (isLoaded && settings.aiApiKey) {
      initializeAIProvider(settings.aiProvider, {
        apiKey: settings.aiApiKey,
        model: settings.aiModel
      });
      setAiReady(true);
    }
  }, [isLoaded, settings.aiProvider, settings.aiApiKey, settings.aiModel]);

  if (!isLoaded) return <LoadingScreen />;
  if (!settings.aiApiKey) return <SetupScreen />;
  if (!aiReady) return <LoadingScreen />;

  return <>{children}</>;
}
```

### Settings UI Component

```typescript
// components/SettingsPanel.tsx
export function SettingsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useSettings();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Settings</h2>

      <section>
        <h3>AI Provider</h3>
        <select
          value={settings.aiProvider}
          onChange={e => updateSettings({ aiProvider: e.target.value as any })}
        >
          <option value="gemini">Google Gemini</option>
          <option value="anthropic" disabled>Anthropic Claude (coming soon)</option>
          <option value="openai" disabled>OpenAI GPT (coming soon)</option>
        </select>

        <input
          type="password"
          value={settings.aiApiKey}
          onChange={e => updateSettings({ aiApiKey: e.target.value })}
          placeholder="API Key"
        />
      </section>

      {/* More settings sections... */}
    </Modal>
  );
}
```

### API Key Security Note

For a client-side only app, API keys are stored in localStorage and visible to users. This is acceptable because:
1. Users provide their own API keys
2. Keys are only used from the user's browser
3. Alternative would require a backend (out of scope for v2.0)

Future enhancement: Support for a proxy backend that holds keys server-side.

### Component Boundaries

```
contexts/
  SettingsContext.tsx     # Provider, hook, localStorage sync

components/
  SettingsPanel.tsx       # Settings UI modal

types/
  settings.ts             # AppSettings interface, defaults
```

---

## Build/Deploy Configuration

### GitHub Pages with Vite

**Confidence:** HIGH (official Vite documentation)

### vite.config.ts Updates

```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Determine base path: '/' for local dev, '/repo-name/' for GitHub Pages
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
  const base = isGitHubPages ? '/DEV - PiPi/' : '/';
  // Note: If repo name has spaces, use URL encoding or rename repo

  return {
    base,
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.APP_VERSION': JSON.stringify(process.env.npm_package_version || '2.0.0'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,  // Disable for production
    }
  };
});
```

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          GITHUB_ACTIONS: 'true'

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'dist'

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Repository Settings

1. Go to Settings > Pages
2. Set Source to "GitHub Actions"
3. No need for gh-pages branch

### Important: Repository Name

The current repo name "DEV - PiPi" contains spaces, which can cause issues with URL paths. Consider:
- Renaming to `pipi` or `lesson-lens`
- Using URL-encoded path: `/DEV%20-%20PiPi/`

---

## v2.0 Data Flow Diagram

```
                            +-----------------+
                            |  SettingsContext |
                            |  (localStorage)  |
                            +--------+--------+
                                     |
                 +-------------------+-------------------+
                 |                   |                   |
                 v                   v                   v
        +--------+-------+  +--------+-------+  +--------+-------+
        |  AI Provider   |  |  File Service  |  |  UI Components |
        |  (services/ai) |  | (services/file)|  |  (components/) |
        +--------+-------+  +--------+-------+  +--------+-------+
                 |                   |                   |
                 v                   v                   v
        +--------+-------+  +--------+-------+  +--------+-------+
        | Gemini/Claude/ |  |   JSZip        |  |  Presentation  |
        | OpenAI APIs    |  |   .pipi files  |  |  State (App)   |
        +----------------+  +----------------+  +----------------+
```

### State Ownership

| State | Owner | Persistence |
|-------|-------|-------------|
| App settings (API keys, preferences) | SettingsContext | localStorage |
| Current slides | App.tsx (useState) | None (session) |
| Lesson title | App.tsx (useState) | None (session) |
| Student names | SettingsContext | localStorage |
| Dark mode | SettingsContext | localStorage |
| Active AI provider | AI service singleton | Derived from settings |

---

## v2.0 Suggested Build Order

### Phase 1: Foundation (Week 1)
**Build first:** Settings architecture

| Component | Dependency | Rationale |
|-----------|------------|-----------|
| `types/settings.ts` | None | Defines interfaces for all other components |
| `contexts/SettingsContext.tsx` | types/settings | Enables API key storage for AI, preferences for UI |
| `components/SettingsPanel.tsx` | SettingsContext | User can configure app |

**Why first:** Every other feature depends on settings - AI provider needs API key, file save needs settings to include, UI needs preferences.

### Phase 2: AI Abstraction (Week 2)
**Build second:** Provider abstraction layer

| Component | Dependency | Rationale |
|-----------|------------|-----------|
| `services/ai/types.ts` | None | Interface definitions |
| `services/ai/providers/gemini.ts` | types | Wrap existing Gemini code |
| `services/ai/index.ts` | providers | Factory and singleton |
| Refactor `geminiService.ts` | ai/index | Use abstraction |

**Why second:** Settings provides API keys; this enables refactoring without breaking existing functionality.

### Phase 3: File Format (Week 2-3)
**Build third:** .pipi save/load

| Component | Dependency | Rationale |
|-----------|------------|-----------|
| `services/fileService.ts` | JSZip, types | Core save/load logic |
| Update `App.tsx` | fileService | Add Save/Open buttons |
| File open handler | fileService | Load .pipi on drag-drop or file picker |

**Why third:** Independent of AI abstraction; can be built in parallel if resources allow.

### Phase 4: Infrastructure (Week 3)
**Build last:** GitHub Pages deployment

| Component | Dependency | Rationale |
|-----------|------------|-----------|
| Update `vite.config.ts` | None | Add base path configuration |
| `.github/workflows/deploy.yml` | vite config | Automate deployment |
| Test deployment | All above | Verify everything works on GH Pages |

**Why last:** Pure infrastructure concern; doesn't affect feature development.

### Parallelization Opportunities

```
Week 1:     [Settings Architecture]
                    |
Week 2:     [AI Abstraction] ---+--- [File Format: types]
                    |                      |
Week 3:     [Refactor existing]    [File Format: implementation]
                    |                      |
Week 3-4:   [-------- GitHub Pages Deployment --------]
```

---

## v2.0 Anti-Patterns to Avoid

### 1. Embedding Binary Data in JSON
**Don't:** Store base64 images directly in slides.json
**Do:** Store images as separate files in assets/, reference by filename
**Why:** JSON files become huge, parsing becomes slow, editing is impractical

### 2. Provider-Specific Code Scattered Through App
**Don't:** Import `@google/genai` in multiple components
**Do:** All AI calls go through services/ai/index.ts
**Why:** Makes provider switching impossible, increases coupling

### 3. API Keys in Environment Variables for Client-Side
**Don't:** Rely on build-time env vars for API keys
**Do:** Store in localStorage, load at runtime
**Why:** Keys need to be user-configurable, build-time keys are baked in

### 4. localStorage Reads on Every Render
**Don't:** Read localStorage directly in components
**Do:** Use SettingsContext which reads once and syncs
**Why:** localStorage is synchronous and slow; excessive reads hurt performance

### 5. Mixing Presentation State with Settings
**Don't:** Store current slides in the same context as settings
**Do:** Keep settings (persistent) separate from session state (transient)
**Why:** Settings sync to localStorage; slides shouldn't auto-persist on every edit

---

## v2.0 Sources

### File Format (JSZip)
- [JSZip Official Documentation](https://stuk.github.io/jszip/) - HIGH confidence
- [JSZip GitHub Repository](https://github.com/Stuk/jszip) - HIGH confidence
- [JSZip Examples](https://stuk.github.io/jszip/documentation/examples.html) - HIGH confidence

### AI Provider Abstraction
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction) - HIGH confidence
- [Vercel AI SDK GitHub](https://github.com/vercel/ai) - HIGH confidence
- [Codecademy Guide to Vercel AI SDK](https://www.codecademy.com/article/guide-to-vercels-ai-sdk) - MEDIUM confidence
- [LogRocket: Building Unified AI Interfaces](https://blog.logrocket.com/unified-ai-interfaces-vercel-sdk/) - MEDIUM confidence

### Settings Architecture
- [React State Management in 2025](https://www.developerway.com/posts/react-state-management-2025) - MEDIUM confidence
- [React Context API Guide](https://generalistprogrammer.com/tutorials/react-context-api-complete-guide) - MEDIUM confidence
- [Context + localStorage Pattern](https://gist.github.com/jimode/c1d2d4c1ab33ba1b7be8be8c50d64555) - MEDIUM confidence

### GitHub Pages Deployment
- [Vite Official Static Deployment Guide](https://vite.dev/guide/static-deploy) - HIGH confidence
- [GitHub Pages with Vite Demo](https://github.com/sitek94/vite-deploy-demo) - MEDIUM confidence
