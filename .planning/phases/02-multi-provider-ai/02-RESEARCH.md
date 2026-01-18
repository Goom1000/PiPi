# Phase 2: Multi-Provider AI - Research

**Researched:** 2026-01-19
**Domain:** Multi-provider AI API integration (Gemini, Claude, OpenAI)
**Confidence:** HIGH for Gemini/Claude, MEDIUM for OpenAI (CORS blocker)

## Summary

This phase requires implementing a unified AI service abstraction that routes requests to Gemini, Claude, or OpenAI based on user settings. The current app uses `@google/genai` SDK exclusively. Research revealed a **critical architectural constraint**: OpenAI does NOT support CORS for direct browser requests, while Gemini and Anthropic do.

Key findings:
- **Gemini**: Works in browser via `@google/genai` SDK (current implementation)
- **Anthropic Claude**: Works in browser with special header `anthropic-dangerous-direct-browser-access: true`
- **OpenAI**: Does NOT support CORS - requires server-side proxy or backend

**Primary recommendation:** Implement a provider abstraction layer with direct browser calls for Gemini/Claude, but clearly document that OpenAI requires a backend proxy (or exclude OpenAI from initial implementation and add warning in settings).

## Critical Constraint: OpenAI CORS Limitation

**CRITICAL FINDING:** OpenAI API does not include CORS headers. Direct browser calls will fail with:
```
Access to fetch at 'https://api.openai.com/v1/chat/completions' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Options for handling this:**
1. **Exclude OpenAI initially** - Only support Gemini and Claude (both work in browser)
2. **Add warning in settings** - When user selects OpenAI, show "Requires backend proxy - not supported in this version"
3. **Implement proxy** - Would require backend infrastructure (out of scope for this phase)

**Recommendation:** Option 2 - Keep OpenAI in the dropdown but show a warning that it's not supported for direct browser use. This maintains the UI from Phase 1 while being honest about limitations.

## Standard Stack

### Current (Gemini only)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@google/genai` | ^1.30.0 | Gemini API SDK | Official Google SDK, handles auth and requests |

### Proposed (Multi-provider)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@google/genai` | ^1.30.0 | Gemini API | Already installed, works in browser |
| Native `fetch` | N/A | Claude API | No SDK needed, direct REST calls with CORS header |
| ~~`openai`~~ | N/A | OpenAI API | **NOT USABLE** - No CORS support |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct fetch for Claude | `@anthropic-ai/sdk` | SDK adds bundle size, fetch is sufficient |
| Build-time API key | Runtime from settings | Runtime allows user-provided keys (current plan) |
| Vercel AI SDK | Direct API calls | Heavy dependency, overkill for this use case |

**Installation:**
```bash
# No new packages needed - @google/genai already installed
# Claude uses native fetch
```

## Architecture Patterns

### Recommended Project Structure
```
services/
├── aiProvider.ts        # Unified interface + factory
├── providers/
│   ├── geminiProvider.ts    # Gemini implementation
│   ├── claudeProvider.ts    # Claude implementation
│   └── openaiProvider.ts    # Stub with error (CORS blocked)
├── geminiService.ts     # EXISTING - refactor to use provider
└── apiValidation.ts     # EXISTING - already handles multi-provider
```

### Pattern 1: Provider Interface (Strategy Pattern)

**What:** Define a common interface that all providers implement
**When to use:** When you need to swap implementations at runtime

```typescript
// services/aiProvider.ts
import { AIProvider } from '../types';
import { Slide } from '../types';

export interface AIProviderConfig {
  apiKey: string;
  provider: AIProvider;
}

export interface AIProviderInterface {
  generateLessonSlides(rawText: string, pageImages?: string[]): Promise<Slide[]>;
  generateSlideImage(prompt: string, layout?: string): Promise<string | undefined>;
  generateQuickQuestion(title: string, content: string[], difficulty: string): Promise<string>;
  reviseSlide(slide: Slide, instruction: string): Promise<Partial<Slide>>;
  // ... other methods
}

export function createAIProvider(config: AIProviderConfig): AIProviderInterface {
  switch (config.provider) {
    case 'gemini':
      return new GeminiProvider(config.apiKey);
    case 'claude':
      return new ClaudeProvider(config.apiKey);
    case 'openai':
      throw new AIProviderError(
        'OpenAI is not supported for direct browser access. Please use Gemini or Claude.',
        'PROVIDER_NOT_SUPPORTED'
      );
    default:
      throw new AIProviderError(`Unknown provider: ${config.provider}`, 'UNKNOWN_PROVIDER');
  }
}
```

### Pattern 2: Unified Error Handling

**What:** Normalize errors across providers into user-friendly messages
**When to use:** All API calls to any provider

```typescript
// services/aiProvider.ts
export type AIErrorCode =
  | 'RATE_LIMIT'      // 429 - too many requests
  | 'QUOTA_EXCEEDED'  // 429 - billing/usage limit
  | 'AUTH_ERROR'      // 401/403 - invalid key
  | 'SERVER_ERROR'    // 500/503/529 - provider issues
  | 'NETWORK_ERROR'   // Connection failed
  | 'PROVIDER_NOT_SUPPORTED'
  | 'UNKNOWN_ERROR';

export class AIProviderError extends Error {
  constructor(
    public userMessage: string,
    public code: AIErrorCode,
    public originalError?: unknown
  ) {
    super(userMessage);
    this.name = 'AIProviderError';
  }
}

// Map provider-specific errors to unified codes
function mapErrorToCode(provider: AIProvider, status: number, body?: any): AIErrorCode {
  // Rate limit detection
  if (status === 429) {
    // Check if it's quota vs rate limit
    const message = body?.error?.message || '';
    if (message.includes('quota') || message.includes('billing')) {
      return 'QUOTA_EXCEEDED';
    }
    return 'RATE_LIMIT';
  }

  // Auth errors
  if (status === 401 || status === 403) {
    return 'AUTH_ERROR';
  }

  // Server errors
  if (status >= 500 || status === 529) {
    return 'SERVER_ERROR';
  }

  return 'UNKNOWN_ERROR';
}
```

### Pattern 3: User-Friendly Error Messages

**What:** Map error codes to messages users can understand
**When to use:** When displaying errors in UI

```typescript
// Error message mapping (per CONTEXT.md: generic, no provider-specific details)
const USER_MESSAGES: Record<AIErrorCode, string> = {
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  QUOTA_EXCEEDED: 'Usage limit reached. Please check your billing settings with your AI provider.',
  AUTH_ERROR: 'Invalid API key. Please check your settings.',
  SERVER_ERROR: 'The AI service is temporarily unavailable. Please try again later.',
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  PROVIDER_NOT_SUPPORTED: 'This AI provider is not supported for browser use.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};
```

### Anti-Patterns to Avoid
- **Exposing raw error messages:** Never show technical API errors to users (per CONTEXT.md)
- **Tight coupling to provider:** Don't import provider-specific code in components
- **Ignoring CORS:** Don't assume all providers work in browser (OpenAI doesn't)
- **Duplicating prompts:** Share prompts across providers where possible

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gemini API calls | Custom fetch wrapper | `@google/genai` SDK | SDK handles auth, retries, structured output |
| Error parsing | Manual string matching | Standard HTTP status codes | Consistent across providers |
| JSON schema validation | Custom parser | Provider's structured output feature | Each provider has native support |
| Retry logic | Custom retry loop | Exponential backoff utility | Well-known pattern, easy to implement |

**Key insight:** The Gemini SDK already handles most complexity. For Claude, use direct fetch since CORS is supported. For OpenAI, acknowledge the limitation rather than trying to work around it.

## Common Pitfalls

### Pitfall 1: Assuming All Providers Support Browser CORS
**What goes wrong:** Code works with Gemini, breaks with OpenAI
**Why it happens:** OpenAI intentionally blocks browser requests for security
**How to avoid:** Test each provider in actual browser environment, not just Node.js
**Warning signs:** Works in development but fails in production

### Pitfall 2: Inconsistent Response Parsing
**What goes wrong:** Code expects Gemini response structure, Claude returns different format
**Why it happens:** Each provider structures responses differently
**How to avoid:** Normalize responses in provider-specific code before returning
**Warning signs:** Undefined properties, type errors after switching providers

### Pitfall 3: Hardcoded Model Names
**What goes wrong:** Model names become outdated, calls fail
**Why it happens:** Providers frequently update model names
**How to avoid:** Use "latest" aliases where available, or configure model names
**Warning signs:** "Model not found" errors after no code changes

### Pitfall 4: Ignoring Partial Responses
**What goes wrong:** App crashes when response is incomplete
**Why it happens:** Token limits, network issues, provider interruptions
**How to avoid:** Validate response structure, handle partial success (per CONTEXT.md: "warn and accept")
**Warning signs:** Null/undefined errors in response handling

### Pitfall 5: Exposing API Keys in Client Code
**What goes wrong:** API keys stolen and abused
**Why it happens:** Browser DevTools can inspect all JavaScript
**How to avoid:** Accept that this is a "bring your own key" app; warn users
**Warning signs:** Unexpected billing charges (user reports)

## Code Examples

### Claude API Call (Browser-Compatible)

```typescript
// Source: Anthropic API Documentation + CORS header from research
async function callClaude(
  apiKey: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt?: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true', // REQUIRED for browser
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929', // Or claude-3-5-haiku-latest for speed
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new AIProviderError(
      USER_MESSAGES[mapErrorToCode('claude', response.status, errorBody)],
      mapErrorToCode('claude', response.status, errorBody),
      errorBody
    );
  }

  const data = await response.json();
  return data.content[0]?.text || '';
}
```

### Provider Error Mapping

```typescript
// Source: Research on error codes from Anthropic and OpenAI docs
const ERROR_STATUS_MAP: Record<number, AIErrorCode> = {
  400: 'UNKNOWN_ERROR',   // Bad request
  401: 'AUTH_ERROR',      // Invalid key
  403: 'AUTH_ERROR',      // Permission denied
  404: 'UNKNOWN_ERROR',   // Not found
  413: 'UNKNOWN_ERROR',   // Request too large
  429: 'RATE_LIMIT',      // Rate limit OR quota (check message)
  500: 'SERVER_ERROR',    // Internal error
  503: 'SERVER_ERROR',    // Overloaded
  529: 'SERVER_ERROR',    // Anthropic-specific overload
};

function parseProviderError(status: number, body: any): AIErrorCode {
  // Special handling for 429 - could be rate limit or quota
  if (status === 429) {
    const msg = (body?.error?.message || '').toLowerCase();
    if (msg.includes('quota') || msg.includes('billing') || msg.includes('insufficient')) {
      return 'QUOTA_EXCEEDED';
    }
    return 'RATE_LIMIT';
  }

  return ERROR_STATUS_MAP[status] || 'UNKNOWN_ERROR';
}
```

### Loading State with Provider Name

```typescript
// Source: CONTEXT.md requirement
interface LoadingState {
  isLoading: boolean;
  provider: AIProvider | null;
}

// In component:
{loadingState.isLoading && (
  <div className="loading-indicator">
    Generating slides with {loadingState.provider === 'gemini' ? 'Gemini' :
                            loadingState.provider === 'claude' ? 'Claude' :
                            'AI'}...
  </div>
)}
```

## API Reference Summary

### Gemini (via @google/genai SDK)
```typescript
// Current implementation already correct
const ai = new GoogleGenAI({ apiKey });
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: { parts: contents },
  config: {
    systemInstruction,
    responseMimeType: 'application/json',
    responseSchema: { /* ... */ }
  }
});
```

### Claude (via fetch)
```typescript
// Headers required
{
  'content-type': 'application/json',
  'x-api-key': apiKey,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true'
}

// Body structure
{
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4096,
  system: 'System prompt here',
  messages: [{ role: 'user', content: 'User message' }]
}

// Response structure
{
  content: [{ type: 'text', text: 'Response' }],
  stop_reason: 'end_turn',
  usage: { input_tokens: 10, output_tokens: 50 }
}
```

### OpenAI (NOT SUPPORTED IN BROWSER)
```typescript
// This will fail due to CORS
// DO NOT implement - show error message instead
throw new AIProviderError(
  'OpenAI is not available for browser-based apps. Please select Gemini or Claude.',
  'PROVIDER_NOT_SUPPORTED'
);
```

## Error Codes Reference

### Anthropic Claude
| HTTP | Error Type | Meaning |
|------|------------|---------|
| 400 | invalid_request_error | Bad request format |
| 401 | authentication_error | Invalid API key |
| 403 | permission_error | Key lacks permission |
| 404 | not_found_error | Resource not found |
| 413 | request_too_large | Request > 32MB |
| 429 | rate_limit_error | Rate limit hit |
| 500 | api_error | Server error |
| 529 | overloaded_error | High traffic |

### Google Gemini
| HTTP | Status | Meaning |
|------|--------|---------|
| 400 | INVALID_ARGUMENT | Bad request |
| 401 | UNAUTHENTICATED | Invalid key |
| 403 | PERMISSION_DENIED | Key lacks access |
| 429 | RESOURCE_EXHAUSTED | Rate/quota limit |
| 500 | INTERNAL | Server error |
| 503 | UNAVAILABLE | Service unavailable |

### OpenAI (for reference, won't reach browser)
| HTTP | Type | Meaning |
|------|------|---------|
| 401 | invalid_api_key | Invalid key |
| 429 | rate_limit_exceeded | Too many requests |
| 429 | insufficient_quota | Billing limit |
| 500 | server_error | Server issue |
| 503 | service_unavailable | Overloaded |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@google/generative-ai` | `@google/genai` | Dec 2024 | Unified SDK for all Google AI |
| Server-side only Claude | Browser CORS support | Aug 2024 | Direct browser calls possible |
| Build-time API keys | Runtime from localStorage | This phase | User-provided keys |

**Deprecated/outdated:**
- `@google/generative-ai` - Replaced by `@google/genai` (unified SDK)
- Old Anthropic SDK without CORS - Now supports browser with header

## Open Questions

1. **Should OpenAI be removed from settings UI?**
   - What we know: OpenAI blocks CORS, cannot work in browser
   - What's unclear: User expectations, whether to keep option with warning
   - Recommendation: Keep in UI with clear warning/disabled state

2. **Structured output compatibility across providers**
   - What we know: Gemini has responseSchema, Claude has structured outputs beta
   - What's unclear: Whether JSON output quality is equivalent across providers
   - Recommendation: Test with actual prompts during implementation

3. **Model selection**
   - What we know: Each provider has multiple models (fast vs capable)
   - What's unclear: Whether to expose model selection or hardcode sensible defaults
   - Recommendation: Hardcode defaults for now (Gemini Flash, Claude Sonnet)

## Sources

### Primary (HIGH confidence)
- [Anthropic Messages API](https://platform.claude.com/docs/en/api/messages) - Request/response format
- [Anthropic Errors](https://platform.claude.com/docs/en/api/errors) - Error codes
- [@google/genai npm](https://www.npmjs.com/package/@google/genai) - SDK usage
- [Simon Willison: Claude CORS](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/) - Browser support header

### Secondary (MEDIUM confidence)
- [OpenAI Error Codes](https://platform.openai.com/docs/guides/error-codes) - Error handling patterns
- [Gemini Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits) - 429 handling
- [OpenAI CORS Discussion](https://community.openai.com/t/cross-origin-resource-sharing-cors/28905) - Confirms no CORS

### Tertiary (LOW confidence)
- Various community forum posts about CORS workarounds
- Blog posts about multi-provider patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs and current implementation verified
- Architecture: HIGH - Strategy pattern is well-established, CORS constraints verified
- Pitfalls: HIGH - CORS limitation is definitive, error codes from official docs
- OpenAI support: LOW - May change in future, currently blocked

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - providers update frequently)
