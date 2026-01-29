# Phase 42: Student-Friendly Slide Generation - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Slide content speaks directly to students in age-appropriate language. The AI already generates slides; this phase transforms the output from teacher-facing notes into student-directed content. Applies automatically to all new generations.

</domain>

<decisions>
## Implementation Decisions

### Tone and voice
- Clear instructor tone — direct but approachable ("This is...", "Remember that...")
- Use "you" to address students sometimes, not always — mix with neutral phrasing
- Consistent tone throughout — don't vary based on slide content type
- Balanced voice — not too casual (no slang/jokes), not too dry (keep some warmth)

### Age adaptation
- Subtle complexity shift — mainly vocabulary changes, sentence structure stays similar
- For younger students (KS1/KS2) — Claude decides on sentence length based on content
- Subject terminology — use term + explanation ("Photosynthesis — how plants make food")
- Older students (GCSE/A-Level) — Claude decides on assumed prior knowledge based on topic

### Content structure
- Questions to students — rarely, only when content naturally calls for it
- Bullet point beginnings — mixed, context-dependent (Claude chooses)
- Calls-to-action — include when it enhances learning or understanding
- Complete sentences — bullet points should be full sentences, not fragments

### Teacher vs student framing
- Teacher instructions ("Explain photosynthesis") — always transform into student-facing content
- Third-person references ("students will...") — Claude decides how to reframe based on context
- Teacher references in content — Claude decides when appropriate vs when to rephrase

### Claude's Discretion
- Sentence length for younger ages
- Prior knowledge assumptions for older students
- How to begin bullet points (action verbs vs topic-first)
- Specific framing choices (direct explanation vs learning objective)
- When teacher references are appropriate

</decisions>

<specifics>
## Specific Ideas

- Term + explanation pattern preferred for vocabulary: "Photosynthesis — how plants make food"
- Balance matters: direct but not robotic, clear but not cold
- The teacher provides verbal context; slides should be self-contained but not exhaustive

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 42-student-friendly-slides*
*Context gathered: 2026-01-29*
