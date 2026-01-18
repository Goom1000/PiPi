# Phase 2: Snap-to-Grid & Persistence - Research

**Researched:** 2026-01-18
**Domain:** Grid snapping, localStorage persistence, visual feedback overlays
**Confidence:** HIGH

## Summary

This phase adds snap-to-grid functionality and position/size persistence to the existing `FloatingWindow` component built in Phase 1. The research investigated react-rnd's built-in grid snapping capabilities, localStorage persistence patterns for React, and techniques for visual grid overlay feedback.

**Key finding:** react-rnd already provides `dragGrid` and `resizeGrid` props that handle snap-to-grid natively. The main implementation work is: (1) toggling these props on/off, (2) drawing a visual grid overlay during drag, and (3) persisting state to localStorage using a custom hook with the `visibilitychange` event.

**Primary recommendation:** Use react-rnd's native grid props with a toggle mechanism; implement a `usePreviewPersistence` hook that saves on `visibilitychange` event; draw grid lines using a CSS/SVG overlay with `pointer-events: none`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-rnd | ^10.5.2 (already installed) | Grid snapping via `dragGrid`/`resizeGrid` props | Built-in support, no additional dependencies |
| localStorage (Web API) | N/A | State persistence | Browser-native, 5-10MB per domain, sufficient for small state |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | - | - | All requirements met by react-rnd and browser APIs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-rnd grid props | Custom magnetic snap calculation | More code, harder to maintain, react-rnd handles edge cases |
| localStorage | IndexedDB | Overkill for ~200 bytes of state; IndexedDB adds async complexity |
| localStorage | sessionStorage | Data cleared on browser close; user explicitly wants cross-session persistence |
| visibilitychange for save | beforeunload | beforeunload unreliable on mobile, breaks Firefox bfcache |

**Installation:**
```bash
# No additional packages needed - react-rnd already installed
```

## Architecture Patterns

### Recommended Component Structure
```
components/
├── FloatingWindow.tsx          # Extend with snap grid props + toggle button
├── GridOverlay.tsx             # NEW - visual grid lines during drag (optional, can inline)
hooks/
├── useViewportBounds.ts        # Existing - viewport constraint
├── usePreviewPersistence.ts    # NEW - save/load position, size, snap state
```

### Pattern 1: react-rnd Grid Snapping
**What:** Native grid snapping using `dragGrid` and `resizeGrid` props
**When to use:** Always - this is the primary mechanism for snap-to-grid
**Example:**
```typescript
// Source: react-rnd GitHub documentation
import { Rnd } from 'react-rnd';

const GRID_SIZE = 50; // 50px grid per CONTEXT.md decision

<Rnd
  dragGrid={snapEnabled ? [GRID_SIZE, GRID_SIZE] : [1, 1]}
  resizeGrid={snapEnabled ? [GRID_SIZE, GRID_SIZE] : [1, 1]}
  // ... other props
>
  {children}
</Rnd>
```

**Note:** Grid snapping is "global" - it snaps to a grid starting from (0,0) of the viewport, not relative to the element's initial position. This is expected behavior and aligns with a "full viewport grid" mental model.

### Pattern 2: Magnetic Snap (Hybrid Approach)
**What:** Combine grid prop toggling with threshold-based "pull" effect
**When to use:** Per CONTEXT.md - "Magnetic snap - free drag, but preview 'pulls' to nearest grid point when close"
**Example:**
```typescript
// Source: Custom implementation based on interact.js snap concepts
const GRID_SIZE = 50;
const MAGNET_THRESHOLD = 15; // Pull within 15px of grid line

function applyMagneticSnap(value: number): number {
  const nearest = Math.round(value / GRID_SIZE) * GRID_SIZE;
  const distance = Math.abs(value - nearest);

  if (distance <= MAGNET_THRESHOLD) {
    return nearest; // Snap to grid
  }
  return value; // Free position
}

// Apply on drag stop (not during drag for smoother UX)
const handleDragStop: RndDragCallback = (e, data) => {
  if (snapEnabled) {
    const snappedPos = {
      x: applyMagneticSnap(data.x),
      y: applyMagneticSnap(data.y),
    };
    setPosition(snappedPos);
    rndRef.current?.updatePosition(snappedPos);
  }
};
```

**Important:** react-rnd's `dragGrid` snaps during drag (every frame), while magnetic snap only pulls at drag stop. CONTEXT.md says "pulls to nearest grid point when close" which suggests on-stop behavior. Recommend: Use `dragGrid` for "hard" snap mode, magnetic calculation for "soft" snap if needed.

### Pattern 3: localStorage Persistence Hook
**What:** Custom hook that loads initial state from localStorage and saves on visibility change
**When to use:** For all persisted preview state
**Example:**
```typescript
// Source: Josh Comeau's useStickyState + MDN visibilitychange
import { useState, useEffect, useCallback, useRef } from 'react';

interface PreviewState {
  x: number;
  y: number;
  width: number;
  height: number;
  snapEnabled: boolean;
}

const STORAGE_KEY_PREFIX = 'pipi-preview-';

export function usePreviewPersistence(
  presentationId: string,
  defaultState: PreviewState
): [PreviewState, (updates: Partial<PreviewState>) => void] {
  const storageKey = `${STORAGE_KEY_PREFIX}${presentationId}`;

  // Lazy initialization from localStorage
  const [state, setState] = useState<PreviewState>(() => {
    if (typeof window === 'undefined') return defaultState;

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate parsed data has expected shape
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return { ...defaultState, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to parse preview state from localStorage:', e);
    }
    return defaultState;
  });

  // Ref to track latest state for save handler
  const stateRef = useRef(state);
  stateRef.current = state;

  // Save to localStorage
  const saveToStorage = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(stateRef.current));
    } catch (e) {
      console.warn('Failed to save preview state to localStorage:', e);
    }
  }, [storageKey]);

  // Save on visibility change (tab hidden, app backgrounded)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveToStorage();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also save on beforeunload as backup (desktop browsers)
    window.addEventListener('beforeunload', saveToStorage);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', saveToStorage);
      // Save on unmount as well
      saveToStorage();
    };
  }, [saveToStorage]);

  const updateState = useCallback((updates: Partial<PreviewState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return [state, updateState];
}
```

### Pattern 4: Visual Grid Overlay
**What:** SVG or CSS-based grid lines that appear during drag when snap is enabled
**When to use:** Per CONTEXT.md - "Grid lines appear while dragging with snap enabled"
**Example:**
```typescript
// Source: react-grid-layout pattern + shadcn grid background
interface GridOverlayProps {
  gridSize: number;
  visible: boolean;
}

const GridOverlay: React.FC<GridOverlayProps> = ({ gridSize, visible }) => {
  if (!visible) return null;

  return (
    <svg
      className="pointer-events-none fixed inset-0 w-full h-full"
      style={{ zIndex: 9998 }} // Below FloatingWindow (9999)
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="grid-pattern"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke="rgba(99, 102, 241, 0.2)" // Subtle indigo
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  );
};
```

### Pattern 5: Toggle Button on Window
**What:** Small toggle button in corner of FloatingWindow to enable/disable snap
**When to use:** Always - this is the primary UI for snap control
**Example:**
```typescript
// Source: CONTEXT.md decisions
interface SnapToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

const SnapToggle: React.FC<SnapToggleProps> = ({ enabled, onToggle }) => (
  <button
    onClick={onToggle}
    className={`
      absolute top-2 right-2
      w-6 h-6 rounded
      flex items-center justify-center
      transition-colors duration-150
      ${enabled
        ? 'bg-indigo-500 text-white'
        : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
      }
    `}
    title={enabled ? 'Snap to grid ON' : 'Snap to grid OFF'}
  >
    {/* Grid icon - same icon, color changes */}
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
      />
    </svg>
  </button>
);
```

### Anti-Patterns to Avoid
- **Don't save to localStorage on every drag/resize event:** Causes performance issues; save only on session end
- **Don't use beforeunload alone:** Unreliable on mobile, breaks Firefox bfcache; use visibilitychange
- **Don't draw grid lines with hundreds of DOM elements:** Use SVG pattern for performance
- **Don't fight react-rnd's grid snap with competing calculations:** Let dragGrid/resizeGrid handle it
- **Don't store sensitive data in localStorage:** Preview position is fine, but never tokens/credentials

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Grid snapping during drag | Manual position calculation | react-rnd `dragGrid` prop | Already handles all edge cases, frame-by-frame snapping |
| Grid snapping during resize | Manual size calculation | react-rnd `resizeGrid` prop | Handles aspect ratio + grid together |
| Save timing (session end) | setInterval or every-change | `visibilitychange` event | Browser-recommended, reliable across mobile |
| Grid visualization | Canvas drawing | SVG pattern element | Simpler, better performance, scales with viewport |

**Key insight:** react-rnd was explicitly designed for grid snapping - the `dragGrid` and `resizeGrid` props are first-class features, not afterthoughts. Don't re-implement this logic.

## Common Pitfalls

### Pitfall 1: Grid Snap is Global, Not Relative
**What goes wrong:** User expects element to snap relative to its current position, but it snaps to global grid
**Why it happens:** react-rnd's grid is calculated from viewport (0,0), not element origin
**How to avoid:** This is actually correct behavior for a "full viewport grid" UX; document it, don't fight it
**Warning signs:** User drags from edge position and it "jumps" on first snap

### Pitfall 2: localStorage Quota Exceeded
**What goes wrong:** setItem fails silently or throws
**Why it happens:** User has filled localStorage with other sites' data (5-10MB limit shared)
**How to avoid:** Wrap setItem in try-catch; preview state is tiny (~100 bytes), unlikely to hit
**Warning signs:** Position doesn't persist between sessions for some users

### Pitfall 3: Saved Position Off-Screen After Resize
**What goes wrong:** User resizes browser, saved position is now outside viewport
**Why it happens:** Position was saved at 1920px width, restored at 1366px width
**How to avoid:** On load, validate position against current viewport; adjust if needed (clamp to visible)
**Warning signs:** Preview appears "missing" after restore
**Example fix:**
```typescript
function clampToViewport(pos: { x: number; y: number }, size: { width: number; height: number }) {
  return {
    x: Math.max(0, Math.min(pos.x, window.innerWidth - size.width)),
    y: Math.max(0, Math.min(pos.y, window.innerHeight - size.height)),
  };
}
```

### Pitfall 4: JSON Parse Errors on Corrupt Data
**What goes wrong:** App crashes on load due to malformed localStorage data
**Why it happens:** Manual localStorage edits, browser bugs, or version migration
**How to avoid:** Wrap JSON.parse in try-catch; validate shape before using
**Warning signs:** White screen on second visit

### Pitfall 5: Grid Lines Blocking Interactions
**What goes wrong:** User can't click through grid overlay
**Why it happens:** SVG element captures pointer events
**How to avoid:** Always use `pointer-events: none` on grid overlay
**Warning signs:** Drag feels "stuck" or unresponsive when grid visible

### Pitfall 6: Rapid State Updates Causing Lag
**What goes wrong:** Choppy drag when persisting state
**Why it happens:** Writing to localStorage synchronously on every position change
**How to avoid:** Only persist on visibility change / session end, not during drag
**Warning signs:** Noticeable lag during drag when persistence is enabled

## Code Examples

Verified patterns from official sources:

### Complete FloatingWindow Extension for Snap
```typescript
// Source: react-rnd documentation + CONTEXT.md decisions
import { Rnd } from 'react-rnd';
import { useState, useRef } from 'react';

const GRID_SIZE = 50;

interface FloatingWindowProps {
  children: React.ReactNode;
  initialPosition: { x: number; y: number };
  initialSize: { width: number; height: number };
  snapEnabled: boolean;
  onSnapToggle: () => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
}

const FloatingWindow: React.FC<FloatingWindowProps> = ({
  children,
  initialPosition,
  initialSize,
  snapEnabled,
  onSnapToggle,
  onPositionChange,
  onSizeChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <>
      {/* Grid overlay - only during drag with snap enabled */}
      {isDragging && snapEnabled && <GridOverlay gridSize={GRID_SIZE} />}

      <Rnd
        position={initialPosition}
        size={initialSize}
        dragGrid={snapEnabled ? [GRID_SIZE, GRID_SIZE] : [1, 1]}
        resizeGrid={snapEnabled ? [GRID_SIZE, GRID_SIZE] : [1, 1]}
        onDragStart={() => setIsDragging(true)}
        onDragStop={(e, d) => {
          setIsDragging(false);
          onPositionChange({ x: d.x, y: d.y });
        }}
        onResizeStop={(e, dir, ref, delta, pos) => {
          onSizeChange({ width: ref.offsetWidth, height: ref.offsetHeight });
          onPositionChange(pos);
        }}
        // ... other existing props
      >
        {/* Snap toggle button */}
        <button
          onClick={onSnapToggle}
          className={`absolute top-2 right-2 w-6 h-6 rounded ${
            snapEnabled ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'
          }`}
        >
          {/* Grid icon */}
        </button>
        {children}
      </Rnd>
    </>
  );
};
```

### localStorage Key Strategy for Per-Presentation Storage
```typescript
// Source: Community pattern + CONTEXT.md "Per-presentation storage"
// Option 1: Use first slide ID (most stable)
const getStorageKey = (slides: Slide[]) => {
  if (slides.length === 0) return 'pipi-preview-default';
  return `pipi-preview-${slides[0].id}`;
};

// Option 2: Use lesson title hash (more human-readable in devtools)
const getStorageKey = (lessonTitle: string) => {
  const sanitized = lessonTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
  return `pipi-preview-${sanitized}`;
};

// Recommendation: Use slide[0].id as it's guaranteed unique per generation
```

### Viewport Bounds Validation on Load
```typescript
// Source: CONTEXT.md edge case requirements
function validateAndAdjustPosition(
  saved: { x: number; y: number; width: number; height: number }
): { x: number; y: number; width: number; height: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let { x, y, width, height } = saved;

  // Clamp size first
  width = Math.min(width, vw);
  height = Math.min(height, vh);

  // Then adjust position to keep visible
  // "stay as close to original position as possible"
  if (x + width > vw) {
    x = Math.max(0, vw - width);
  }
  if (y + height > vh) {
    y = Math.max(0, vh - height);
  }

  return { x, y, width, height };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| beforeunload for save | visibilitychange + beforeunload | 2020+ | Reliable mobile support, bfcache friendly |
| Custom snap calculations | Library-native grid props | 2018+ (react-rnd) | Less code, fewer bugs |
| Canvas-based grid drawing | SVG pattern | N/A | Better performance, simpler code |
| Sync localStorage on every change | Lazy save on session end | Always best practice | Prevents performance degradation |

**Deprecated/outdated:**
- **unload event:** Deprecated; use beforeunload or visibilitychange
- **returnValue in beforeunload:** Legacy - use event.preventDefault() for modern browsers

## Open Questions

Things that couldn't be fully resolved:

1. **Exact Grid Size**
   - What we know: CONTEXT.md says "Medium grid size (50-60px)"
   - What's unclear: Whether 50px or 60px feels better in practice
   - Recommendation: Start with 50px (cleaner math), make it a constant for easy adjustment

2. **Magnetic Threshold vs Hard Grid**
   - What we know: CONTEXT.md says "magnetic snap - pulls to nearest grid point when close"
   - What's unclear: Whether to use react-rnd's dragGrid (hard snap every frame) or custom magnetic calculation (snap on release only)
   - Recommendation: Start with dragGrid (simpler), evaluate UX; magnetic can be added later if needed

3. **Grid Line Styling**
   - What we know: Grid lines should appear during drag when snap enabled
   - What's unclear: Exact color/opacity/style preferences
   - Recommendation: Start with subtle indigo (rgba(99, 102, 241, 0.2)) matching accent color; adjust based on feedback

4. **Presentation Identifier for Storage**
   - What we know: Storage should be "per-presentation"
   - What's unclear: Best identifier - lessonTitle, first slide ID, or hash?
   - Recommendation: Use `slides[0].id` - guaranteed unique from generation, won't collide

## Sources

### Primary (HIGH confidence)
- [react-rnd GitHub](https://github.com/bokuweb/react-rnd) - `dragGrid`, `resizeGrid` API documentation
- [MDN visibilitychange](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event) - Event reliability, best practices
- [MDN beforeunload](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event) - Mobile limitations, bfcache issues

### Secondary (MEDIUM confidence)
- [Josh Comeau - Persisting React State in localStorage](https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/) - useStickyState pattern, lazy initialization
- [react-rnd Issue #434](https://github.com/bokuweb/react-rnd/issues/434) - Grid snap behavior discussion
- [interact.js Snapping Docs](https://interactjs.io/docs/snapping/) - Snap modifier concepts (for magnetic pattern reference)

### Tertiary (LOW confidence)
- [shadcn Grid Pattern](https://www.shadcn.io/background/grid-pattern) - SVG pattern approach for grid visualization
- [GSAP Draggable](https://gsap.com/docs/v3/Plugins/Draggable/) - liveSnap radius concept (alternative pattern)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-rnd grid props are documented first-party features
- Architecture: HIGH - Patterns verified in react-rnd docs and MDN
- Persistence: HIGH - visibilitychange is MDN-recommended replacement for beforeunload
- Grid visualization: MEDIUM - Standard SVG pattern technique, but exact styling needs validation

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - stable domain, browser APIs don't change rapidly)
