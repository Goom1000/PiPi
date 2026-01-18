# PiPi (Presentation Intelligence)

## What This Is

A presentation tool for teachers that transforms PDF lesson plans into interactive slideshows with AI-generated content, a teleprompter script for the teacher, and progressive bullet reveal. Teachers upload their existing lesson plans, select student age/grade level, and the AI creates an engaging presentation with speaker notes that guide the teacher through natural, conversational delivery.

**v1.2 shipped:** Dual-monitor presentation mode with permission UX polish — auto-projector placement on Chromium, draggable/resizable preview window, and reliable permission handling.

## Current Milestone: v2.0 Shareable Presentations

**Goal:** Enable colleagues to use presentations you create by deploying to GitHub Pages with save/load functionality and multi-provider API support.

**Target features:**
- Save presentation (slides + source PDF) to downloadable `.pipi` file
- Load presentation from file — each teacher enters their own class list
- Multi-provider AI support (Google Gemini, Anthropic Claude, OpenAI) — user picks one
- API key stored locally in browser, never transmitted to any server
- AI features visible but disabled when no key configured
- Setup instructions with cost information for each provider
- GitHub Pages deployment for free public hosting

## Shipped Milestones

### v1.2 Permission Flow Fix (Shipped 2026-01-18)

**Delivered:** Fixed permission detection race condition and improved permission UX with dynamic button labels, inline permission requests, and browser-specific recovery guidance.

Auto-projector placement is now reliable and obvious in the classroom.

### v1.1 Draggable Preview Window (Shipped 2026-01-18)

**Delivered:** Fully interactive floating preview window with drag, resize, snap-to-grid, and session persistence.

**Features shipped:**
- Draggable preview window (click center to move anywhere on screen)
- Resizable preview window (drag corners to adjust size, aspect ratio locked)
- Snap-to-grid toggle button with 50px invisible grid
- Position/size persistence (localStorage per presentation)
- Preview floats above all UI via portal rendering (z-index 9999)

## Core Value

Students see only the presentation; teachers see the presentation plus a teleprompter script that lets them sound knowledgeable and natural without reading slides verbatim.

## Requirements

### Validated

- ✓ PDF lesson plan upload and parsing — existing
- ✓ AI-powered slide generation (Gemini) — existing
- ✓ Progressive bullet reveal during presentation — existing
- ✓ Teleprompter/speaker notes panel for teacher — existing
- ✓ Student name integration for reading assignments — existing
- ✓ Differentiated question generation (Grade A/B/C) — existing
- ✓ Kahoot-style quiz/game mode — existing
- ✓ PPTX export — existing
- ✓ Dark mode support — existing
- ✓ Slide editing capabilities — existing
- ✓ Student window launches reliably (no popup blocker issues) — v1.0
- ✓ Teacher/student views perfectly synchronized — v1.0
- ✓ Student window shows only slides (no controls) — v1.0
- ✓ Auto projector placement on Chromium — v1.0
- ✓ Manual placement instructions on Firefox/Safari — v1.0
- ✓ Presenter remote navigation (Page Up/Down) — v1.0
- ✓ Next slide preview thumbnail — v1.0
- ✓ Window recovery (button re-enables on close) — v1.0
- ✓ Connection status indicator — v1.0
- ✓ Session persistence (survives refresh) — v1.0
- ✓ Draggable preview window — v1.1
- ✓ Resizable preview window (corner drag with aspect ratio lock) — v1.1
- ✓ Snap-to-grid toggle (50px invisible grid) — v1.1
- ✓ Preview position/size/snap persistence (localStorage) — v1.1
- ✓ Preview floats above all UI (portal, z-index 9999) — v1.1
- ✓ Permission state loading gates UI (race condition fixed) — v1.2
- ✓ Dynamic button labels for auto-placement status — v1.2
- ✓ Inline permission request link — v1.2
- ✓ Browser-specific recovery guidance for denied permissions — v1.2

### Active

- [ ] Save presentation to downloadable .pipi file (slides + source PDF)
- [ ] Load presentation from .pipi file
- [ ] Multi-provider AI support (Gemini, Claude, OpenAI)
- [ ] API key settings UI with local storage
- [ ] AI features disabled state when no API key
- [ ] Provider setup instructions with cost information
- [ ] GitHub Pages deployment configuration

### Deferred (v1.3+)

- [ ] Elapsed time display showing presentation duration (PRES-03)
- [ ] Fullscreen recovery (auto re-enter if exited) (PRES-04)

### Out of Scope

- Real-time student device sync (each student on their own device) — high complexity, not needed for classroom projector setup
- Cloud storage/authentication — file-based sharing is sufficient for team of 5
- Mobile app — web-first
- Annotation tools / laser pointer — scope creep, PiPi is teleprompter-focused
- Slide transitions / animations — not core to teleprompter value
- Video embedding — storage/bandwidth concerns
- User accounts / login system — colleagues load shared files, no auth needed
- Desktop installer (Electron/Tauri) — GitHub Pages simpler, free, auto-updates

## Context

### Current State

Shipped v1.2 with 4,499 LOC TypeScript.
Tech stack: React 19, Vite, Gemini API, Tailwind CSS, react-rnd.
Client-side only (no backend).

v1.2 delivered permission UX improvements:
- isLoading state pattern prevents race condition
- Dynamic button labels ("Launch → External Display")
- Inline permission request link
- Browser-specific recovery modal (Chrome/Edge)
- Warning icon for denied state

v1.1 delivered interactive preview window:
- react-rnd for drag/resize with aspect ratio lock
- Portal-based floating UI for z-index isolation
- Edge magnetism snaps preview to viewport edges
- Per-presentation localStorage persistence
- Invisible snap-to-grid (50px) with toggle button

v1.0 delivered rock-solid dual-monitor presentation:
- BroadcastChannel cross-window sync
- Window Management API for auto projector placement
- Heartbeat-based connection monitoring
- Keyboard navigation for presenter remotes

### Technical Environment

- React 19 SPA with Vite
- Gemini API for AI generation
- Tailwind CSS for styling
- No backend — client-side only
- CDN-loaded dependencies (PDF.js, PptxGenJS, html2pdf)

## Constraints

- **Tech stack**: Must remain a client-side SPA (no server). React + Vite.
- **Browser APIs**: Limited to what modern browsers provide (Window Management API, Presentation API, or fullscreen heuristics)
- **Backward compatibility**: Must not break existing functionality (editing, presenting, quizzes)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| BroadcastChannel for sync | Cross-window messaging without server | ✓ Good — reliable, fast |
| Hash-based routing | No react-router dependency | ✓ Good — simple, works |
| Synchronous window.open | Preserve user activation for popup | ✓ Good — bypasses blockers |
| Fire-and-forget popup | BroadcastChannel handles all sync | ✓ Good — no window tracking needed |
| Heartbeat for connection | Detect closed windows reliably | ✓ Good — survives refresh |
| Window Management API | Auto projector placement | ✓ Good — works on Chromium |
| Escape closes student | Safer than exiting presentation | ✓ Good — prevents accidents |
| react-rnd for drag+resize | Only library combining drag + resize with aspect ratio lock | ✓ Good — v1.1 |
| 20px edge magnetism | Snap preview to viewport edges for neat positioning | ✓ Good — v1.1 |
| Portal rendering | Float above all UI via document.body portal (z-index 9999) | ✓ Good — v1.1 |
| Corner-only resize handles | Clean appearance, handles appear on hover | ✓ Good — v1.1 |
| Per-presentation storage key | Uses first slide ID for storage key uniqueness | ✓ Good — v1.1 |
| 50px invisible grid | Precision snapping without visual clutter | ✓ Good — v1.1 |
| isLoading state pattern | Safe default prevents race condition | ✓ Good — v1.2 |
| Friendly display label | "External Display" instead of raw device name | ✓ Good — v1.2 |
| Inline permission link | Simpler than popup-based explainer | ✓ Good — v1.2 |
| Browser detection order | Check Edg/ before Chrome/ (Edge UA includes Chrome) | ✓ Good — v1.2 |

---
*Last updated: 2026-01-19 after v2.0 milestone start*
