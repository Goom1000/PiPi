# Phase 3: Resilience & Polish - Research

**Researched:** 2026-01-18
**Domain:** Cross-window communication resilience, keyboard event handling, UI polish
**Confidence:** HIGH

## Summary

This phase adds resilience features (window recovery, connection status, session persistence) and polish features (keyboard navigation, next slide preview, tooltips). The research confirms a clear implementation approach using the existing BroadcastChannel infrastructure.

1. **Connection status requires a heartbeat pattern** - BroadcastChannel has no built-in presence detection. We must implement ping/pong messages to detect when the student window is closed or disconnected. The existing `useBroadcastSync` hook can be extended with a heartbeat mechanism.

2. **Keyboard navigation is straightforward** - Page Up/Down and Arrow keys have standardized `event.key` values (`"PageUp"`, `"PageDown"`, `"ArrowLeft"`, `"ArrowRight"`). Global keyboard handling via `document.addEventListener('keydown')` works well, and the codebase already has this pattern in PresentationView.

3. **Session persistence uses sessionStorage for window identity** - Each tab gets its own sessionStorage. Store the student window's session ID there so if the teacher refreshes, they can broadcast a reconnection request that the student window responds to.

4. **Toast notifications need no library** - Simple auto-dismissing toasts can be built with useState, setTimeout, and CSS animations. No external dependency needed.

**Primary recommendation:** Extend the existing `useBroadcastSync` hook with optional heartbeat capability. Add new message types (`HEARTBEAT`, `HEARTBEAT_ACK`, `CLOSE_STUDENT`) to the discriminated union. Use sessionStorage to persist session identity across refresh.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| BroadcastChannel API | Native | Cross-window messaging | Already in use, no alternative needed |
| sessionStorage API | Native | Per-tab state persistence | Unique per tab, survives refresh |
| KeyboardEvent API | Native | Global keyboard handling | Standard DOM API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | - | - | No external dependencies needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom toast | react-hot-toast | Adds dependency for simple feature |
| Custom tooltip | @radix-ui/react-tooltip | Overkill for title-attribute-style hints |
| Heartbeat in hook | Separate polling interval | More complex, harder to coordinate |

**Installation:**
```bash
# No additional packages needed - using native browser APIs
```

## Architecture Patterns

### Recommended Project Structure
```
hooks/
  useBroadcastSync.ts        # Extend with heartbeat capability
  useKeyboardNavigation.ts   # New: global keyboard event handling
types.ts                     # Extend PresentationMessage union
components/
  PresentationView.tsx       # Add connection status, preview toggle
  StudentView.tsx            # Add heartbeat response, close listener
  ConnectionStatus.tsx       # New: status chip component
  NextSlidePreview.tsx       # New: preview thumbnail component
  Toast.tsx                  # New: simple auto-dismiss notification
```

### Pattern 1: Heartbeat for Connection Status
**What:** Periodic ping/pong messages to detect disconnected windows
**When to use:** Teacher view needs to know if student window is connected

```typescript
// Source: BroadcastChannel best practices
// Extend existing PresentationMessage type in types.ts

export type PresentationMessage =
  | { type: 'STATE_UPDATE'; payload: PresentationState }
  | { type: 'STATE_REQUEST' }
  | { type: 'HEARTBEAT'; timestamp: number }      // Teacher sends
  | { type: 'HEARTBEAT_ACK'; timestamp: number }  // Student responds
  | { type: 'CLOSE_STUDENT' };                    // Teacher requests close

// Teacher side: send heartbeat, track last ack
const HEARTBEAT_INTERVAL = 2000;  // 2 seconds
const HEARTBEAT_TIMEOUT = 5000;   // 5 seconds without ack = disconnected

function useConnectionStatus(postMessage: (msg: PresentationMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const lastAckRef = useRef<number>(0);
  const { lastMessage } = useBroadcastSync<PresentationMessage>(BROADCAST_CHANNEL_NAME);

  // Send heartbeats
  useEffect(() => {
    const interval = setInterval(() => {
      postMessage({ type: 'HEARTBEAT', timestamp: Date.now() });
    }, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [postMessage]);

  // Track acks
  useEffect(() => {
    if (lastMessage?.type === 'HEARTBEAT_ACK') {
      lastAckRef.current = lastMessage.timestamp;
      setIsConnected(true);
    }
  }, [lastMessage]);

  // Check for timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceAck = Date.now() - lastAckRef.current;
      if (timeSinceAck > HEARTBEAT_TIMEOUT) {
        setIsConnected(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return isConnected;
}

// Student side: respond to heartbeats
useEffect(() => {
  if (lastMessage?.type === 'HEARTBEAT') {
    postMessage({ type: 'HEARTBEAT_ACK', timestamp: lastMessage.timestamp });
  }
}, [lastMessage, postMessage]);
```

### Pattern 2: Session Persistence with sessionStorage
**What:** Store session ID in sessionStorage so teacher can reconnect after refresh
**When to use:** Teacher refreshes page, wants to reconnect to existing student window

```typescript
// Source: MDN sessionStorage, BroadcastChannel patterns
// sessionStorage is unique per tab - survives refresh but not new tabs

const SESSION_KEY = 'pipi-session-id';

// Generate or retrieve session ID (teacher side)
function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// On teacher mount, broadcast reconnection request
useEffect(() => {
  const sessionId = getOrCreateSessionId();
  postMessage({ type: 'RECONNECT_REQUEST', sessionId });
}, []);

// Student stores teacher's session ID when first connected
// On receiving RECONNECT_REQUEST with matching sessionId, responds with STATE_REQUEST
```

### Pattern 3: Global Keyboard Navigation Hook
**What:** Custom hook for document-level keyboard events
**When to use:** Presenter remote navigation (Page Up/Down, Arrow keys)

```typescript
// Source: MDN KeyboardEvent, React patterns
import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationOptions {
  onNext: () => void;
  onPrev: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

function useKeyboardNavigation({
  onNext,
  onPrev,
  onEscape,
  enabled = true
}: UseKeyboardNavigationOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if focus is in an input field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key) {
      case 'ArrowRight':
      case 'PageDown':
        event.preventDefault();
        onNext();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        event.preventDefault();
        onPrev();
        break;
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;
    }
  }, [onNext, onPrev, onEscape]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

export default useKeyboardNavigation;
```

### Pattern 4: Simple Toast Notification
**What:** Auto-dismissing notification component without external library
**When to use:** Brief feedback on reconnection success

```typescript
// Source: React patterns, LogRocket blog
import { useState, useEffect } from 'react';

interface Toast {
  id: string;
  message: string;
  duration?: number;
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, duration = 3000) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

// Toast component with auto-dismiss
const Toast: React.FC<{
  message: string;
  duration: number;
  onDismiss: () => void;
}> = ({ message, duration, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2
                    rounded-lg shadow-lg animate-fade-in z-50">
      {message}
    </div>
  );
};
```

### Pattern 5: Connection Status Chip
**What:** Visual indicator showing student window connection state
**When to use:** Always visible in teacher view header

```typescript
// Source: CONTEXT.md decisions - "separate status chip, icon + text hybrid"
const ConnectionStatus: React.FC<{ isConnected: boolean }> = ({ isConnected }) => {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
      ${isConnected
        ? 'bg-green-900/30 text-green-400 border border-green-500/30'
        : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-400 animate-pulse' : 'bg-slate-500'
      }`} />
      <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
};
```

### Pattern 6: Next Slide Preview
**What:** Thumbnail preview of upcoming slide, toggleable
**When to use:** Teacher wants to see what's coming next

```typescript
// Source: CONTEXT.md decisions - "toggleable via button"
const NextSlidePreview: React.FC<{
  nextSlide: Slide | null;
  isVisible: boolean;
  onToggle: () => void;
}> = ({ nextSlide, isVisible, onToggle }) => {
  return (
    <>
      <button
        onClick={onToggle}
        className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600
                   border border-slate-600"
        title="Toggle next slide preview"
      >
        {isVisible ? 'Hide Preview' : 'Preview'}
      </button>

      {isVisible && (
        <div className="absolute bottom-20 right-4 w-48 bg-slate-800 rounded-lg
                        shadow-xl border border-slate-700 overflow-hidden">
          <div className="px-2 py-1 bg-slate-700/50 text-[10px] text-slate-400
                          uppercase tracking-wider font-bold">
            Next Slide
          </div>
          {nextSlide ? (
            <div className="aspect-video bg-white p-2">
              <div className="text-xs font-bold text-slate-800 truncate">
                {nextSlide.title}
              </div>
              <ul className="text-[8px] text-slate-600 mt-1">
                {nextSlide.content.slice(0, 3).map((item, i) => (
                  <li key={i} className="truncate">- {item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="aspect-video bg-slate-900 flex items-center justify-center">
              <span className="text-slate-500 text-xs">End of presentation</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};
```

### Anti-Patterns to Avoid
- **Polling window.closed on popup reference:** Unreliable across browsers, fails on cross-origin navigation. Use heartbeat via BroadcastChannel instead.
- **Using beforeunload for presence:** Unreliable on mobile, blocked by browsers for bfcache. Heartbeat pattern is more robust.
- **Storing window reference:** The window object reference can become stale. BroadcastChannel doesn't need window references.
- **Single global keydown handler:** Use dedicated hook to manage cleanup properly. Existing PresentationView pattern is correct.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-tab messaging | postMessage with window refs | BroadcastChannel | Already in use, no reference tracking |
| Unique session ID | Random strings | crypto.randomUUID() | Built-in, cryptographically random |
| Key event codes | String matching "keyCode" | event.key standardized values | Modern, cross-browser consistent |
| Animation timing | Manual requestAnimationFrame | CSS animations + Tailwind | Declarative, GPU-accelerated |

**Key insight:** The existing BroadcastChannel infrastructure handles most complexity. We just need to add message types for heartbeat and close commands.

## Common Pitfalls

### Pitfall 1: Heartbeat Interval Too Fast/Slow
**What goes wrong:** Too fast wastes CPU/battery, too slow causes delayed status updates
**Why it happens:** No clear guidance on "right" interval
**How to avoid:** Use 2-second heartbeat with 5-second timeout. Fast enough for quick detection, slow enough to not impact performance.
**Warning signs:** High CPU usage, or "disconnected" showing many seconds after window actually closed

### Pitfall 2: Race Condition on Teacher Refresh
**What goes wrong:** Teacher refreshes, sends STATE_REQUEST, student responds before teacher's message handler is set up
**Why it happens:** React useEffect runs after render, BroadcastChannel may receive messages before handler attached
**How to avoid:** Student should respond to both STATE_REQUEST and RECONNECT_REQUEST. Teacher should also listen for HEARTBEAT_ACK as implicit "connected" signal.
**Warning signs:** Reconnection only works sometimes, depends on timing

### Pitfall 3: Keyboard Events Captured by Inputs
**What goes wrong:** Page Up/Down triggers slide navigation while typing in a text field
**Why it happens:** Global keydown handler doesn't check event target
**How to avoid:** Check if `event.target.tagName` is INPUT or TEXTAREA before handling
**Warning signs:** Unexpected slide changes when clicking in any input field

### Pitfall 4: Toast Memory Leak
**What goes wrong:** Toasts accumulate in state array, never cleaned up
**Why it happens:** setTimeout cleanup not coordinated with component lifecycle
**How to avoid:** Remove toast from array after dismiss animation completes. Use unique IDs.
**Warning signs:** Memory grows over long presentation sessions

### Pitfall 5: Preview Thumbnail Blocks Interaction
**What goes wrong:** Next slide preview covers important controls
**Why it happens:** Absolute positioning without considering other UI elements
**How to avoid:** Position preview where it won't overlap nav buttons or script panel. Use z-index carefully.
**Warning signs:** Can't click buttons when preview is visible

### Pitfall 6: Button Not Re-enabling After Window Close
**What goes wrong:** "Launch Student" button stays disabled after student window is closed
**Why it happens:** Relying on window reference .closed property which may not update
**How to avoid:** Derive button state from heartbeat connection status, not window reference
**Warning signs:** Have to refresh teacher page to launch student again

## Code Examples

Verified patterns from official sources:

### Extending useBroadcastSync with Heartbeat Support
```typescript
// Source: MDN BroadcastChannel, existing codebase pattern
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseBroadcastSyncOptions {
  enableHeartbeat?: boolean;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

function useBroadcastSync<T>(
  channelName: string,
  options: UseBroadcastSyncOptions = {}
) {
  const {
    enableHeartbeat = false,
    heartbeatInterval = 2000,
    heartbeatTimeout = 5000
  } = options;

  const channelRef = useRef<BroadcastChannel | null>(null);
  const [lastMessage, setLastMessage] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const lastAckRef = useRef<number>(0);

  useEffect(() => {
    channelRef.current = new BroadcastChannel(channelName);

    channelRef.current.onmessage = (event: MessageEvent<T>) => {
      setLastMessage(event.data);

      // Track heartbeat acks
      if ((event.data as any)?.type === 'HEARTBEAT_ACK') {
        lastAckRef.current = Date.now();
        setIsConnected(true);
      }
    };

    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [channelName]);

  // Heartbeat sending (for teacher/primary)
  useEffect(() => {
    if (!enableHeartbeat) return;

    const sendHeartbeat = () => {
      channelRef.current?.postMessage({ type: 'HEARTBEAT', timestamp: Date.now() });
    };

    const heartbeatTimer = setInterval(sendHeartbeat, heartbeatInterval);

    // Check for timeout
    const timeoutChecker = setInterval(() => {
      if (Date.now() - lastAckRef.current > heartbeatTimeout) {
        setIsConnected(false);
      }
    }, 1000);

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(timeoutChecker);
    };
  }, [enableHeartbeat, heartbeatInterval, heartbeatTimeout]);

  const postMessage = useCallback((message: T) => {
    channelRef.current?.postMessage(message);
  }, []);

  return { lastMessage, postMessage, isConnected };
}

export default useBroadcastSync;
```

### Keyboard Event Key Values Reference
```typescript
// Source: MDN KeyboardEvent key values
// Standard key values to use with event.key

const NAVIGATION_KEYS = {
  // Presenter remote typically sends these
  NEXT: ['ArrowRight', 'PageDown', ' '],  // Space also common
  PREV: ['ArrowLeft', 'PageUp'],

  // Control
  ESCAPE: 'Escape',

  // Optional extras
  FIRST: 'Home',
  LAST: 'End'
} as const;

// Usage in keydown handler
function handleKeyDown(event: KeyboardEvent) {
  if (NAVIGATION_KEYS.NEXT.includes(event.key)) {
    event.preventDefault();
    goToNextSlide();
  } else if (NAVIGATION_KEYS.PREV.includes(event.key)) {
    event.preventDefault();
    goToPrevSlide();
  } else if (event.key === NAVIGATION_KEYS.ESCAPE) {
    event.preventDefault();
    closeStudentWindow();
  }
}
```

### Remote Window Close via BroadcastChannel
```typescript
// Source: Existing codebase pattern extended
// Teacher side: send close command
const handleCloseStudent = () => {
  postMessage({ type: 'CLOSE_STUDENT' });
  // Don't immediately set isStudentWindowOpen = false
  // Wait for heartbeat timeout to confirm closure
};

// Student side: listen for close command
useEffect(() => {
  if (lastMessage?.type === 'CLOSE_STUDENT') {
    window.close();
  }
}, [lastMessage]);
```

### Button Tooltip for Keyboard Shortcuts
```typescript
// Source: HTML title attribute, WAI-ARIA patterns
// Simple approach using title attribute for keyboard shortcut hints

<button
  onClick={handlePrev}
  title="Previous (Left Arrow or Page Up)"
  className="..."
>
  Back
</button>

<button
  onClick={handleNext}
  title="Next (Right Arrow or Page Down)"
  className="..."
>
  {/* ... */}
</button>

// For the student close button on Escape
<button
  onClick={handleCloseStudent}
  title="Close student window (Escape)"
  className="..."
>
  Close Student
</button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| window.opener communication | BroadcastChannel | Widely available 2022 | No window reference needed |
| keyCode property | event.key string | keyCode deprecated | Cross-browser consistent |
| onkeypress event | onkeydown event | keypress deprecated | Captures all keys |
| localStorage for session ID | sessionStorage | Always available | Tab-isolated storage |

**Deprecated/outdated:**
- `keyCode` property: Use `event.key` instead
- `onkeypress` event: Use `onkeydown` for all key events
- `window.opener` for popup communication: Use BroadcastChannel

## Open Questions

Things that couldn't be fully resolved:

1. **Should heartbeat start immediately or after first connection?**
   - What we know: Starting immediately means teacher always knows "not connected yet" vs "was connected, now disconnected"
   - What's unclear: Performance impact of continuous heartbeat when student window never opened
   - Recommendation: Start heartbeat only after first STATE_REQUEST received from student. This indicates student window exists.

2. **Heartbeat interval trade-off?**
   - What we know: 2s interval with 5s timeout means worst-case 5s delay detecting closure
   - What's unclear: Is 5s too slow for teacher feedback?
   - Recommendation: Start with 2s/5s, can tune down to 1s/3s if users complain about lag

3. **Should Escape close student window AND exit presentation?**
   - What we know: CONTEXT.md says Escape closes student window remotely
   - What's unclear: Current code has Escape calling onExit (exit presentation entirely)
   - Recommendation: Change Escape to close student window only. Add separate "Exit Presentation" button or key combo (maybe Shift+Escape)

## Sources

### Primary (HIGH confidence)
- [MDN: BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) - API reference, no built-in presence detection
- [MDN: KeyboardEvent key values](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values) - Standard key names for PageUp, PageDown, Arrow keys
- [MDN: sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage) - Tab-isolated storage behavior
- [Chrome Developers: BroadcastChannel](https://developer.chrome.com/blog/broadcastchannel) - Usage patterns, pub/sub semantics

### Secondary (MEDIUM confidence)
- [DigitalOcean: BroadcastChannel API](https://www.digitalocean.com/community/tutorials/js-broadcastchannel-api) - Cross-tab communication patterns
- [LogRocket: Custom Toast Component](https://blog.logrocket.com/how-to-create-custom-toast-component-react/) - React toast implementation
- [DEV.to: Managing Global DOM Events in React](https://dev.to/akumzy/managing-global-dom-events-in-react-with-hooks-3ckl) - useEffect + addEventListener patterns
- [Inclusive Components: Tooltips](https://inclusive-components.design/tooltips-toggletips/) - Accessible tooltip patterns

### Tertiary (LOW confidence)
- Heartbeat interval values (2s/5s) - Common practice, not from official source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native APIs, no external dependencies
- Architecture: HIGH - Extends existing patterns in codebase
- Heartbeat pattern: MEDIUM - Standard practice but interval values are heuristics
- Keyboard handling: HIGH - MDN standardized key values
- Session persistence: HIGH - sessionStorage behavior well-documented

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - patterns are stable)
