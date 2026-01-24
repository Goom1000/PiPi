# Phase 28: Caching & Backward Compatibility - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Persist generated verbosity scripts per slide so switching levels is instant, and ensure existing presentations load without errors. Cache survives browser refresh and is saved in .cue/.pipi files.

</domain>

<decisions>
## Implementation Decisions

### Default behavior
- Always start at Standard verbosity when opening a presentation (no "remember last used")
- When navigating between slides during a lesson, keep current verbosity selection (don't reset)
- If navigating to a slide that has cached scripts for the current level, show cached content instantly (no loading)
- Only generate scripts on-demand when teacher clicks a verbosity button (no pre-caching or background generation)

### Claude's Discretion
- Cache storage structure (memory vs persisted state, key format)
- File format changes for .cue/.pipi verbosity cache storage
- Cache invalidation strategy (when slide content changes, etc.)
- How to handle existing presentations without verbosity data

</decisions>

<specifics>
## Specific Ideas

- Teacher experience: switching back to a previously-generated level should feel instant
- Verbosity selection "sticks" as you navigate slides, so if teaching in Detailed mode, every slide shows Detailed (generating on-demand if not cached)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 28-caching-backward-compatibility*
*Context gathered: 2026-01-24*
