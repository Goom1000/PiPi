# Phase 32: Class Challenge Interactive Slides - Research

**Researched:** 2026-01-25
**Domain:** Live interactive contribution capture with real-time BroadcastChannel sync
**Confidence:** HIGH

## Summary

This phase adds "Class Challenge" slides - interactive slides where teachers can capture live student contributions during presentation. The contributions display as styled cards on the slide and sync to the student view in real-time. This builds directly on Phase 31's slide type system and extends the existing BroadcastChannel sync infrastructure.

The implementation has three main components:
1. **Slide Type & Layout**: New 'class-challenge' slide type with dedicated layout renderer showing prompt, input field, and contribution cards
2. **Contribution Management**: Teacher can add/delete contributions during presentation; data stored in slide state
3. **Real-time Sync**: Contributions broadcast to student view via existing BroadcastChannel infrastructure (STATE_UPDATE already syncs entire slides array)

Key architectural decisions from CONTEXT.md:
- Input field visible on slide itself (students see teacher typing)
- Modal/dialog for editing the challenge prompt
- No visual indicator for locked state (implicit from missing delete buttons)
- Auto-unlocks when teacher navigates back to the slide

**Primary recommendation:** Extend the Slide interface with `contributions?: string[]` and `challengePrompt?: string` fields, add `generateClassChallengeSlide()` to AIProviderInterface for prompt/teleprompter generation, create `ClassChallengeLayout` renderer with input field and card grid, and leverage existing slide state sync for real-time updates.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.2.0 | UI components with useState for contributions | Already in use |
| BroadcastChannel | Native | Real-time sync to student view | Already syncs entire slides array |
| TypeScript | 5.x | Type safety for new slide fields | Existing codebase standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | CDN | Card styling, animations, input field | All UI components |
| Gemini/Claude API | Existing | Generate challenge prompt suggestions | Optional AI prompt generation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Storing contributions in slide | Separate contributions state | Slide state already syncs via BroadcastChannel; separate state would require new message type |
| Modal for prompt editing | Inline editing | Modal keeps slide clean during presentation; matches CONTEXT.md decision |
| Auto-shrink cards when many | Scrollable container | No scrolling per CONTEXT.md - all cards visible |

**Installation:**
```bash
# No new installations required
# All features use existing dependencies
```

## Architecture Patterns

### Recommended Project Structure
```
types.ts                   # Extend Slide with contributions, challengePrompt fields
services/
  aiProvider.ts            # Add generateClassChallengeSlide to interface
  geminiService.ts         # Add implementation for prompt generation
  providers/
    geminiProvider.ts      # Add method passthrough
    claudeProvider.ts      # Add Claude implementation
components/
  App.tsx                  # Extend InsertPoint with Class Challenge option + handler
  SlideRenderers.tsx       # Add ClassChallengeLayout component
  PresentationView.tsx     # Add contribution input handler, prompt edit modal
```

### Pattern 1: Slide State for Contributions
**What:** Store contributions as string[] on Slide interface, modify via handleUpdateSlide
**When to use:** Any data that needs to sync to student view via BroadcastChannel
**Example:**
```typescript
// Source: types.ts Slide interface pattern
export interface Slide {
  // ... existing fields
  contributions?: string[];      // Class Challenge: student contributions
  challengePrompt?: string;      // Class Challenge: the question/prompt
}
```

### Pattern 2: Presentation Input Handler
**What:** Input field in PresentationView with Enter key submission and Add button
**When to use:** Teacher interaction during presentation mode
**Example:**
```typescript
// Source: Existing input patterns in PresentationView.tsx
const [newContribution, setNewContribution] = useState('');

const handleAddContribution = () => {
  if (!newContribution.trim()) return;

  const currentSlide = slides[currentIndex];
  const updatedContributions = [...(currentSlide.contributions || []), newContribution.trim()];
  onUpdateSlide(currentSlide.id, { contributions: updatedContributions });
  setNewContribution('');
};
```

### Pattern 3: Real-time Sync via Existing Infrastructure
**What:** Contributions sync automatically because STATE_UPDATE broadcasts entire slides array
**When to use:** Any slide data that students should see
**Example:**
```typescript
// Source: PresentationView.tsx lines 233-238
// Already broadcasts slides array on change - no new code needed!
useEffect(() => {
  postMessage({
    type: 'STATE_UPDATE',
    payload: { currentIndex, visibleBullets, slides }
  });
}, [currentIndex, visibleBullets, slides, postMessage]);
```

### Pattern 4: Modal Pattern for Prompt Editing
**What:** Fixed position overlay with backdrop blur for editing challenge prompt
**When to use:** Teacher editing during presentation without disrupting main view
**Example:**
```typescript
// Source: EnableAIModal.tsx and other modal patterns
<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
  <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl ...">
    {/* Modal content */}
  </div>
</div>
```

### Pattern 5: Card Grid with Auto-shrink
**What:** Responsive grid that reduces card size as count increases
**When to use:** Displaying variable number of contribution cards
**Example:**
```typescript
// Derived from CONTEXT.md requirement: "Cards shrink to fit if many contributions"
const getCardSize = (count: number) => {
  if (count <= 6) return 'text-2xl p-6';
  if (count <= 12) return 'text-xl p-4';
  if (count <= 20) return 'text-lg p-3';
  return 'text-base p-2';
};
```

### Anti-Patterns to Avoid
- **Separate BroadcastChannel message for contributions:** Unnecessary - slides array already syncs
- **Contributions in content[] array:** Would conflict with bullet display logic
- **Modal for adding contributions:** CONTEXT.md specifies input on slide itself
- **Scroll for many cards:** CONTEXT.md specifies all cards visible, shrink instead

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time sync | New message type | Existing STATE_UPDATE | Already broadcasts slides array |
| Slide insertion | Custom array logic | Copy handleInsertWorkTogetherSlide pattern | Handles temp slides, error recovery |
| AI generation | New API wrapper | Extend AIProviderInterface | Consistent error handling |
| Modal backdrop | Custom overlay | Copy EnableAIModal pattern | Tested animation, backdrop blur |
| Card animations | Custom CSS | Existing Tailwind animate-* classes | animate-fade-in, transition-all |
| Input field styling | Custom CSS | Existing Tailwind patterns | bg-white/10, rounded-xl, etc. |
| Teleprompter | Custom prompt | Existing TELEPROMPTER_RULES | Tested, verbosity-aware |
| Slide state updates | Direct setState | handleUpdateSlide callback | Already handles verbosityCache invalidation |

**Key insight:** The real-time sync requirement is already solved by the existing BroadcastChannel infrastructure - STATE_UPDATE broadcasts the entire slides array, so contributions automatically sync when added to slide state.

## Common Pitfalls

### Pitfall 1: Creating New BroadcastChannel Message Type
**What goes wrong:** Implementing CONTRIBUTION_ADD and CONTRIBUTION_DELETE message types adds complexity and potential sync issues.
**Why it happens:** Seems natural to have dedicated messages for contribution operations.
**How to avoid:** Contributions are part of slide state. When slide state changes, STATE_UPDATE already broadcasts the full slides array. Student view already receives and renders the updated slide.
**Warning signs:** Adding new entries to PresentationMessage union in types.ts for contributions.

### Pitfall 2: Lock State Management Complexity
**What goes wrong:** Building complex lock/unlock state machine when CONTEXT.md specifies implicit behavior.
**Why it happens:** "Read-only when navigating away" sounds like explicit state tracking.
**How to avoid:**
- Simply: input field and delete buttons only render when `currentIndex === slideIndex`
- No lock state variable needed
- "Auto-unlocks on return" is just: when teacher navigates back, input renders again
**Warning signs:** Adding `isLocked` field to slide or complex state machine.

### Pitfall 3: Forgetting Auto-focus
**What goes wrong:** Teacher has to click input field on every Class Challenge slide.
**Why it happens:** Easy to forget CONTEXT.md requirement: "Input field auto-focuses when arriving at a Class Challenge slide"
**How to avoid:** Use useRef + useEffect to focus input when currentSlide.slideType === 'class-challenge'
**Warning signs:** Manual click required to start typing on Class Challenge slide.

### Pitfall 4: Card Overflow Instead of Shrink
**What goes wrong:** Cards overflow container or require scrolling with many contributions.
**Why it happens:** Default grid/flex behavior doesn't auto-shrink.
**How to avoid:**
- Calculate card size based on contribution count
- Use CSS text-overflow or dynamic font sizing
- Test with 20+ contributions
**Warning signs:** Scroll bar appears on contribution area, or cards cut off.

### Pitfall 5: Pop Animation on All Cards
**What goes wrong:** All existing cards re-animate when a new one is added.
**Why it happens:** Re-render causes all cards to re-mount.
**How to avoid:** Use stable keys (index is fine here since contributions are append-only during a session). Apply animation class only to newly added card using a "just added" flag or CSS :last-child.
**Warning signs:** All cards "pop" every time one is added.

### Pitfall 6: Input Field Visible on Student View
**What goes wrong:** Student view shows the input field, breaking the "projector display" aesthetic.
**Why it happens:** SlideRenderers is used by both teacher (via PresentationView) and student (via StudentView).
**How to avoid:** Input field should be rendered in PresentationView, NOT in ClassChallengeLayout. Layout just renders prompt + cards.
**Warning signs:** Input field appears on student window.

### Pitfall 7: Prompt Edit Modal Blocking Presentation
**What goes wrong:** Opening prompt edit modal covers the slide content the teacher is referencing.
**Why it happens:** Modal pattern covers entire screen.
**How to avoid:** Either use smaller modal positioned to the side, or make modal semi-transparent/draggable.
**Warning signs:** Teacher can't see slide content while editing prompt.

### Pitfall 8: Delete Button Visible During Student Projection
**What goes wrong:** Students see delete buttons on cards, ruining the polished presentation look.
**Why it happens:** SlideRenderer includes delete buttons that should be teacher-only.
**How to avoid:** Delete buttons rendered in PresentationView overlay, not in ClassChallengeLayout itself.
**Warning signs:** Delete buttons visible in student view.

## Code Examples

Verified patterns from codebase:

### Slide Interface Extension
```typescript
// Source: types.ts pattern
export interface Slide {
  id: string;
  title: string;
  content: string[];
  speakerNotes: string;
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  layout?: 'split' | 'full-image' | 'center-text' | 'flowchart' | 'grid' | 'tile-overlap' | 'work-together' | 'class-challenge';
  theme?: 'default' | 'purple' | 'blue' | 'green' | 'warm';
  backgroundColor?: string;
  hasQuestionFlag?: boolean;
  verbosityCache?: { concise?: string; detailed?: string; };
  slideType?: 'standard' | 'elaborate' | 'work-together' | 'class-challenge';
  pairs?: StudentPair[];
  // NEW for Class Challenge
  contributions?: string[];
  challengePrompt?: string;
}
```

### InsertPoint Extension
```typescript
// Source: App.tsx InsertPoint component pattern
<button
    onClick={(e) => { e.stopPropagation(); onClickClassChallenge(); setIsOpen(false); }}
    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors shadow-sm"
>
    <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Class Challenge</span>
</button>
```

### Contribution Input Handler
```typescript
// Source: Pattern from PresentationView input handling
const handleAddContribution = useCallback(() => {
  const trimmed = newContribution.trim();
  if (!trimmed || !currentSlide) return;

  onUpdateSlide(currentSlide.id, {
    contributions: [...(currentSlide.contributions || []), trimmed]
  });
  setNewContribution('');
}, [newContribution, currentSlide, onUpdateSlide]);

const handleDeleteContribution = useCallback((index: number) => {
  if (!currentSlide?.contributions) return;

  const updated = currentSlide.contributions.filter((_, i) => i !== index);
  onUpdateSlide(currentSlide.id, { contributions: updated });
}, [currentSlide, onUpdateSlide]);
```

### ClassChallengeLayout (cards only, no input)
```typescript
// Source: SlideRenderers.tsx WorkTogetherLayout pattern
export const ClassChallengeLayout: React.FC<{ slide: Slide }> = ({ slide }) => {
  const cardCount = slide.contributions?.length || 0;
  const cardSize = cardCount <= 6 ? 'text-2xl p-6' : cardCount <= 12 ? 'text-xl p-4' : 'text-lg p-3';

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: slide.backgroundColor || '#ea580c' }}  // Orange-600
    >
      {/* Prompt */}
      <div className="px-6 pt-6 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-white">
          {slide.challengePrompt || 'Click to add your challenge question'}
        </h2>
      </div>

      {/* Contribution Cards Grid */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="flex flex-wrap gap-4 justify-center content-start">
          {(slide.contributions || []).map((contribution, idx) => (
            <div
              key={idx}
              className={`bg-white/20 backdrop-blur-sm rounded-xl ${cardSize} text-white font-medium animate-fade-in`}
            >
              {contribution}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate sync for dynamic data | Sync entire slides array | Phase 31 | No new BroadcastChannel messages needed |
| Lock state as explicit field | Implicit via current index | CONTEXT.md decision | Simpler implementation |

**Deprecated/outdated:**
- None - this is new functionality building on current patterns

## Open Questions

Things that couldn't be fully resolved:

1. **Contribution persistence across sessions**
   - What we know: Contributions stored in slide.contributions field, CueFile includes slides
   - What's unclear: Should contributions persist when saving/loading .cue file?
   - Recommendation: Yes, persist them. They're valuable classroom artifacts. Teacher can clear manually if desired.

2. **AI prompt generation content**
   - What we know: CONTEXT.md says "Option to generate prompt via AI based on surrounding slides"
   - What's unclear: Exact prompt template for generating challenge questions
   - Recommendation: Similar to generateWorkTogetherSlide - provide presentation context, ask for engaging question that checks understanding

3. **Card color scheme**
   - What we know: CONTEXT.md says "should be distinct from teal Work Together and purple Elaborate"
   - What's unclear: Exact color
   - Recommendation: Orange-600 (#ea580c) - warm, energetic, distinct from existing colors

4. **Teleprompter content for Class Challenge**
   - What we know: Should have "AI-generated facilitation tips for running the activity"
   - What's unclear: Specific format
   - Recommendation: Generate tips like "Encourage quiet students", "Build on student responses", "Summarize themes"

## Sources

### Primary (HIGH confidence)
- types.ts lines 1-32: Slide interface definition with slideType
- types.ts lines 34-42: PresentationState and BroadcastChannel config
- types.ts lines 203-213: PresentationMessage union (STATE_UPDATE syncs slides)
- components/SlideRenderers.tsx lines 335-397: WorkTogetherLayout pattern
- components/PresentationView.tsx lines 230-238: STATE_UPDATE broadcast on slide changes
- components/StudentView.tsx lines 39-48: STATE_UPDATE handling in student view
- hooks/useBroadcastSync.ts: BroadcastChannel hook implementation
- App.tsx lines 62-120: InsertPoint component with 4 options
- App.tsx lines 557-610: handleInsertWorkTogetherSlide pattern
- components/EnableAIModal.tsx: Modal pattern for overlays
- .planning/phases/32-class-challenge-slides/32-CONTEXT.md: Implementation decisions

### Secondary (MEDIUM confidence)
- .planning/phases/31-work-together-slide-insertion/31-RESEARCH.md: Prior phase research
- index.html lines 39-56: Animation keyframes (animate-fade-in, etc.)

### Tertiary (LOW confidence)
- None - all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zero new dependencies, all existing patterns
- Architecture: HIGH - Direct extension of existing BroadcastChannel sync
- Real-time sync: HIGH - STATE_UPDATE already broadcasts slides array
- Layout renderer: HIGH - Follows WorkTogetherLayout pattern exactly
- Pitfalls: HIGH - Based on Phase 31 learnings and CONTEXT.md constraints

**Research date:** 2026-01-25
**Valid until:** 2026-02-24 (30 days - stable patterns, no fast-moving dependencies)
