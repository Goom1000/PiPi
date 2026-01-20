# Phase 13: AI Error Handling - Research

**Researched:** 2026-01-20
**Domain:** AI service error handling, user feedback UI
**Confidence:** HIGH

## Summary

The codebase already has excellent infrastructure for AI error handling:

1. **Error types are defined** - `AIProviderError` class with `AIErrorCode` enum covers all expected error types (RATE_LIMIT, QUOTA_EXCEEDED, AUTH_ERROR, SERVER_ERROR, NETWORK_ERROR, PARSE_ERROR, etc.)
2. **User-friendly messages exist** - `USER_ERROR_MESSAGES` record maps each error code to a clear message
3. **Toast notification system exists** - `useToast` hook and `ToastContainer` component with variants (success, error, warning, info)
4. **The gap is integration** - AI errors are caught but displayed via modal, not toast. Some code paths may not catch all errors.

The implementation requires connecting existing pieces rather than building new infrastructure.

**Primary recommendation:** Wire existing `AIProviderError` handling to the Toast notification system with automatic retry logic before showing user errors.

## Standard Stack

The existing codebase already uses the recommended patterns:

### Core (Already Implemented)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| React | ^19.2.0 | UI framework | Existing |
| Custom Toast | n/a | Toast notifications | Existing |
| AIProviderError | n/a | Error class | Existing |

### Supporting (No New Dependencies Needed)
| Library | Purpose | Status |
|---------|---------|--------|
| useToast hook | Toast state management | Existing |
| ToastContainer | Toast rendering | Existing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Toast | react-hot-toast | Adding dependency for existing functionality |
| Error modal | Toast | Toast is non-blocking per user decision |

**Installation:** None required - all components exist.

## Architecture Patterns

### Current Error Flow (Problem)
```
SlideCard.handleMagicEdit()
  -> App.handleReviseSlide()
    -> provider.reviseSlide()
      -> catch: setErrorModal()  <-- MODAL, not toast
```

### Recommended Error Flow (Solution)
```
SlideCard.handleMagicEdit()
  -> App.handleReviseSlide()
    -> [silent retry 1-2x]
    -> provider.reviseSlide()
      -> catch: addToast('error', 5000)  <-- TOAST with auto-dismiss
```

### File Locations
```
services/
  aiProvider.ts           # AIProviderError, AIErrorCode, USER_ERROR_MESSAGES
  providers/
    claudeProvider.ts     # Claude implementation - has error handling
    geminiProvider.ts     # Gemini wrapper - has error handling
    geminiService.ts      # Raw Gemini calls - MISSING try/catch on reviseSlide
components/
  Toast.tsx               # Toast components and useToast hook
  SlideCard.tsx           # UI that calls onRevise
App.tsx                   # handleReviseSlide, error modal display
```

### Pattern 1: Error Wrapping at Service Layer
**What:** All service-level errors wrapped in AIProviderError
**When to use:** Every AI API call
**Example:**
```typescript
// Source: services/providers/claudeProvider.ts (already implemented)
try {
  const response = await callClaude(...);
  return extractJSON<T>(response);
} catch (e) {
  throw new AIProviderError(USER_ERROR_MESSAGES.PARSE_ERROR, 'PARSE_ERROR', e);
}
```

### Pattern 2: Silent Retry Before User Feedback
**What:** Retry 1-2 times before showing error to user
**When to use:** Transient failures (network, rate limit)
**Example:**
```typescript
// Recommended implementation
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  retryableErrors: AIErrorCode[] = ['NETWORK_ERROR', 'RATE_LIMIT', 'SERVER_ERROR']
): Promise<T> {
  let lastError: AIProviderError | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof AIProviderError && retryableErrors.includes(error.code)) {
        lastError = error;
        await delay(1000 * (attempt + 1)); // Exponential backoff
        continue;
      }
      throw error; // Non-retryable, throw immediately
    }
  }
  throw lastError!;
}
```

### Pattern 3: Toast for Non-Blocking Errors
**What:** Show error as dismissible toast, not blocking modal
**When to use:** AI operation failures that don't require immediate action
**Example:**
```typescript
// Source: components/Toast.tsx (already implemented)
addToast(
  'AI revision failed. Please try again.',
  5000,  // Auto-dismiss after 5 seconds
  'error'
);
```

### Anti-Patterns to Avoid
- **Using modal for recoverable errors:** User decision specifies toast, not modal
- **Catching errors without wrapping:** Raw errors lose context; always wrap in AIProviderError
- **Swallowing errors silently:** Always show user feedback after retry exhaustion
- **Ignoring error.code:** Different errors need different messages and handling

## Don't Hand-Roll

Problems that already have solutions in the codebase:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error classification | Custom error types | AIErrorCode enum | Already covers all cases |
| User messages | Inline message strings | USER_ERROR_MESSAGES | Centralized, tested |
| Toast notifications | New toast library | useToast + ToastContainer | Already styled, working |
| Provider errors | Per-provider error handling | AIProviderError wrapper | Uniform across providers |

**Key insight:** This phase is about WIRING existing infrastructure, not building new components.

## Common Pitfalls

### Pitfall 1: geminiService.reviseSlide Missing try/catch
**What goes wrong:** `JSON.parse(response.text || "{}")` at line 307 throws on malformed AI response, error bubbles up uncaught
**Why it happens:** Other functions use responseSchema for validation; reviseSlide doesn't
**How to avoid:** Wrap JSON.parse in try/catch, throw AIProviderError with PARSE_ERROR
**Warning signs:** Uncaught SyntaxError in console when AI returns markdown-wrapped JSON

### Pitfall 2: Rate Limit Without Wait Time
**What goes wrong:** Rate limit error shown but user retries immediately, gets same error
**Why it happens:** Anthropic API returns retry-after header; Gemini rate limits are per-minute
**How to avoid:** Parse wait time from API response if available; include "wait a moment" in message
**Warning signs:** Rapid repeated 429 errors in console

### Pitfall 3: Toast Stacking
**What goes wrong:** Multiple rapid failures create stack of toasts covering UI
**Why it happens:** Each retry failure adds a toast before retries complete
**How to avoid:** Only show toast AFTER all retries exhausted; single toast per operation
**Warning signs:** 3+ error toasts appearing simultaneously

### Pitfall 4: Error Modal Still Showing
**What goes wrong:** User decision says toast, but modal still appears for some errors
**Why it happens:** handleReviseSlide calls setErrorModal on AIProviderError
**How to avoid:** Replace setErrorModal with addToast for AI operation errors
**Warning signs:** Modal appearing for revision failures

## Code Examples

### Example 1: Current reviseSlide (geminiService.ts) - PROBLEM
```typescript
// Source: services/geminiService.ts line 291-308
export const reviseSlide = async (apiKey: string, slide: Slide, instruction: string): Promise<Partial<Slide>> => {
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `
    Current Slide: ${JSON.stringify(slide)}
    Edit Instruction: "${instruction}"
    Return ONLY JSON with updated fields.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text || "{}");  // <-- NO TRY/CATCH
};
```

### Example 2: Fixed reviseSlide with Error Handling
```typescript
// Recommended fix
import { AIProviderError, USER_ERROR_MESSAGES } from './aiProvider';

export const reviseSlide = async (apiKey: string, slide: Slide, instruction: string): Promise<Partial<Slide>> => {
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `...`;

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
  } catch (error: any) {
    // Handle API errors (network, rate limit, etc.)
    // GoogleGenAI SDK throws errors with status codes we can map
    throw new AIProviderError(
      USER_ERROR_MESSAGES.NETWORK_ERROR,
      'NETWORK_ERROR',
      error
    );
  }

  try {
    return JSON.parse(response.text || "{}");
  } catch (parseError) {
    throw new AIProviderError(
      USER_ERROR_MESSAGES.PARSE_ERROR,
      'PARSE_ERROR',
      parseError
    );
  }
};
```

### Example 3: Current handleReviseSlide (App.tsx) - PROBLEM
```typescript
// Source: App.tsx line 328-350
const handleReviseSlide = async (id: string, instruction: string) => {
  if (!provider) {
    setEnableAIModal({ featureName: 'refine this slide with AI' });
    return;
  }
  const target = slides.find(s => s.id === id);
  if (!target) return;
  handleUpdateSlide(id, { isGeneratingImage: true });
  try {
    const updates = await provider.reviseSlide(target, instruction);
    handleUpdateSlide(id, { ...updates, isGeneratingImage: false });
    // ... image regeneration
  } catch (err) {
    handleUpdateSlide(id, { isGeneratingImage: false });
    if (err instanceof AIProviderError) {
      setErrorModal({ title: 'Revision Failed', message: err.userMessage });  // <-- MODAL
    }
  }
};
```

### Example 4: Fixed handleReviseSlide with Toast and Retry
```typescript
// Recommended fix
const handleReviseSlide = async (id: string, instruction: string) => {
  if (!provider) {
    setEnableAIModal({ featureName: 'refine this slide with AI' });
    return;
  }
  const target = slides.find(s => s.id === id);
  if (!target) return;
  handleUpdateSlide(id, { isGeneratingImage: true });

  const maxRetries = 2;
  const retryableErrors: AIErrorCode[] = ['NETWORK_ERROR', 'RATE_LIMIT', 'SERVER_ERROR'];
  let lastError: AIProviderError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const updates = await provider.reviseSlide(target, instruction);
      handleUpdateSlide(id, { ...updates, isGeneratingImage: false });
      // ... image regeneration
      return; // Success
    } catch (err) {
      if (err instanceof AIProviderError) {
        if (retryableErrors.includes(err.code) && attempt < maxRetries) {
          lastError = err;
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        lastError = err;
      }
      break;
    }
  }

  handleUpdateSlide(id, { isGeneratingImage: false });
  if (lastError) {
    addToast(lastError.userMessage, 5000, 'error');  // <-- TOAST
  }
};
```

### Example 5: Toast Component (Already Exists)
```typescript
// Source: components/Toast.tsx
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((
    message: string,
    duration: number = 3000,
    variant?: ToastVariant,
    action?: ToastAction  // <-- Can add retry button here
  ) => {
    // ...
  }, []);
  // ...
}
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Error modal | Toast notification | Non-blocking, per user decision |
| Show error on first failure | Silent retry then show | Better UX for transient failures |
| Generic error messages | Error-type-specific messages | Already implemented via USER_ERROR_MESSAGES |

**Already correct in codebase:**
- AIProviderError class with error codes
- USER_ERROR_MESSAGES mapping
- Toast system with variants
- Claude provider has comprehensive error handling

**Needs update:**
- geminiService.reviseSlide needs try/catch
- App.tsx needs to use toast instead of modal for AI errors
- Add retry logic before showing error

## Open Questions

1. **Should retry button be in toast?**
   - CONTEXT.md says "Claude's discretion"
   - Recommendation: Add retry action to error toast for better UX
   - Implementation: Use ToastAction with onClick that re-triggers revision

2. **Toast position preference?**
   - Currently bottom-right (fixed in ToastContainer)
   - CONTEXT.md says "Claude's discretion"
   - Recommendation: Keep bottom-right, it's standard

3. **Gemini SDK error mapping?**
   - @google/genai SDK error structure undocumented
   - Need to test actual error responses to map correctly
   - Recommendation: Log errors during testing, add mapping as needed

## Sources

### Primary (HIGH confidence)
- `/services/aiProvider.ts` - AIProviderError, AIErrorCode, USER_ERROR_MESSAGES definitions
- `/services/providers/claudeProvider.ts` - Claude error handling patterns (mapHttpToErrorCode)
- `/services/providers/geminiProvider.ts` - Gemini wrapper with wrapError
- `/services/geminiService.ts` - reviseSlide function at line 291-308
- `/components/Toast.tsx` - useToast, ToastContainer, ToastVariant definitions
- `/App.tsx` - handleReviseSlide at line 328-350
- `/components/SlideCard.tsx` - handleMagicEdit calls onRevise

### Secondary (MEDIUM confidence)
- `.planning/research/SUMMARY-v2.3.md` - Previous bug analysis identifying reviseSlide issue
- `.planning/phases/13-ai-error-handling/13-CONTEXT.md` - User decisions on error handling

## Metadata

**Confidence breakdown:**
- Error infrastructure: HIGH - All code examined directly
- Toast system: HIGH - Component code examined
- Gemini SDK errors: MEDIUM - Need runtime testing to verify error shapes
- Retry logic: HIGH - Standard pattern, no dependencies

**Research date:** 2026-01-20
**Valid until:** Indefinite (internal codebase analysis, no external dependencies)
