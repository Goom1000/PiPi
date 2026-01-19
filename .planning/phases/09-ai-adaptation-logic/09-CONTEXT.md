# Phase 9: AI Adaptation Logic - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

AI generates appropriate content based on what files are uploaded: fresh mode (lesson only), refine mode (presentation only), or blend mode (both files). All three modes produce teleprompter scripts for every slide.

</domain>

<decisions>
## Implementation Decisions

### Refine Mode Behavior
- Extract and rebuild: Pull key concepts from existing presentation, create new PiPi-style slides from scratch
- AI decides optimal slide count based on content density (not forced to match original)
- AI may suggest improved ordering for better pedagogical flow (doesn't just preserve original order)
- Describe visuals for recreation: AI notes what images/diagrams existed so teacher knows to re-add them

### Blend Mode Strategy
- Equal weight: AI determines best combination based on content overlap between lesson and presentation
- Add new slides: If lesson PDF contains topics not in existing presentation, create additional slides to cover them
- Standardize to PiPi style: Convert all output to clean, consistent PiPi format (don't try to match original aesthetic)
- Flag conflicts: When lesson says X but slides say Y, note discrepancies for teacher review

### Output Consistency
- No references to source: Output stands alone, no mention of "adapted from slide 3" or similar markers
- Source-driven length: Output length reflects input complexity/length (not forced into consistent range)

### Teleprompter Generation
- Blend mode: Scripts synthesize both lesson and slide content into cohesive teaching narrative

### Claude's Discretion
- Output format per mode (identical vs mode-specific variations)
- Reasonable output bounds for very long or short inputs
- Refine mode script generation approach (extracted content vs inferred goals)
- Script depth per slide (consistent vs variable)
- Whether to incorporate detected speaker notes from original slides

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-ai-adaptation-logic*
*Context gathered: 2026-01-19*
