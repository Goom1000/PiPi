# Architecture Patterns: In-Presentation AI Assistant ("Ask AI")

**Domain:** In-presentation AI assistant for Cue
**Researched:** 2026-01-26
**Confidence:** HIGH (based on existing codebase patterns)

## Executive Summary

The "Ask AI" feature integrates into Cue's existing architecture by following established patterns: extend AIProviderInterface with a new method, add state to PresentationView.tsx, render in the teleprompter panel area. The feature is structurally similar to the existing `generateQuestionWithAnswer` flow but with free-form user input instead of grade-based selection.

Key architectural decisions:
- **No new components needed** - inline rendering in teleprompter panel
- **Reuse existing patterns** - AIProviderInterface extension, useState in PresentationView
- **Teacher-only** - no BroadcastChannel sync required
- **Session-scoped history** - not persisted to .cue files

## Recommended Architecture

```
User types query in teleprompter panel
         |
         v
+-------------------+
| PresentationView  |  (state: query, response, history, isLoading)
+-------------------+
         |
         v
+-------------------+
| AIProviderInterface.askQuestion() |  (new method)
+-------------------+
         |
    +----+----+
    |         |
    v         v
+-------+  +-------+
|Gemini |  |Claude |
+-------+  +-------+
         |
         v
Response displayed in teleprompter (teacher-only)
```

## Integration Points with Existing Architecture

### 1. AIProviderInterface Extension

**Location:** `/services/aiProvider.ts`

Add new method to the interface:

```typescript
// Add to AIProviderInterface (after line 228)
askQuestion(
  lessonContext: LessonContext,
  userQuery: string
): Promise<AssistantResponse>;

// New types (add near line 20)
export interface LessonContext {
  lessonTopic: string;           // From first slide title
  currentSlide: {
    title: string;
    content: string[];
  };
  cumulativeContent: string;     // All slides up to current for context
}

export interface AssistantResponse {
  answer: string;                // Markdown-formatted response
}
```

**Why this structure:**
- Matches existing pattern from `generateQuestionWithAnswer`, `generateGameQuestions`
- `LessonContext` reuses concepts from existing `buildSlideContext` helper
- Response is simple text (no complex parsing needed like quiz questions)

### 2. Context Helper Function

**Location:** `/services/aiProvider.ts`

Add helper similar to existing `buildSlideContext`:

```typescript
// Add after buildSlideContext (around line 70)
export function buildLessonContext(slides: Slide[], currentIndex: number): LessonContext {
  const relevantSlides = slides.slice(0, currentIndex + 1);
  const cumulativeContent = relevantSlides
    .map((s, i) => `Slide ${i + 1} (${s.title}): ${s.content.join('; ')}`)
    .join('\n\n');

  return {
    lessonTopic: slides[0]?.title || 'Unknown Topic',
    currentSlide: {
      title: slides[currentIndex]?.title || '',
      content: slides[currentIndex]?.content || []
    },
    cumulativeContent
  };
}
```

### 3. Provider Implementations

**Location:** `/services/providers/claudeProvider.ts`

```typescript
// Add to ClaudeProvider class (around line 1042)
async askQuestion(
  lessonContext: LessonContext,
  userQuery: string
): Promise<AssistantResponse> {
  const systemPrompt = `
You are a helpful teaching assistant for a Year 6 (10-11 year old) classroom.
You are helping the teacher during a live lesson presentation.

LESSON CONTEXT:
- Topic: ${lessonContext.lessonTopic}
- Current slide: "${lessonContext.currentSlide.title}"
- Current slide content: ${lessonContext.currentSlide.content.join('; ')}

CONTENT COVERED SO FAR:
${lessonContext.cumulativeContent}

RESPONSE RULES:
- Be concise (2-4 sentences typically, unless more detail is needed)
- Use age-appropriate language suitable for explaining to 10-11 year olds
- If asked about content not covered in the lesson, acknowledge the limit
- Format key terms in **bold** for teacher reference
- Never start with "As an AI" or similar meta-commentary
- Focus on being immediately helpful for the teacher's question
`;

  const messages: ClaudeMessage[] = [{
    role: 'user',
    content: userQuery
  }];

  const response = await callClaude(this.apiKey, messages, systemPrompt, 1024);
  return { answer: response.trim() };
}
```

**Location:** `/services/providers/geminiProvider.ts`

```typescript
// Add to GeminiProvider class
async askQuestion(
  lessonContext: LessonContext,
  userQuery: string
): Promise<AssistantResponse> {
  try {
    return await geminiAskQuestion(this.apiKey, lessonContext, userQuery);
  } catch (error) {
    throw this.wrapError(error);
  }
}
```

**Location:** `/services/geminiService.ts` - add new function:

```typescript
export async function askQuestion(
  apiKey: string,
  lessonContext: LessonContext,
  userQuery: string
): Promise<AssistantResponse> {
  // Similar implementation to claudeProvider, adapted for Gemini API
  // ...
}
```

### 4. PresentationView State

**Location:** `/components/PresentationView.tsx`

Add state alongside existing question state (around line 130):

```typescript
// Existing (for reference pattern)
const [quickQuestion, setQuickQuestion] = useState<{
  question: string;
  answer: string;
  level: string;
  studentName?: string;
} | null>(null);
const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

// NEW: AI Assistant state
const [assistantQuery, setAssistantQuery] = useState('');
const [assistantResponse, setAssistantResponse] = useState<{
  answer: string;
  query: string;  // Keep for display context
} | null>(null);
const [isAssistantLoading, setIsAssistantLoading] = useState(false);

// Optional: Session history (persists during presentation only)
const [assistantHistory, setAssistantHistory] = useState<Array<{
  query: string;
  answer: string;
  slideIndex: number;
  timestamp: number;
}>>([]);
```

**Why not a custom hook:**
- State is localized to PresentationView only
- No need for sharing across components
- Follows existing pattern (quickQuestion, activeGame, etc.)

### 5. Handler Function

**Location:** `/components/PresentationView.tsx`

Add handler near other question handlers (around line 936):

```typescript
// Near handleGenerateQuestion
const handleAskAI = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!provider) {
    onRequestAI('ask AI assistant');
    return;
  }

  const query = assistantQuery.trim();
  if (!query) return;

  setIsAssistantLoading(true);
  try {
    const context = buildLessonContext(slides, currentIndex);
    const response = await provider.askQuestion(context, query);

    setAssistantResponse({ answer: response.answer, query });
    setAssistantQuery('');

    // Add to session history
    setAssistantHistory(prev => [...prev, {
      query,
      answer: response.answer,
      slideIndex: currentIndex,
      timestamp: Date.now()
    }]);
  } catch (err) {
    if (err instanceof AIProviderError) {
      onError('AI Assistant', err.userMessage);
    } else {
      onError('Error', 'Could not get response. Please try again.');
    }
  } finally {
    setIsAssistantLoading(false);
  }
};
```

### 6. UI Rendering

**Location:** `/components/PresentationView.tsx`

Add after the existing question display area (around line 1787):

```tsx
{/* Existing: Generated Question Display */}
{quickQuestion && (
  <div className="mt-3 bg-slate-700 rounded-xl p-3 ...">
    {/* question content */}
  </div>
)}

{/* NEW: AI Assistant Section */}
<div className="mt-4 border-t border-slate-700/50 pt-3">
  <div className="flex items-center justify-between mb-2">
    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
      Ask AI
    </span>
    {assistantHistory.length > 0 && (
      <button
        onClick={() => {/* toggle history dropdown */}}
        className="text-[9px] text-slate-400 hover:text-white"
      >
        History ({assistantHistory.length})
      </button>
    )}
  </div>

  {/* Input form */}
  <form onSubmit={handleAskAI} className="flex gap-2">
    <input
      type="text"
      value={assistantQuery}
      onChange={e => setAssistantQuery(e.target.value)}
      placeholder="Ask about the lesson..."
      className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      disabled={!isAIAvailable || isAssistantLoading}
    />
    <button
      type="submit"
      disabled={!isAIAvailable || isAssistantLoading || !assistantQuery.trim()}
      className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
        isAIAvailable && !isAssistantLoading && assistantQuery.trim()
          ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
          : 'bg-slate-600 text-slate-400 cursor-not-allowed'
      }`}
    >
      {isAssistantLoading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        'Ask'
      )}
    </button>
  </form>

  {/* Loading state */}
  {isAssistantLoading && (
    <div className="mt-2 p-3 flex items-center gap-3 text-indigo-300 animate-pulse bg-slate-700/50 rounded-xl border border-slate-600">
      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold uppercase">Thinking...</span>
    </div>
  )}

  {/* Response display */}
  {assistantResponse && !isAssistantLoading && (
    <div className="mt-2 bg-slate-700/50 rounded-xl p-3 border border-slate-600 animate-fade-in">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[9px] text-slate-400 italic truncate max-w-[80%]">
          "{assistantResponse.query}"
        </span>
        <button
          onClick={() => setAssistantResponse(null)}
          className="text-slate-400 hover:text-white"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="text-sm text-slate-200 leading-relaxed">
        <MarkdownText text={assistantResponse.answer} />
      </div>
    </div>
  )}
</div>
```

## Data Flow

### Query to Response Flow

```
1. User types in input field
   |
2. User presses Enter or clicks Ask button
   |
3. handleAskAI validates:
   - provider exists (else onRequestAI())
   - query not empty
   |
4. setIsAssistantLoading(true)
   |
5. Build LessonContext from current state:
   {
     lessonTopic: slides[0].title,
     currentSlide: { title, content },
     cumulativeContent: "Slide 1 (Title): bullets..."
   }
   |
6. await provider.askQuestion(context, query)
   |
7. On success:
   - setAssistantResponse({ answer, query })
   - Append to assistantHistory
   - setAssistantQuery('')
   |
8. On error:
   - onError('AI Assistant', error.userMessage)
   |
9. setIsAssistantLoading(false)
```

## State Management

### Session History

History is presentation-scoped (not persisted to file):

```typescript
interface HistoryEntry {
  query: string;
  answer: string;
  slideIndex: number;
  timestamp: number;
}

const [assistantHistory, setAssistantHistory] = useState<HistoryEntry[]>([]);

// On successful response
setAssistantHistory(prev => [...prev, {
  query,
  answer: response.answer,
  slideIndex: currentIndex,
  timestamp: Date.now()
}]);
```

**Why not persist to file:**
- Q&A is ephemeral teaching aid
- Would bloat save files with potentially sensitive questions
- Different lesson runs have different needs
- Session-only is simpler and matches teacher expectations

### Response Caching

**Not recommended for initial implementation.**

Unlike verbosity which has three fixed levels, assistant queries are free-form:
- Same query might want different context on different slides
- Query variations ("what is X?" vs "explain X") would miss cache
- Session history provides lookup without caching complexity

**Defer caching until clear usage patterns emerge.**

## Teacher-Only Display

The feature is inherently teacher-only:

1. **Input field** - Only renders in teleprompter panel (teacher view only)
2. **Response display** - Only in teleprompter panel
3. **No BroadcastChannel sync** - Nothing to sync to student view
4. **No STATE_UPDATE changes** - Assistant state is not part of PresentationState

This matches existing question generation behavior where questions are shown only to teacher for reference.

## Error Handling

Follow existing AIProviderError pattern from `handleGenerateQuestion`:

```typescript
try {
  const response = await provider.askQuestion(context, query);
  // ... handle success
} catch (err) {
  if (err instanceof AIProviderError) {
    onError('AI Assistant', err.userMessage);
  } else {
    onError('Error', 'Could not get response. Please try again.');
  }
}
```

## Build Order (Suggested Phases)

### Phase 1: Core Integration (MVP)
1. Add `LessonContext` and `AssistantResponse` types to `aiProvider.ts`
2. Add `buildLessonContext` helper function
3. Add `askQuestion` method to `AIProviderInterface`
4. Implement `askQuestion` in `ClaudeProvider`
5. Implement `askQuestion` in `GeminiProvider` (via geminiService)
6. Add state hooks to `PresentationView.tsx`
7. Add input UI and response display
8. Wire up `handleAskAI` handler

**Deliverable:** Working Ask AI feature with input, loading, response, dismiss.

### Phase 2: Polish
1. Add session history state
2. Add history toggle/dropdown UI
3. Add "clear history" button
4. Style refinements for loading/response states

**Deliverable:** Full feature with history tracking.

### Phase 3: Enhancement (Future/Optional)
1. Suggested queries based on slide content
2. "Explain this to a student" quick action button
3. "Give me an analogy" quick action button
4. Keyboard shortcut (e.g., Cmd+K to focus input)

## Anti-Patterns to Avoid

### 1. Overcomplicating State
**Don't:** Create a separate context provider or complex state machine.
**Do:** Use simple useState in PresentationView, following quickQuestion pattern.

### 2. Persisting to Save File
**Don't:** Add assistantHistory to CueFile format.
**Do:** Keep it session-only. Teacher questions are ephemeral.

### 3. Syncing to Student View
**Don't:** Broadcast assistant Q&A to students.
**Do:** Keep it teacher-only. This is a teleprompter aid.

### 4. Complex Caching
**Don't:** Build elaborate query caching with fuzzy matching.
**Do:** Start simple. Add caching only if performance issues emerge.

### 5. Breaking Existing Layout
**Don't:** Resize the teleprompter panel or change its structure significantly.
**Do:** Add the feature after existing elements, matching visual style exactly.

### 6. Creating New Components
**Don't:** Extract to separate `AskAIPanel.tsx` component initially.
**Do:** Inline in PresentationView first. Extract only if complexity grows.

## File Changes Summary

| File | Change Type | Lines Added (est.) |
|------|-------------|-------------------|
| `services/aiProvider.ts` | ADD types, helper, interface method | ~30 |
| `services/geminiService.ts` | ADD `askQuestion` function | ~40 |
| `services/providers/geminiProvider.ts` | ADD method wrapper | ~10 |
| `services/providers/claudeProvider.ts` | ADD full implementation | ~50 |
| `components/PresentationView.tsx` | ADD state, handler, UI | ~100 |

**Total estimated additions:** ~230 lines

## Comparison to Existing Patterns

| Aspect | generateQuestionWithAnswer | askQuestion (new) |
|--------|--------------------------|-------------------|
| Input | Grade level (A-E) | Free-form text |
| Context | Current slide only | All slides up to current |
| Output | Question + answer pair | Single answer string |
| Display | quickQuestion state | assistantResponse state |
| History | None | Session-scoped array |
| Caching | None | None (initially) |
| Teacher-only | Yes | Yes |

## Verification Checklist

- [x] Integration points clearly identified (AIProviderInterface, PresentationView)
- [x] New vs modified components explicit (no new components needed)
- [x] Build order considers existing dependencies (types first, then providers, then UI)
- [x] Context passing strategy documented (buildLessonContext helper)
- [x] State management approach matches existing patterns (useState, no Redux/context)
- [x] Teacher-only constraint addressed (no BroadcastChannel sync)
- [x] Error handling follows established AIProviderError pattern

## Sources

**HIGH confidence (direct codebase analysis):**
- `/services/aiProvider.ts` - Interface pattern, buildSlideContext helper (lines 58-70)
- `/services/providers/claudeProvider.ts` - Implementation pattern (lines 300-1042)
- `/services/providers/geminiProvider.ts` - Wrapper pattern (lines 1-186)
- `/components/PresentationView.tsx` - State management, handleGenerateQuestion (lines 130-954)
- `/.planning/PROJECT.md` - Architecture decisions (lines 172-250)

## Open Questions

1. **History UI:** Dropdown below input vs modal overlay?
   - Recommendation: Dropdown for simplicity, minimal disruption

2. **Max response length:** Should AI responses be truncated?
   - Recommendation: No truncation initially; let AI self-regulate via prompt

3. **Input character limit:** Should query input have max length?
   - Recommendation: 500 chars is reasonable, but defer restriction initially

4. **Keyboard shortcut:** Worth adding Cmd+K focus?
   - Recommendation: Defer to Phase 3; not essential for MVP
