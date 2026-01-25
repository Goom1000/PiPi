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
**Example:**
```typescript
// Source: App.tsx lines 469-514 (handleInsertElaborateSlide)
const handleInsertWorkTogetherSlide = async (index: number) => {
  if (!provider) {
    setErrorModal({ title: 'AI Not Configured', message: 'Please configure your AI provider in Settings.' });
    return;
  }

  const source = index >= 0 ? slides[index] : undefined;
  if (!source) {
    setErrorModal({ title: 'Cannot Create Activity', message: 'Need a slide above to create activity for.' });
    return;
  }

  const tempId = `temp-work-${Date.now()}`;
  const tempSlide: Slide = {
    id: tempId,
    title: "Creating Activity...",
    content: ["Generating collaborative activity...", "Designing pair instructions..."],
    speakerNotes: "",
    imagePrompt: "",
    isGeneratingImage: true,
    layout: 'work-together'  // New layout type
  };

  // Insert temp slide
  const newSlides = [...slides];
  newSlides.splice(index + 1, 0, tempSlide);
  setSlides(newSlides);
  setActiveSlideIndex(index + 1);

  try {
    const workTogether = await provider.generateWorkTogetherSlide(lessonTitle, source, slides);

    // Generate pairs if roster available
    const pairs = studentNames.length > 0 ? generatePairs(studentNames) : undefined;

    setSlides(curr => curr.map(s => s.id === tempId
      ? { ...workTogether, id: tempId, pairs, isGeneratingImage: autoGenerateImages }
      : s
    ));

    if (autoGenerateImages) {
      const img = await provider.generateSlideImage(workTogether.imagePrompt, workTogether.layout);
      setSlides(curr => curr.map(s => s.id === tempId ? { ...s, imageUrl: img, isGeneratingImage: false } : s));
    }
  } catch (err) {
    console.error("Work Together error:", err);
    setSlides(curr => curr.map(s => s.id === tempId ? { ...tempSlide, title: "New Slide", isGeneratingImage: false } : s));
    if (err instanceof AIProviderError) {
      setErrorModal({ title: 'Activity Generation Failed', message: err.userMessage });
    }
  }
};
```

### Pattern 2: Pair Generation Algorithm (Fisher-Yates + Pairing)
**What:** Randomize student list, then pair sequentially, handle odd numbers
**When to use:** Generating student pairings for collaborative activities
**Example:**
```typescript
// Source: Pattern from PresentationView.tsx line 24 (shuffleArray)
interface StudentPair {
  students: string[];  // 2 or 3 students
  isGroupOfThree?: boolean;
}

function generatePairs(studentNames: string[]): StudentPair[] {
  // Fisher-Yates shuffle
  const shuffled = [...studentNames];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const pairs: StudentPair[] = [];
  const isOdd = shuffled.length % 2 !== 0;
  const pairCount = isOdd ? Math.floor(shuffled.length / 2) - 1 : Math.floor(shuffled.length / 2);

  // Create pairs of 2
  for (let i = 0; i < pairCount * 2; i += 2) {
    pairs.push({ students: [shuffled[i], shuffled[i + 1]] });
  }

  // Handle remaining students (odd count = group of 3)
  if (isOdd) {
    const lastThree = shuffled.slice(-3);
    pairs.push({ students: lastThree, isGroupOfThree: true });
  } else if (shuffled.length >= 2) {
    // Last pair for even count
    const lastTwo = shuffled.slice(-2);
    if (pairCount * 2 < shuffled.length) {
      pairs.push({ students: lastTwo });
    }
  }

  return pairs;
}
```

### Pattern 3: Activity Prompt Engineering
**What:** Generate 2-3 minute collaborative activity with pair and group-of-3 variants
**When to use:** AI generation for Work Together slides
**Example:**
```typescript
// Source: Pattern from services/geminiService.ts (generateElaborateSlide)
const systemInstruction = `
You are an educational designer creating "Work Together" collaborative activities for Year 6 (10-11 year olds).
Topic: ${lessonTopic}
Creating activity based on: "${sourceSlide.title}"
Source content: ${sourceSlide.content.join('; ')}

PRESENTATION CONTEXT (maintain coherence):
${presentationContext}

TASK: Create a quick, engaging collaborative activity (2-3 minutes) for student pairs.

ACTIVITY REQUIREMENTS:
1. Design for PAIRS (2 students) as the primary grouping
2. ALWAYS include a group-of-3 variant (e.g., "If you're in a group of 3, one person can...")
3. Use ONLY basic classroom resources: pen, paper, whiteboard
4. Activity should reinforce the source slide content
5. Keep instructions clear and actionable for 10-11 year olds
6. Include a clear outcome (e.g., "Share one thing you discovered")

INSTRUCTION FORMAT:
- Use numbered steps OR prose, whichever fits the activity type better
- Include any time guidance if helpful ("Take 1 minute to...")
- Include the group-of-3 variant inline or as a separate note

TELEPROMPTER (speakerNotes):
- This is a FULL DELIVERY SCRIPT for the teacher
- Include what to say when launching the activity
- Include what to say while monitoring pairs
- Include wrap-up/share-out script if applicable
- Use "pointing_right" as segment delimiter (Segments = Content points + 1)

STRICT: You MUST provide exactly (Number of content points + 1) speaker note segments.
`.replace(/pointing_right/g, '\u{1F449}');
```

### Pattern 4: Structured Pair Storage in Slide
**What:** Store pairs as data on Slide interface, not embedded in content text
**When to use:** Any slide that needs reshuffable student groupings
**Example:**
```typescript
// Source: types.ts (extend Slide interface)
export interface StudentPair {
  students: string[];      // 2 or 3 student names
  isGroupOfThree?: boolean;
}

export interface Slide {
  // ... existing fields ...

  // For Work Together slides: randomized student pairs
  // Stored separately from content so shuffle doesn't require AI regeneration
  pairs?: StudentPair[];
}
```

### Anti-Patterns to Avoid
- **Embedding pairs in content text:** Makes shuffle require text parsing or AI regeneration. Store pairs as structured data.
- **Requiring roster for slide creation:** Activity is still useful without pairs. Generate activity-only if no roster, pairs can be added later.
- **Hardcoding 2-person activities:** Always include group-of-3 variant since odd class sizes are common.
- **Complex resources in prompts:** Activities must use only pen, paper, whiteboard - no tech dependencies.

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

## Code Examples

Verified patterns from official sources:

### InsertPoint Menu Extension (4th Option)
```typescript
// Source: App.tsx lines 29-79 (current InsertPoint with 3 options)
// Extend with "Work Together" button

const InsertPoint = ({
  onClickBlank,
  onClickExemplar,
  onClickElaborate,
  onClickWorkTogether  // NEW
}: {
  onClickBlank: () => void,
  onClickExemplar: () => void,
  onClickElaborate: () => void,
  onClickWorkTogether: () => void  // NEW
}) => {
    // ... existing code ...

    {isOpen && (
        <div className="z-20 flex flex-col gap-1 animate-fade-in bg-white dark:bg-slate-800 border border-indigo-100 dark:border-amber-500/30 rounded-xl p-1.5 shadow-xl ring-4 ring-indigo-50 dark:ring-amber-500/10">
            {/* ... Blank, Exemplar, Elaborate buttons ... */}

            {/* NEW: Work Together button */}
            <button
                onClick={(e) => { e.stopPropagation(); onClickWorkTogether(); setIsOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm"
            >
                <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Work Together</span>
            </button>
        </div>
    )}
};
```

### AI Provider Interface Extension
```typescript
// Source: services/aiProvider.ts (following generateElaborateSlide pattern)
export interface AIProviderInterface {
  // ... existing methods ...

  // NEW: Generate collaborative activity slide
  generateWorkTogetherSlide(
    lessonTopic: string,
    sourceSlide: Slide,
    allSlides: Slide[]
  ): Promise<Slide>;
}
```

### Slide Interface Extension for Pairs
```typescript
// Source: types.ts (extend existing Slide interface)
export interface StudentPair {
  students: string[];
  isGroupOfThree?: boolean;
}

export interface Slide {
  // ... existing fields ...

  // slideType already exists: 'standard' | 'elaborate' | 'work-together' | 'class-challenge'
  slideType?: 'standard' | 'elaborate' | 'work-together' | 'class-challenge';

  // NEW: Student pairs for Work Together slides
  pairs?: StudentPair[];
}
```

### WorkTogetherLayout Renderer
```typescript
// Source: components/SlideRenderers.tsx (following existing layout patterns)
export const WorkTogetherLayout: React.FC<{
  slide: Slide,
  visibleBullets: number,
  onShuffle?: () => void  // Teacher view only
}> = ({ slide, visibleBullets, onShuffle }) => (
  <div className="w-full h-full flex flex-col p-6 md:p-10 overflow-hidden"
       style={{ backgroundColor: slide.backgroundColor || '#0f766e' }}>  {/* Teal theme */}

    {/* Header with title */}
    <h2 className="text-5xl md:text-7xl font-bold text-white text-center mb-6 font-poppins">
      {slide.title}
    </h2>

    <div className="flex-1 flex flex-col md:flex-row gap-6">
      {/* Left: Activity Instructions */}
      <div className="flex-1 bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="text-2xl font-bold text-white/80 mb-4 uppercase tracking-wider">Instructions</h3>
        <div className="space-y-4">
          {slide.content.map((point, idx) => (
            <div
              key={idx}
              className={`flex gap-4 items-start transition-all duration-500 ${
                idx < visibleBullets ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-amber-400 text-teal-900 font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </div>
              <p className="text-2xl md:text-3xl text-white font-medium">
                <MarkdownText text={point} />
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Student Pairs */}
      {slide.pairs && slide.pairs.length > 0 && (
        <div className="w-full md:w-1/3 bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white/80 uppercase tracking-wider">Pairs</h3>
            {onShuffle && (
              <button
                onClick={onShuffle}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Shuffle pairs"
              >
                {/* Shuffle icon */}
              </button>
            )}
          </div>
          <ul className="space-y-2 text-xl text-white">
            {slide.pairs.map((pair, idx) => (
              <li key={idx} className={pair.isGroupOfThree ? 'text-amber-300' : ''}>
                {pair.students.join(' & ')}
                {pair.isGroupOfThree && ' (3)'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No roster placeholder */}
      {(!slide.pairs || slide.pairs.length === 0) && (
        <div className="w-full md:w-1/3 bg-white/5 rounded-2xl p-6 border-2 border-dashed border-white/20 flex items-center justify-center">
          <p className="text-white/50 text-center">
            Load a class list to show pairs here
          </p>
        </div>
      )}
    </div>
  </div>
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| prevSlide only context | Full presentation context (allSlides) | Phase 30 | Coherent content that doesn't repeat |
| Horizontal InsertPoint | Vertical dropdown (3+ options) | Phase 30 | Scalable for 4+ slide types |
| Implicit slide types | slideType field marker | Phase 30 | UI badge support, filtering |
| Activities without variants | Pair + group-of-3 always | Phase 31 | Handles odd class sizes |

**Deprecated/outdated:**
- Using only prevSlide for context: Use allSlides for coherence
- Embedding pairs in content text: Store as structured pairs field
- Single-group-size activities: Always design for pairs with 3-person variant

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
- .planning/phases/31-work-together-slide/31-CONTEXT.md: Implementation decisions

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
