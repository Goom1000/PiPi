# Phase 25: Competition Modes - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Teacher can choose individual or team competition for any game. Competition mode selection appears in existing game setup modals. Score displays show player name or team names with scores. This phase adds the competition layer to all existing games.

</domain>

<decisions>
## Implementation Decisions

### Mode Selection UI
- Add to existing game setup modals as a collapsible "Competition Mode" section
- Default to Individual mode (most common classroom use case)
- Identical mode selector UI appears in every game setup modal (Quick Quiz, Millionaire, The Chase, Beat the Chaser)

### Team Configuration
- Teacher can choose any number of teams (no fixed limit)
- AI generates fun random team names using adjective+object or verb+animal patterns (e.g., "Smelly Totems", "Running Monkeys")
- Team names appropriate for children aged ~10
- Teacher can edit team names after generation
- Refresh button regenerates all team names at once

### Individual Player Identity
- Optional name field — teacher can enter student name or leave blank
- Default label when no name: "Player"
- Player name editable anytime during gameplay (not locked)

### Claude's Discretion
- Whether team scores persist across games in same session (per-game vs cumulative)
- Whether player name persists between games
- Team name generation implementation details
- Number input UI for team count

</decisions>

<specifics>
## Specific Ideas

- Team names should be kid-friendly and fun — two random words like "adjective + object" or "verb + living thing"
- Examples: "Smelly Totems", "Running Monkeys", "Jumping Dolphins"
- Scores display as floating/overlay badges on screen
- Active team indicated by glowing border ring around their score badge
- Hybrid scoring: auto-score from game outcome with manual correction option
- Teams rotate automatically per question (no manual "next team" button needed)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 25-competition-modes*
*Context gathered: 2026-01-24*
