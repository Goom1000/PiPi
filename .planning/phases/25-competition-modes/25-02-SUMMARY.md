---
phase: 25-competition-modes
plan: 02
subsystem: ui-components
tags: [react, typescript, ui, game-setup]
requires: [25-01]
provides:
  - CompetitionModeSection reusable component
affects: [25-03, 25-04, 25-05]
tech-stack:
  added: []
  patterns:
    - Collapsible section pattern with local state
    - Controlled component with value/onChange props
    - Inline team name editing
decisions:
  - Collapsible by default to keep setup modals compact
  - 2-10 team count range with +/- stepper controls
  - Regenerate Names button creates entirely new teams with new UUIDs
  - Team name inputs editable inline for teacher customization
  - Individual mode defaults with empty player name
key-files:
  created:
    - components/games/shared/CompetitionModeSection.tsx
  modified: []
metrics:
  duration: 69s
  completed: 2026-01-23
---

# Phase 25 Plan 02: Competition Mode UI Component Summary

**One-liner:** Reusable collapsible section for Individual/Team competition setup with fun auto-generated team names

## What Was Built

Created `CompetitionModeSection` component - a reusable UI section that all game setup modals can embed to configure competition modes. Component provides:

1. **Collapsible header** - Collapsed by default to keep modals compact, expands on click
2. **Mode toggle** - Two-button toggle between Individual and Team modes
3. **Individual mode** - Single text input for optional player name (defaults to "Player")
4. **Team mode** - Team count stepper (2-10 range), editable team names, regenerate button
5. **Consistent styling** - Matches existing modal patterns from SetupModal.tsx

## Technical Implementation

**Component Architecture:**
- Controlled component pattern: `value: CompetitionMode` and `onChange: (mode: CompetitionMode) => void`
- Local expansion state managed internally with `useState`
- Type guards ensure type-safe handling of discriminated union (`value.mode === 'team'`)

**Team Count Controls:**
- Min: 2 teams (enforced with `Math.max(2, value.teams.length - 1)`)
- Max: 10 teams (enforced with `Math.min(10, value.teams.length + 1)`)
- Disabled states prevent invalid input

**Team Name Regeneration:**
- Regenerate button calls `createTeams(value.teams.length)` to generate fresh team names
- Each regeneration creates new Team objects with new UUIDs (stable React keys)
- Resets `activeTeamIndex` to 0

**Styling Patterns:**
- Amber accent color for active states (matches game branding)
- Slate backgrounds with semi-transparent overlays
- Smooth transitions and hover states
- Scrollable team list with `max-h-48 overflow-y-auto` for many teams

## Integration Points

**Imports:**
```typescript
import { CompetitionMode, Team } from '../../../types';
import { createTeams } from '../../../utils/teamNameGenerator';
```

**Usage Pattern (for Plan 03-05):**
```typescript
const [competitionMode, setCompetitionMode] = useState<CompetitionMode>({
  mode: 'individual',
  playerName: ''
});

<CompetitionModeSection
  value={competitionMode}
  onChange={setCompetitionMode}
  defaultExpanded={false}  // Optional
/>
```

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|---------|
| Collapsible by default | Keeps setup modals compact for common case | Teachers expand only when customizing |
| 2-10 team range | Practical classroom limit | Prevents unusable team counts |
| Regenerate creates new UUIDs | Ensures stable React keys | Teams are replaced, not mutated |
| Inline team name editing | Fast teacher workflow | No separate edit modal needed |
| Empty string default for playerName | Optional identity | UI shows "Player" when blank |

## Metrics

- **Files created:** 1 (CompetitionModeSection.tsx)
- **Lines of code:** 196
- **TypeScript compilation:** Clean (no errors)
- **Commits:** 1 (e4ff5d1)
- **Duration:** 69 seconds

## Next Phase Readiness

**Ready for:** Plan 25-03 (Quick Quiz integration)

**Blockers:** None

**Integration checklist:**
- [ ] Import CompetitionModeSection into game setup modals
- [ ] Add competitionMode state to game orchestrator components
- [ ] Pass competitionMode to game state factories
- [ ] Update student view to display player/team names

**Notes for next plans:**
- Component is stateless (except for expansion) - parent manages competition mode value
- Team rotation logic (activeTeamIndex increment) happens in game orchestrators
- Score tracking per team/player happens in game state
- UI for displaying scores/badges not in this component (separate plan)

## Deviations from Plan

None - plan executed exactly as written.

---
**Completed:** 2026-01-23 20:51 UTC
**Commit:** e4ff5d1
