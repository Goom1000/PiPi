# Phase 35: Persistence - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Save/load deck verbosity level with backward compatibility. When saving, include deck verbosity in .cue file. When loading, restore verbosity level. When loading v2 files (no deck verbosity), default to Standard.

</domain>

<decisions>
## Implementation Decisions

### File format strategy
- Store verbosity as top-level field (`deckVerbosity`) alongside existing root fields
- Bump file format version from v2 to v3
- Auto-migrate v2 files to v3 on save (re-saving upgrades the file)

### Default behavior
- Loading v2 files (no verbosity field) defaults to Standard verbosity
- This matches the upload default and user expectations

### Claude's Discretion
- Forward compatibility (whether v3 files work with older app versions)
- Handling of missing/invalid verbosity fields (fallback + logging approach)
- Whether to regenerate teleprompter content when loading v2 files vs preserve existing
- Whether to clear or preserve per-slide verbosity caches from v2 files
- Migration notification UX (silent vs subtle indicator)
- Whether verbosity selector reflects loaded value immediately (expected: yes)
- Error handling patterns for load failures
- Any additional verbosity level indicators in UI beyond the selector

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The key constraint is backward compatibility with v2 files.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 35-persistence*
*Context gathered: 2026-01-25*
