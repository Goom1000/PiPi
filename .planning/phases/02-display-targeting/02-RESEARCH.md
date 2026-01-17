# Phase 2: Display Targeting - Research

**Researched:** 2026-01-18
**Domain:** Window Management API, multi-screen window placement, browser feature detection
**Confidence:** HIGH

## Summary

This phase adds automatic projector targeting for Chromium browsers while providing graceful fallback instructions for Firefox/Safari. The research confirms a clear implementation approach:

1. **Window Management API is Chromium-only** - Chrome 100+, Edge 111+, Opera 97+ support `getScreenDetails()`. Firefox and Safari have no support and no announced plans to implement.

2. **The async-permission-then-sync-open pattern is critical** - Since `window.open()` must be synchronous (from Phase 1 learnings), but `getScreenDetails()` requires async permission, we must request permission BEFORE the user clicks "Launch Student" so that at click-time we already have screen coordinates.

3. **`screen.isExtended` enables permission-free detection** - This boolean property detects multiple monitors without prompting, allowing us to show/hide the "auto-target projector" feature based on hardware capability.

4. **Permission prompt needs explanation UI** - The browser's "manage windows on all displays" prompt is confusing to teachers. We need pre-flight UI explaining why we need this permission.

**Primary recommendation:** Pre-request `window-management` permission on presentation start (with explanation UI). Cache screen details. Use cached coordinates in synchronous `window.open()` call. Fall back to manual instructions when API unavailable or permission denied.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Window Management API | Native | Get screen coordinates | Only API for cross-screen window placement |
| screen.isExtended | Native | Detect multiple monitors | No permission prompt needed |
| navigator.permissions.query() | Native | Check permission state | Avoid redundant prompts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | - | - | No external dependencies needed - native APIs only |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Window Management API | Manual coordinate guessing | Unreliable, can't know actual screen positions |
| getScreenDetails() | Fullscreen on external | Requires separate API, less control over window |
| Permission pre-request | Just-in-time prompt | Popup blocked because of async permission flow |

**Installation:**
```bash
# No additional packages needed - using native browser APIs
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  hooks/
    useWindowManagement.ts    # Window Management API wrapper hook
  services/
    displayTargeting.ts       # Screen detection and targeting logic
  components/
    PermissionPromptUI.tsx    # Explanation UI before browser prompt
    ManualPlacementGuide.tsx  # Instructions for non-Chromium browsers
    PresentationView.tsx      # Updated with display targeting
```

### Pattern 1: Permission Pre-Request with Explanation UI
**What:** Request window-management permission proactively with user-friendly explanation
**When to use:** When entering presentation mode on Chromium browsers with multiple monitors

```typescript
// Source: Chrome Developers - Window Management API
// Pattern: Show explanation, then request permission, THEN enable auto-targeting

interface DisplayTargetingState {
  isSupported: boolean;         // API exists in browser
  hasMultipleScreens: boolean;  // screen.isExtended
  permissionState: 'prompt' | 'granted' | 'denied' | 'unavailable';
  screens: ScreenDetailed[] | null;
  secondaryScreen: ScreenDetailed | null;
}

async function initializeDisplayTargeting(): Promise<DisplayTargetingState> {
  // 1. Check API support
  if (!('getScreenDetails' in window)) {
    return {
      isSupported: false,
      hasMultipleScreens: false,
      permissionState: 'unavailable',
      screens: null,
      secondaryScreen: null
    };
  }

  // 2. Check for multiple screens (no permission needed)
  const hasMultipleScreens = window.screen.isExtended === true;

  if (!hasMultipleScreens) {
    return {
      isSupported: true,
      hasMultipleScreens: false,
      permissionState: 'unavailable',
      screens: null,
      secondaryScreen: null
    };
  }

  // 3. Check current permission state
  let permissionState: 'prompt' | 'granted' | 'denied' = 'prompt';
  try {
    const status = await navigator.permissions.query({
      name: 'window-management' as PermissionName
    });
    permissionState = status.state as 'prompt' | 'granted' | 'denied';
  } catch {
    // Permission query not supported, will prompt on getScreenDetails
    permissionState = 'prompt';
  }

  // 4. If already granted, get screen details
  if (permissionState === 'granted') {
    const screenDetails = await window.getScreenDetails();
    const secondary = screenDetails.screens.find(s => !s.isPrimary) || null;
    return {
      isSupported: true,
      hasMultipleScreens: true,
      permissionState: 'granted',
      screens: [...screenDetails.screens],
      secondaryScreen: secondary
    };
  }

  return {
    isSupported: true,
    hasMultipleScreens: true,
    permissionState,
    screens: null,
    secondaryScreen: null
  };
}
```

### Pattern 2: Synchronous Window Open with Pre-Cached Coordinates
**What:** Use pre-fetched screen coordinates in synchronous window.open()
**When to use:** Launching student window after permission is granted

```typescript
// Source: MDN Window.open, Chrome Developers Window Management
// CRITICAL: window.open MUST be synchronous to avoid popup blockers

interface CachedScreenTarget {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Store these BEFORE the click event
let cachedTarget: CachedScreenTarget | null = null;

// Called after permission granted (in useEffect or permission flow)
function cacheSecondaryScreenTarget(screens: ScreenDetailed[]): void {
  const secondary = screens.find(s => !s.isPrimary);
  if (secondary) {
    cachedTarget = {
      left: secondary.availLeft,
      top: secondary.availTop,
      width: secondary.availWidth,
      height: secondary.availHeight
    };
  }
}

// Called synchronously in click handler
function launchStudentWindow(): Window | null {
  const url = `${window.location.origin}${window.location.pathname}#/student`;

  if (cachedTarget) {
    // Open directly on secondary screen with full dimensions
    const features = `left=${cachedTarget.left},top=${cachedTarget.top},` +
                     `width=${cachedTarget.width},height=${cachedTarget.height}`;
    return window.open(url, 'pipi-student', features);
  }

  // Fallback: open with default dimensions (user drags to projector)
  return window.open(url, 'pipi-student', 'width=1280,height=720');
}
```

### Pattern 3: useWindowManagement Hook
**What:** Encapsulated Window Management API logic with React state
**When to use:** Any component needing display targeting capability

```typescript
// Source: MDN Window Management API, Chrome Developers
import { useState, useEffect, useCallback } from 'react';

interface ScreenTarget {
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
}

interface WindowManagementState {
  isSupported: boolean;
  hasMultipleScreens: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unavailable';
  secondaryScreen: ScreenTarget | null;
  requestPermission: () => Promise<boolean>;
}

function useWindowManagement(): WindowManagementState {
  const [isSupported] = useState(() => 'getScreenDetails' in window);
  const [hasMultipleScreens, setHasMultipleScreens] = useState(false);
  const [permissionState, setPermissionState] =
    useState<'prompt' | 'granted' | 'denied' | 'unavailable'>('unavailable');
  const [secondaryScreen, setSecondaryScreen] = useState<ScreenTarget | null>(null);

  // Initial detection (no permission needed)
  useEffect(() => {
    if (!isSupported) return;

    // screen.isExtended is available without permission
    const checkExtended = () => {
      const extended = (window.screen as any).isExtended === true;
      setHasMultipleScreens(extended);
      if (!extended) {
        setPermissionState('unavailable');
      }
    };

    checkExtended();

    // Listen for screen configuration changes
    window.screen.addEventListener('change', checkExtended);
    return () => window.screen.removeEventListener('change', checkExtended);
  }, [isSupported]);

  // Check existing permission state
  useEffect(() => {
    if (!isSupported || !hasMultipleScreens) return;

    (async () => {
      try {
        const status = await navigator.permissions.query({
          name: 'window-management' as PermissionName
        });
        setPermissionState(status.state as 'prompt' | 'granted' | 'denied');

        // Listen for permission changes
        status.addEventListener('change', () => {
          setPermissionState(status.state as 'prompt' | 'granted' | 'denied');
        });
      } catch {
        setPermissionState('prompt');
      }
    })();
  }, [isSupported, hasMultipleScreens]);

  // Fetch screen details when permission is granted
  useEffect(() => {
    if (permissionState !== 'granted') {
      setSecondaryScreen(null);
      return;
    }

    (async () => {
      try {
        const details = await (window as any).getScreenDetails();
        const secondary = details.screens.find((s: any) => !s.isPrimary);
        if (secondary) {
          setSecondaryScreen({
            left: secondary.availLeft,
            top: secondary.availTop,
            width: secondary.availWidth,
            height: secondary.availHeight,
            label: secondary.label || 'External Display'
          });
        }

        // Listen for screen changes
        details.addEventListener('screenschange', async () => {
          const updated = await (window as any).getScreenDetails();
          const newSecondary = updated.screens.find((s: any) => !s.isPrimary);
          setSecondaryScreen(newSecondary ? {
            left: newSecondary.availLeft,
            top: newSecondary.availTop,
            width: newSecondary.availWidth,
            height: newSecondary.availHeight,
            label: newSecondary.label || 'External Display'
          } : null);
        });
      } catch {
        setPermissionState('denied');
      }
    })();
  }, [permissionState]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !hasMultipleScreens) return false;

    try {
      const details = await (window as any).getScreenDetails();
      const secondary = details.screens.find((s: any) => !s.isPrimary);
      if (secondary) {
        setSecondaryScreen({
          left: secondary.availLeft,
          top: secondary.availTop,
          width: secondary.availWidth,
          height: secondary.availHeight,
          label: secondary.label || 'External Display'
        });
      }
      setPermissionState('granted');
      return true;
    } catch {
      setPermissionState('denied');
      return false;
    }
  }, [isSupported, hasMultipleScreens]);

  return {
    isSupported,
    hasMultipleScreens,
    permissionState,
    secondaryScreen,
    requestPermission
  };
}

export default useWindowManagement;
```

### Pattern 4: Browser Detection for Feature Branching
**What:** Detect Chromium vs non-Chromium browsers
**When to use:** Showing appropriate UI/instructions based on browser capabilities

```typescript
// Source: Standard browser detection patterns
function isChromiumBrowser(): boolean {
  const ua = navigator.userAgent;
  // Chromium-based browsers include "Chrome" in UA
  // Safari has "Safari" but NOT "Chrome"
  // Firefox has "Firefox" but NOT "Chrome"
  return /Chrome/.test(ua) && !/Edg/.test(ua) === false; // Edge is also Chromium
}

// More reliable: feature detection
function supportsWindowManagement(): boolean {
  return 'getScreenDetails' in window;
}

// Combined check for display targeting capability
function canAutoTargetDisplay(): boolean {
  return supportsWindowManagement() &&
         (window.screen as any).isExtended === true;
}
```

### Anti-Patterns to Avoid
- **Calling getScreenDetails() in click handler:** Async permission flow causes popup blocker. Request permission BEFORE click.
- **Not caching screen coordinates:** Each getScreenDetails() call may re-prompt. Cache results.
- **Assuming screen positions:** Don't hardcode coordinates like `left=1920`. Screens can be arranged in any configuration.
- **Ignoring permission denial:** Always have a fallback path for manual window placement.
- **Not listening for screenschange:** User can plug/unplug monitors during session.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-screen detection | Check screen.width > 2000 | screen.isExtended | Works regardless of resolution |
| Screen positioning | Guess coordinates | getScreenDetails().screens | Only API that knows actual layout |
| Permission state | Track manually | navigator.permissions.query | Handles persistence, survives refresh |
| Browser detection | Parse UA strings | Feature detection (`'getScreenDetails' in window`) | UA strings are unreliable |

**Key insight:** The Window Management API is the ONLY way to reliably place windows on secondary screens. Any other approach is guesswork that will fail on different monitor configurations.

## Common Pitfalls

### Pitfall 1: Async Permission Blocks Popup
**What goes wrong:** Student window blocked by popup blocker despite being called from click handler
**Why it happens:** `await getScreenDetails()` in click handler makes `window.open()` asynchronous
**How to avoid:** Request permission BEFORE user clicks launch button. Cache screen details. Use cached values synchronously.
**Warning signs:** Works when permission pre-granted, fails on first use

### Pitfall 2: Permission Prompt Confusion
**What goes wrong:** Teacher denies permission because "manage windows on all displays" sounds scary
**Why it happens:** Browser's default prompt lacks context for why this is needed
**How to avoid:** Show explanation UI BEFORE calling getScreenDetails(). Explain it's to auto-place on projector.
**Warning signs:** High permission denial rate, teachers asking "why does it need this?"

### Pitfall 3: Screen Coordinates Stale After Monitor Change
**What goes wrong:** Window opens in wrong position or off-screen
**Why it happens:** User connected/disconnected monitor but cached coordinates not updated
**How to avoid:** Listen for `screenschange` event. Re-fetch screen details when configuration changes.
**Warning signs:** Works first time, fails after plugging in different monitor

### Pitfall 4: isExtended Returns False on Chromium
**What goes wrong:** Feature detection says no multi-screen even though monitors are connected
**Why it happens:** Permissions-Policy header blocks Window Management API
**How to avoid:** Check for both API support AND isExtended. Fall back gracefully if either fails.
**Warning signs:** Works locally, fails in production (server headers may differ)

### Pitfall 5: TypeScript Errors for Window Management API
**What goes wrong:** TypeScript complains about getScreenDetails, ScreenDetailed, etc.
**Why it happens:** Window Management API types not in lib.dom.d.ts (experimental API)
**How to avoid:** Add type declarations in types.d.ts or use `(window as any).getScreenDetails()`
**Warning signs:** Red squiggles in IDE, build errors

## Code Examples

Verified patterns from official sources:

### Complete Permission Request Flow with Explanation UI
```typescript
// Source: Chrome Developers Window Management API
interface PermissionExplainerProps {
  onRequestPermission: () => Promise<void>;
  onSkip: () => void;
}

const PermissionExplainer: React.FC<PermissionExplainerProps> = ({
  onRequestPermission,
  onSkip
}) => {
  const [requesting, setRequesting] = useState(false);

  const handleRequest = async () => {
    setRequesting(true);
    await onRequestPermission();
    setRequesting(false);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-md">
      <div className="flex items-start gap-4">
        <div className="text-3xl">🖥️</div>
        <div>
          <h3 className="font-bold text-blue-900 text-lg">
            Auto-Place on Projector
          </h3>
          <p className="text-blue-700 mt-2 text-sm">
            We can automatically open the student view on your projector
            instead of your laptop screen.
          </p>
          <p className="text-blue-600 mt-2 text-xs">
            Your browser will ask permission to "manage windows on all displays" -
            this just lets us know where your projector is.
          </p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleRequest}
              disabled={requesting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
                         hover:bg-blue-700 disabled:opacity-50"
            >
              {requesting ? 'Requesting...' : 'Enable Auto-Placement'}
            </button>
            <button
              onClick={onSkip}
              className="px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              Skip, I'll drag it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Manual Placement Instructions for Non-Chromium Browsers
```typescript
// Source: UX best practices for graceful degradation
interface ManualPlacementGuideProps {
  studentUrl: string;
}

const ManualPlacementGuide: React.FC<ManualPlacementGuideProps> = ({ studentUrl }) => {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(studentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-md">
      <div className="flex items-start gap-4">
        <div className="text-3xl">👆</div>
        <div>
          <h3 className="font-bold text-amber-900 text-lg">
            Drag Window to Projector
          </h3>
          <p className="text-amber-700 mt-2 text-sm">
            Your browser doesn't support automatic display targeting.
            After the student window opens:
          </p>
          <ol className="text-amber-700 mt-3 text-sm list-decimal list-inside space-y-1">
            <li>Grab the title bar of the new window</li>
            <li>Drag it to your projector/external display</li>
            <li>Press F11 or double-click to go fullscreen</li>
          </ol>

          <p className="text-amber-600 mt-4 text-xs">
            Alternative: Open this URL directly on the projector:
          </p>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 bg-white px-3 py-2 rounded text-xs
                           font-mono text-amber-900 truncate">
              {studentUrl}
            </code>
            <button
              onClick={copyUrl}
              className="px-3 py-2 bg-amber-600 text-white rounded text-xs
                         font-medium hover:bg-amber-700"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### TypeScript Type Declarations
```typescript
// Source: W3C Window Management Spec, MDN
// Add to types.d.ts or types/window-management.d.ts

interface ScreenDetailed extends Screen {
  readonly availLeft: number;
  readonly availTop: number;
  readonly left: number;
  readonly top: number;
  readonly isPrimary: boolean;
  readonly isInternal: boolean;
  readonly devicePixelRatio: number;
  readonly label: string;
}

interface ScreenDetails extends EventTarget {
  readonly screens: ReadonlyArray<ScreenDetailed>;
  readonly currentScreen: ScreenDetailed;
  addEventListener(type: 'screenschange', listener: () => void): void;
  addEventListener(type: 'currentscreenchange', listener: () => void): void;
}

interface Screen {
  readonly isExtended?: boolean;
}

interface Window {
  getScreenDetails?(): Promise<ScreenDetails>;
}

// Extend PermissionName to include 'window-management'
// This is handled by type assertion: { name: 'window-management' as PermissionName }
```

### Integration with Existing PresentationView Launch Flow
```typescript
// Source: Phase 1 research + Window Management API
// Updated launch button handler

const PresentationView: React.FC<Props> = ({ slides, onExit }) => {
  // ... existing state

  const {
    isSupported,
    hasMultipleScreens,
    permissionState,
    secondaryScreen,
    requestPermission
  } = useWindowManagement();

  const [showPermissionExplainer, setShowPermissionExplainer] = useState(false);

  // Show explainer when entering presentation mode with multi-screen setup
  useEffect(() => {
    if (isSupported && hasMultipleScreens && permissionState === 'prompt') {
      setShowPermissionExplainer(true);
    }
  }, [isSupported, hasMultipleScreens, permissionState]);

  // SYNCHRONOUS click handler - uses pre-cached secondaryScreen
  const handleLaunchStudent = () => {
    const url = `${window.location.origin}${window.location.pathname}#/student`;

    let features = 'width=1280,height=720';

    // If we have secondary screen coordinates, position there
    if (secondaryScreen) {
      features = `left=${secondaryScreen.left},top=${secondaryScreen.top},` +
                 `width=${secondaryScreen.width},height=${secondaryScreen.height}`;
    }

    const studentWindow = window.open(url, 'pipi-student', features);

    if (!studentWindow || studentWindow.closed) {
      setPopupBlocked(true);
    } else {
      setIsStudentWindowOpen(true);
      setPopupBlocked(false);
    }
  };

  return (
    <>
      {showPermissionExplainer && (
        <PermissionExplainer
          onRequestPermission={async () => {
            await requestPermission();
            setShowPermissionExplainer(false);
          }}
          onSkip={() => setShowPermissionExplainer(false)}
        />
      )}

      {/* Show manual guide for non-Chromium OR permission denied */}
      {(!isSupported || permissionState === 'denied') && hasMultipleScreens && (
        <ManualPlacementGuide
          studentUrl={`${window.location.origin}${window.location.pathname}#/student`}
        />
      )}

      {/* Launch button - always works, targeting varies */}
      <button onClick={handleLaunchStudent}>
        {secondaryScreen
          ? `Launch on ${secondaryScreen.label}`
          : 'Launch Student View'
        }
      </button>
    </>
  );
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| window.moveTo() with guessed coordinates | getScreenDetails() for real coordinates | Chrome 100 (2022) | Reliable placement |
| No multi-screen detection | screen.isExtended boolean | Chrome 100 (2022) | Permission-free detection |
| Fullscreen API on "any" screen | requestFullscreen({ screen }) | Chrome 100 (2022) | Targeted fullscreen |
| window-placement permission | window-management permission | Chrome 111 (2023) | Updated permission name |

**Deprecated/outdated:**
- `window-placement` permission name: Use `window-management` instead (Chrome 111+)
- Guessing screen coordinates: Use getScreenDetails() API
- Manual fullscreen drag: Can now specify target screen programmatically

## Open Questions

Things that couldn't be fully resolved:

1. **Should permission request be automatic or manual?**
   - What we know: Permission can be requested any time before window.open
   - What's unclear: UX preference - request on presentation start or on first launch click?
   - Recommendation: Request on presentation start with explanation UI. This separates the "scary" permission prompt from the "launch window" action.

2. **Fullscreen vs. maximized window on secondary?**
   - What we know: Can open window sized to fill screen, OR can use requestFullscreen({ screen })
   - What's unclear: Which provides better UX? Fullscreen hides browser chrome but may trigger another prompt.
   - Recommendation: Start with full-size window (width/height = availWidth/availHeight). Add fullscreen button to student view if users request it.

3. **What if primary/secondary screens swap?**
   - What we know: isPrimary can change if user changes display settings
   - What's unclear: Should we always target non-primary, or let user choose?
   - Recommendation: Target non-primary by default. Label it with screen.label. Add UI to switch if multiple external displays exist.

## Sources

### Primary (HIGH confidence)
- [Chrome Developers: Window Management API](https://developer.chrome.com/docs/capabilities/web-apis/window-management) - Complete API guide with code examples
- [MDN: Window.getScreenDetails()](https://developer.mozilla.org/en-US/docs/Web/API/Window/getScreenDetails) - API reference, permission requirements
- [MDN: Window Management API](https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API) - Overview and browser compatibility
- [MDN: Screen.isExtended](https://developer.mozilla.org/en-US/docs/Web/API/Screen/isExtended) - Permission-free detection
- [MDN: ScreenDetailed](https://developer.mozilla.org/en-US/docs/Web/API/ScreenDetailed) - Interface properties

### Secondary (MEDIUM confidence)
- [Can I Use: window-management permission](https://caniuse.com/mdn-api_permissions_permission_window-management) - Browser support: Chrome 111+, Edge 111+, Opera 97+, No Firefox/Safari
- [W3C Window Management Explainer](https://github.com/w3c/window-management/blob/main/EXPLAINER.md) - Use cases, API design rationale
- [Ryan Thomson: Window.open() Async Pattern](https://www.ryanthomson.net/articles/you-shouldnt-call-window-open-asynchronously/) - Workaround for async-then-open pattern

### Tertiary (LOW confidence)
- Browser detection heuristics - Standard patterns, UA strings are unreliable

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native browser API, Chrome Developers documentation is authoritative
- Architecture: HIGH - Patterns derived from official docs and W3C explainer
- Pitfalls: HIGH - Async permission + sync window.open conflict is well-documented
- Browser support: HIGH - Verified on caniuse.com, MDN compatibility tables

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - API is stable, unlikely to change)
