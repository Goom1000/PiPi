# Phase 31: Work Together Slide Insertion - Research

**Researched:** 2026-01-25
**Domain:** AI-generated collaborative pair activities with roster-based student pairing
**Confidence:** HIGH

## Summary

This phase adds a "Work Together" option to the slide insertion menu, generating AI-powered collaborative pair activities. The research confirms **zero new dependencies required** - all implementation builds on established patterns from Phase 30 (Elaborate slide), existing class roster system, and the InsertPoint vertical dropdown UI.

The implementation has two interconnected components:
1. **AI Generation**: Create activity instructions with pair/group-of-3 variants, facilitation script, and basic classroom resource constraints (pen, paper, whiteboard)
2. **Pair Display**: Generate randomized student pairings from existing roster, store in slide data, provide shuffle capability

A key architectural decision: student pairs should be stored as structured data on the slide (not just embedded in content text) to enable the shuffle button without regenerating AI content.

**Primary recommendation:** Extend the Slide interface with a `pairs` field for structured student groupings, add `generateWorkTogetherSlide()` to AIProviderInterface, and create a dedicated `WorkTogetherLayout` renderer that displays both activity instructions and student pairs.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.2.0 | UI component framework | Already in use, no change needed |
| @google/genai | 1.30.0 | Gemini AI generation | Existing provider, extend only |
| Claude API | 2023-06-01 | Claude AI generation | Existing provider, extend only |
| TypeScript | 5.x | Type safety | Existing codebase standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | CDN | Styling | Work Together slide badge, pair display |
| BroadcastChannel | Native | Sync to student view | Already syncs slides automatically |
| Fisher-Yates | Custom (line 24) | Shuffle algorithm | Already in PresentationView.tsx |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Structured pairs field | Pairs in content[] text | Shuffle would require text parsing; structured is cleaner |
| Dedicated layout | Reuse 'grid' layout | Grid doesn't handle activity + pairs split; dedicated is cleaner |
| Activity only if no roster | Error modal | Activity-only is still valuable; teacher can add pairs manually later |

**Installation:**
```bash
# No new installations required
# All features use existing dependencies
```

## Architecture Patterns

### Recommended Project Structure
```
services/
  aiProvider.ts           # Add generateWorkTogetherSlide to interface
  geminiService.ts        # Add generateWorkTogetherSlide implementation
  providers/
    geminiProvider.ts     # Add method passthrough
    claudeProvider.ts     # Add Claude implementation
components/
  App.tsx                 # Extend InsertPoint menu + add handler
  SlideRenderers.tsx      # Add WorkTogetherLayout component
types.ts                  # Extend Slide with pairs field
```

### Pattern 1: Slide Insertion Pattern (from Phase 30 Elaborate)
**What:** Create temp placeholder slide -> call AI provider -> replace with generated content -> auto-image
**When to use:** Any AI-generated slide insertion

### Pattern 2: Pair Generation Algorithm (Fisher-Yates + Pairing)
**What:** Randomize student list, then pair sequentially, handle odd numbers
**When to use:** Generating student pairings for collaborative activities

### Pattern 3: Activity Prompt Engineering
**What:** Generate 2-3 minute collaborative activity with pair and group-of-3 variants
**When to use:** AI generation for Work Together slides

### Pattern 4: Structured Pair Storage in Slide
**What:** Store pairs as data on Slide interface, not embedded in content text
**When to use:** Any slide that needs reshuffable student groupings

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide insertion | Custom array manipulation | Copy handleInsertElaborateSlide pattern | Already handles temp slides, error recovery |
| AI generation | New API wrapper | Extend AIProviderInterface | Consistent error handling, retry logic |
| Teleprompter scripts | Custom prompt | Existing TELEPROMPTER_RULES constant | Tested, verbosity-aware, segment formatting |
| Slide context | Manual string building | buildSlideContext() in aiProvider.ts | Already handles cumulative content formatting |
| JSON parsing | Manual JSON.parse | extractJSON() in claudeProvider.ts | Handles Claude's markdown code blocks |
| Error handling | Try-catch with alerts | AIProviderError + error modal pattern | Consistent UX across all AI features |
| Shuffle algorithm | Custom randomization | Existing Fisher-Yates in PresentationView.tsx | Already tested, unbiased O(n) |
| Student list access | New state management | Existing studentNames prop | Already passed to PresentationView |

**Key insight:** Phase 31 combines Phase 30's AI generation pattern with existing roster/pairing infrastructure. The novel element is the structured `pairs` field and dedicated layout renderer.

## Common Pitfalls

### Pitfall 1: Pair Display Coupled to AI Content
**What goes wrong:** Pairs embedded in content[] means shuffle requires regenerating entire slide or complex text parsing.
**Why it happens:** Seems simpler to let AI include pair display in its output.
**How to avoid:** Store pairs as separate structured field. AI generates activity instructions only. Pair display is handled by layout renderer.
**Warning signs:** Shuffle button triggers AI call or complex regex operations.

### Pitfall 2: Hard Error When No Roster
**What goes wrong:** "Work Together" button shows error modal if no students loaded, frustrating teachers who just want the activity.
**Why it happens:** Assuming pairs are required for Work Together slide to be useful.
**How to avoid:** Generate activity-only slide when no roster. Display placeholder: "Load a class list to show pairs here."
**Warning signs:** Users can't create Work Together slides early in workflow before loading roster.

### Pitfall 3: Group-of-3 Logic Edge Cases
**What goes wrong:** Odd number of students results in leftover single student or no group-of-3 created.
**Why it happens:** Pairing algorithm doesn't handle edge cases (1, 3, or 5 students).
**How to avoid:** Test with 1, 2, 3, 4, 5 students. With 1 student: single group. With 3: one group-of-3. With 5: one pair + one group-of-3.
**Warning signs:** Single student appears alone or group-of-3 never generated.

### Pitfall 4: AI Ignores Resource Constraints
**What goes wrong:** AI generates activities requiring tech devices, craft supplies, or complex materials.
**Why it happens:** Prompt doesn't emphasize constraint strongly enough.
**How to avoid:** Repeat constraint multiple times in prompt. Use explicit blocklist: "Do NOT require: tablets, computers, scissors, glue, colored materials."
**Warning signs:** Generated activities mention "using your device" or "cut out shapes."

### Pitfall 5: Teleprompter Segment Mismatch
**What goes wrong:** AI generates 4 content points but only 3 teleprompter segments.
**Why it happens:** Same issue from Phase 30 - segment count rule not enforced.
**How to avoid:** Include explicit count rule in prompt: "You MUST provide exactly (Number of content points + 1) segments."
**Warning signs:** Teleprompter shows "undefined" or blank for some bullets.

### Pitfall 6: InsertPoint Menu Gets Crowded
**What goes wrong:** Fourth option makes dropdown cramped or causes scroll issues.
**Why it happens:** UI designed for 3 options in Phase 30.
**How to avoid:** Test with 4 options (Blank, Exemplar, Elaborate, Work Together). May need slightly smaller padding or fixed max-height.
**Warning signs:** Buttons overflow container or text truncates on narrow sidebar.

## Open Questions

Things that couldn't be fully resolved:

1. **Pairs persistence on save/load**
   - What we know: Pairs stored in slide.pairs field, CueFile includes slides
   - What's unclear: Whether pairs auto-regenerate on load (if roster changed) or persist exactly as saved
   - Recommendation: Persist pairs as saved. If roster differs on load, shuffle button is available to regenerate.

2. **Shuffle scope during presentation**
   - What we know: Shuffle button in editor and PresentationView
   - What's unclear: Should shuffle during presentation broadcast to student view immediately?
   - Recommendation: Yes, shuffle should broadcast via existing STATE_UPDATE. Pairs are part of slide state.

3. **Layout registration**
   - What we know: SlideContentRenderer switch statement handles layouts
   - What's unclear: Whether 'work-together' needs to be added to layout enum in types.ts
   - Recommendation: Add 'work-together' to the layout type union. Ensure backward compatibility with slides that don't have it.

## Sources

### Primary (HIGH confidence)
- App.tsx lines 29-79: InsertPoint component structure (3 options)
- App.tsx lines 469-514: handleInsertElaborateSlide pattern
- services/aiProvider.ts lines 169-218: AIProviderInterface definition
- services/geminiService.ts lines 497-557: generateElaborateSlide implementation
- services/providers/claudeProvider.ts lines 515-570: Claude generateElaborateSlide
- components/SlideRenderers.tsx lines 1-348: Existing layout patterns
- components/PresentationView.tsx lines 24-31: Fisher-Yates shuffle algorithm
- types.ts lines 1-23: Slide interface with slideType field
- .planning/phases/31-work-together-slide-insertion/31-CONTEXT.md: Implementation decisions

### Secondary (MEDIUM confidence)
- .planning/phases/30-elaborate-slide-insertion/30-RESEARCH.md: Prior phase research
- .planning/phases/30-elaborate-slide-insertion/30-01-PLAN.md: Prior phase implementation

### Tertiary (LOW confidence)
- None - all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zero new dependencies, all existing patterns
- Architecture: HIGH - Direct extension of Phase 30 Elaborate pattern
- Pair generation: HIGH - Fisher-Yates already in codebase (PresentationView.tsx)
- Layout renderer: HIGH - Follows existing SlideRenderers.tsx patterns
- Pitfalls: HIGH - Based on Phase 30 learnings and CONTEXT.md constraints

**Research date:** 2026-01-25
**Valid until:** 2026-02-24 (30 days - stable patterns, no fast-moving dependencies)
