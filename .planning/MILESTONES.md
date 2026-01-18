# Project Milestones: PiPi

## v1.1 Draggable Preview Window (Shipped: 2026-01-18)

**Delivered:** Fully interactive floating preview window with drag, resize, snap-to-grid, and session persistence.

**Phases completed:** 1-2 (3 plans total)

**Key accomplishments:**

- FloatingWindow component with react-rnd for drag + resize with aspect ratio lock
- Corner-only resize handles with hover reveal and 80% drag opacity feedback
- Edge magnetism (20px threshold) snaps preview to viewport edges
- useViewportBounds hook keeps preview visible when browser resizes
- Per-presentation localStorage persistence (position, size, snap state)
- Snap-to-grid toggle with 50px invisible grid for precise positioning

**Stats:**

- 20 files created/modified
- 4,361 lines of TypeScript (project total)
- 2 phases, 3 plans
- Same day (8 hours from milestone start to ship)

**Git range:** `cbf9aa5` → `469168f`

**What's next:** v2 enhancements (elapsed time display, fullscreen recovery) or new features

---

## v1.0 Dual-Monitor Student View (Shipped: 2026-01-18)

**Delivered:** Rock-solid dual-monitor presentation mode where students see only slides on a projector while teachers see slides plus teleprompter on their laptop.

**Phases completed:** 1-3 (6 plans total)

**Key accomplishments:**

- BroadcastChannel sync infrastructure for type-safe cross-window messaging
- Reliable popup launch with fallback UI for manual projector setup
- Auto projector placement via Window Management API on Chromium browsers
- Connection monitoring with heartbeat status and reconnection toasts
- Presenter remote support (Page Up/Down, Arrow keys, Space, Escape)
- Next slide preview thumbnail in teacher view

**Stats:**

- 32 files created/modified
- 3,803 lines of TypeScript
- 3 phases, 6 plans
- 1 day from start to ship

**Git range:** `94aa4ac` → `c83bd70`

**What's next:** v2 enhancements (elapsed time, fullscreen recovery) or new features

---
