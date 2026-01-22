# Phase 20: Game Foundation & Type System - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish unified game architecture that prevents state silos and enables all 4 game formats (Quick Quiz, Millionaire, The Chase, Beat the Chaser). Creates the type system, state management patterns, game selection UI, and proves the framework by refactoring Quick Quiz. Actual gameplay implementation for new games happens in later phases.

</domain>

<decisions>
## Implementation Decisions

### Game menu design
- Toolbar dropdown menu in existing toolbar area
- Icons + names for each game option
- All games always enabled (show requirements after clicking if not met, not before)
- Direct launch when clicking a game (no setup screen first)

### State visibility rules
- Game logo/splash screen shown to students during initialization
- Crossfade transition when switching between games
- Question position visibility is game-dependent (Millionaire shows it, Chase doesn't)
- Result screen displayed when game ends (stays until teacher advances)

### Answer reveal behavior
- Flash animation for correct answer reveal (dramatic, TV-style)
- Dramatic pause/suspense moment before revealing
- Option visibility is game-dependent (Quick Quiz shows all, Millionaire reveals dramatically)

### Game switching flow
- Confirmation dialog required when switching games mid-game
- Teacher can always exit back to presentation mode (X button or escape)
- Restart button available for quick restart with same questions
- When exiting, resume at exact slide position before game started

### Claude's Discretion
- Reveal/hide toggle behavior (one-way vs toggle)
- Exact animation timings and effects
- Technical implementation of state sync
- Error handling patterns

</decisions>

<specifics>
## Specific Ideas

- TV show feel is important — dramatic pauses, flash animations, game branding
- Smooth transitions (crossfade, not jarring swaps)
- Teacher should feel in control with easy escape/restart options

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 20-game-foundation*
*Context gathered: 2026-01-23*
