# Phase 31: Work Together Slide Insertion - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Teachers can insert AI-generated collaborative pair activities via the + menu. Activities use existing class roster to display randomized student pairings on the slide. Teleprompter shows full delivery script for facilitating the activity.

</domain>

<decisions>
## Implementation Decisions

### Activity structure
- Claude decides instruction format (numbered steps vs prose) based on activity type
- Activities should be quick: 2-3 minutes duration
- Claude decides whether to include time guidance
- Claude decides whether to include debrief/share-out component

### Group configuration
- Pairs are the default grouping — always design for 2 people
- Group-of-3 variant is always required on every Work Together slide
- Claude decides third-person role (observer, rotating participant) based on activity type
- Claude decides how to present variant (inline note vs separate section)

### Student pairing display
- Pairs generated from existing class roster (if available)
- Initial pairs set on slide creation, with manual "shuffle" button to re-randomize
- If no roster exists: insert slide with activity only, pairs can be added later
- Odd number of students: last group automatically becomes 3

### Slide content for students
- Students see full activity instructions on projector (not summary)
- Simple text list for pair display (not cards or numbered format)
- Claude decides layout (split vs stacked) based on content amount

### Teleprompter for teacher
- Full delivery script (not just cues or timing markers)
- No troubleshooting tips — focus on what to say

### Claude's Discretion
- Instruction formatting (steps vs prose)
- Time guidance inclusion
- Debrief component inclusion
- Third-person role in groups of 3
- Group-of-3 variant presentation style
- Slide layout arrangement

</decisions>

<specifics>
## Specific Ideas

- "Students never know who they're working with" — randomization creates variety and prevents cliques
- Resources limited to basic classroom items: pen, paper, whiteboard

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 31-work-together-slide-insertion*
*Context gathered: 2026-01-25*
