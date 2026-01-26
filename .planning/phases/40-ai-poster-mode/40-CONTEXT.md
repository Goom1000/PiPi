# Phase 40: AI Poster Mode - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform selected slides into educational wall posters with AI enhancement. Teachers select AI Poster mode from the export modal (built in Phase 39), AI generates polished educational reference materials optimized for classroom wall display, and teacher downloads as A4 PDF.

</domain>

<decisions>
## Implementation Decisions

### Poster visual style
- Mixed typography formats — AI decides based on content type (some get bullets, some get paragraphs)
- Moderate density — 5-8 key points, balance of readability and completeness
- Subject-appropriate colors — AI picks colors that fit the topic (e.g., green for science, blue for math)

### Content transformation
- Transform everything — AI rewrites all content into polished poster language
- Match student age — AI infers reading level from content and adjusts vocabulary
- Enrich content — AI can add relevant examples, analogies, or clarifications beyond what's in the slide
- Improve titles — AI creates clearer, more engaging titles for concepts (doesn't keep original verbatim)

### Context usage
- Nearby slides — AI sees 2-3 slides before/after the selected slide for narrative context
- Subject inference — use presentation metadata if available, otherwise infer from content

### Output options
- One PDF, multiple pages — single download with each poster as a page
- Optional preview — show generated posters but allow direct download too
- Regenerate button — teacher can request a new version of any poster they don't like
- No teacher guidance — AI handles everything automatically, no prompt field or presets

### Claude's Discretion
- Visual elements (dividers, shapes, color blocks) — pick appropriate treatment based on content
- Lesson connection — judge whether referencing broader context adds clarity
- Multi-slide relationships — determine if selected slides form a natural sequence worth connecting

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

*Phase: 40-ai-poster-mode*
*Context gathered: 2026-01-27*
