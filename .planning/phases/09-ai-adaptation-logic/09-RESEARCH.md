# Phase 9: AI Adaptation Logic - Research

**Researched:** 2026-01-19
**Domain:** AI prompt engineering for multi-mode slide generation
**Confidence:** HIGH

## Summary

This phase requires extending the existing AI provider interface to support three generation modes (fresh, refine, blend) with mode-specific prompts and teleprompter script generation for all modes. The current codebase already has:

1. A clean provider abstraction (`AIProviderInterface`) implemented by `GeminiProvider` and `ClaudeProvider`
2. Upload mode derivation (`uploadMode`) computed from file state in `App.tsx`
3. Processed content available: `lessonText`, `pageImages` for lessons; `existingPptText`, `existingPptImages` for presentations

The implementation requires:
1. Extending `AIProviderInterface.generateLessonSlides()` to accept an optional `mode` parameter and presentation content
2. Creating mode-specific system prompts for refine and blend modes
3. Updating `App.tsx` to pass the upload mode and presentation content to the provider

**Primary recommendation:** Extend the existing `generateLessonSlides` method signature to accept mode and presentation data, then implement mode-specific prompts in each provider. Keep the single-method approach rather than creating separate methods per mode.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Existing provider pattern | N/A | AI abstraction | Already in codebase, working well |
| TypeScript discriminated unions | N/A | Type-safe mode handling | Clean exhaustive checks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | - | - | No new dependencies required |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extending generateLessonSlides | Creating separate methods (generateRefine, generateBlend) | More duplication, harder to maintain shared logic |
| Mode parameter | Discriminated union config object | Config object more flexible but adds complexity for 3 simple modes |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Changes

**1. Extend the method signature in `aiProvider.ts`:**

```typescript
// New types to add
export type GenerationMode = 'fresh' | 'refine' | 'blend';

export interface GenerationInput {
  lessonText: string;
  lessonImages?: string[];
  presentationText?: string;
  presentationImages?: string[];
  mode: GenerationMode;
}

// Updated interface method signature
export interface AIProviderInterface {
  generateLessonSlides(input: GenerationInput): Promise<Slide[]>;
  // ... other methods unchanged
}
```

**2. Update each provider with mode-specific prompts:**

The prompt structure for each mode:

```
FRESH MODE (existing behavior):
- Input: Lesson plan text + images
- Output: New PiPi-style slides with teleprompter scripts
- System prompt: Existing prompt (already optimized)

REFINE MODE:
- Input: Existing presentation PDF (images + text)
- Output: New PiPi-style slides extracted from presentation
- Key behaviors:
  - Extract key concepts, rebuild in PiPi style
  - AI decides slide count (not forced to match original)
  - May reorder for pedagogical flow
  - Note visual descriptions for teacher to re-add
  - Generate teleprompter scripts from inferred content

BLEND MODE:
- Input: Lesson plan + existing presentation
- Output: Enhanced slides combining both sources
- Key behaviors:
  - Determine content overlap
  - Add slides for topics in lesson but not presentation
  - Standardize to PiPi format
  - Flag conflicts between sources
  - Scripts synthesize both sources
```

**3. Update App.tsx handleGenerate:**

```typescript
// Change from:
const generatedSlides = await provider.generateLessonSlides(lessonText, pageImages);

// To:
const generatedSlides = await provider.generateLessonSlides({
  lessonText,
  lessonImages: pageImages,
  presentationText: existingPptText,
  presentationImages: existingPptImages,
  mode: uploadMode as GenerationMode, // Cast from UploadMode
});
```

### Anti-Patterns to Avoid
- **Creating separate provider methods per mode:** Leads to code duplication and maintenance burden
- **Putting mode logic in App.tsx:** Keep mode handling in the provider where prompts live
- **Hardcoding mode detection in providers:** Mode should be explicit parameter, not inferred

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mode detection | Inferring mode from input presence | Explicit `mode` parameter from App.tsx | Already computed correctly in `uploadMode` |
| Teleprompter format | New format | Existing "segment format" with delimiters | Proven format already works |
| Slide schema | New schema per mode | Existing Slide interface | Output format should be identical regardless of mode |

**Key insight:** The output (Slide[]) is identical for all modes. Only the input and prompts differ.

## Common Pitfalls

### Pitfall 1: Breaking existing fresh mode
**What goes wrong:** Changing the signature breaks all existing callers
**Why it happens:** Multiple methods call generateLessonSlides
**How to avoid:** Make new parameters optional with defaults that preserve existing behavior
**Warning signs:** TypeScript errors after signature change

### Pitfall 2: Inconsistent teleprompter format across modes
**What goes wrong:** Refine/blend modes generate scripts without proper delimiter format
**Why it happens:** Copy-pasting prompts without including teleprompter rules
**How to avoid:** Extract teleprompter rules into a shared constant; include in all mode prompts
**Warning signs:** Scripts without "delimiters" or incorrect segment counts

### Pitfall 3: Presentation images not passed correctly
**What goes wrong:** Claude/Gemini don't "see" the presentation pages
**Why it happens:** Image format differs between providers; forgetting to include images
**How to avoid:** Follow existing pattern for pageImages; test with actual PDF images
**Warning signs:** AI generates generic content not based on presentation

### Pitfall 4: Mode string mismatch between App.tsx and providers
**What goes wrong:** App.tsx uses 'refine' but provider expects 'REFINE'
**Why it happens:** TypeScript doesn't catch string case mismatches
**How to avoid:** Use shared `GenerationMode` type; exhaustive switch statements
**Warning signs:** Mode-specific code never executes, falls through to default

### Pitfall 5: Overly long prompts hitting token limits
**What goes wrong:** Blend mode with full lesson + presentation content exceeds model limits
**Why it happens:** Both text and multiple images sent together
**How to avoid:** Limit images to 5 per source (current pattern); truncate text if needed
**Warning signs:** API errors about context length or rate limits

## Code Examples

Verified patterns from official sources and existing codebase:

### Mode-Specific System Prompt Structure (ClaudeProvider pattern)

```typescript
// In claudeProvider.ts - systemPrompt selection by mode

const TELEPROMPTER_RULES = `
STRICT SPEAKER NOTE RULES (TELEPROMPTER LOGIC):
The app uses a "Progressive Disclosure" system.
1. The visual bullet point appears.
2. The Student reads the bullet.
3. The Teacher (Teleprompter) adds insight.

Therefore:
- **NEVER** repeat the text that is on the slide in the speaker notes.
- **NEVER** re-summarize a point that was just made in the previous bullet.
- Each note must **ADD VALUE**: provide a concrete example, an analogy, or a "Why this matters" explanation.
- Ensure a continuous narrative flow. Note 2 must naturally follow Note 1.

FORMATTING:
The speaker notes must use "delimiter" as a delimiter.
- Segment 0 (Intro): Set the scene before bullet 1 appears.
- Segment 1 (for Bullet 1): Elaborate on Bullet 1.
- Segment 2 (for Bullet 2): Elaborate on Bullet 2 (Do not repeat Segment 1).
- The number of "delimiter" segments MUST be exactly (Number of Bullets + 1).
`;

function getSystemPromptForMode(mode: GenerationMode): string {
  switch (mode) {
    case 'fresh':
      return `
You are an elite Primary Education Consultant.
Your goal is to transform a formal lesson plan into a teaching slideshow.
${TELEPROMPTER_RULES}
[... rest of existing fresh prompt ...]
`;

    case 'refine':
      return `
You are an elite Primary Education Consultant.
Your goal is to transform an existing presentation into clean, less text-dense PiPi-style slides.

REFINE MODE RULES:
- Extract key concepts from the presentation provided.
- Create NEW PiPi-style slides from scratch (do not preserve original formatting).
- You decide the optimal slide count based on content density.
- You may reorder slides for better pedagogical flow.
- Note any images/diagrams that existed with "[Visual: description]" so the teacher knows to re-add them.
- Output stands alone - no references to "original slide 3" or similar.

${TELEPROMPTER_RULES}
[... output format instructions ...]
`;

    case 'blend':
      return `
You are an elite Primary Education Consultant.
Your goal is to create slides that combine lesson content with an existing presentation.

BLEND MODE RULES:
- Analyze both the lesson plan AND existing presentation.
- Determine content overlap between sources.
- If lesson contains topics NOT in presentation, add new slides for those topics.
- Standardize ALL output to PiPi style (do not try to match original presentation aesthetic).
- When lesson says X but presentation says Y, note the discrepancy: "[Note: Sources differ on...]"
- Output stands alone - no references to source documents.

${TELEPROMPTER_RULES}
[... output format instructions ...]
`;
  }
}
```

### Building Content Parts with Presentation (Claude format)

```typescript
// In claudeProvider.ts - building message content for blend mode

async generateLessonSlides(input: GenerationInput): Promise<Slide[]> {
  const systemPrompt = getSystemPromptForMode(input.mode);

  const contentParts: ClaudeContentBlock[] = [];

  // Add text prompt based on mode
  if (input.mode === 'fresh') {
    contentParts.push({
      type: 'text',
      text: `Transform this formal lesson plan into a sequence of teaching slides: ${input.lessonText}`
    });
  } else if (input.mode === 'refine') {
    contentParts.push({
      type: 'text',
      text: `Transform this existing presentation into PiPi-style slides: ${input.presentationText}`
    });
  } else { // blend
    contentParts.push({
      type: 'text',
      text: `Combine this lesson plan:\n\n${input.lessonText}\n\nWith this existing presentation:\n\n${input.presentationText}\n\nCreate enhanced PiPi-style slides.`
    });
  }

  // Add lesson images (fresh or blend mode)
  if ((input.mode === 'fresh' || input.mode === 'blend') && input.lessonImages?.length) {
    input.lessonImages.forEach(base64 => {
      contentParts.push(formatImageForClaude(base64));
    });
  }

  // Add presentation images (refine or blend mode)
  if ((input.mode === 'refine' || input.mode === 'blend') && input.presentationImages?.length) {
    input.presentationImages.forEach(base64 => {
      contentParts.push(formatImageForClaude(base64));
    });
  }

  // ... rest of API call
}
```

### Backward-Compatible Signature

```typescript
// In aiProvider.ts - maintain backward compatibility

export interface AIProviderInterface {
  // New signature with optional parameters for backward compatibility
  generateLessonSlides(
    input: GenerationInput | string,  // Accept old signature too
    pageImages?: string[]             // Old second parameter
  ): Promise<Slide[]>;
}

// In provider implementation:
async generateLessonSlides(
  inputOrText: GenerationInput | string,
  pageImages?: string[]
): Promise<Slide[]> {
  // Normalize to GenerationInput
  const input: GenerationInput = typeof inputOrText === 'string'
    ? { lessonText: inputOrText, lessonImages: pageImages, mode: 'fresh' }
    : inputOrText;

  // ... rest of implementation
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single prompt | Mode-specific prompts | This phase | Enables refine/blend modes |
| lessonText only | GenerationInput object | This phase | Supports multiple input sources |

**Deprecated/outdated:**
- N/A - this is new functionality

## Open Questions

Things that couldn't be fully resolved:

1. **Visual description format in refine mode**
   - What we know: AI should note what visuals existed
   - What's unclear: Exact format - inline "[Visual: ...]" or separate field?
   - Recommendation: Use inline notation in bullet text, simplest to implement

2. **Conflict flagging in blend mode**
   - What we know: Flag when sources disagree
   - What's unclear: Where to surface conflicts - in slide content, speaker notes, or separate?
   - Recommendation: Add as final item in speakerNotes with "[Note: ...]" prefix

3. **Slide count limits**
   - What we know: AI decides count based on content
   - What's unclear: Should there be min/max bounds?
   - Recommendation: No hard limits in prompt; trust AI judgment (per CONTEXT.md decision)

## Sources

### Primary (HIGH confidence)
- `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/services/aiProvider.ts` - current provider interface
- `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/services/providers/claudeProvider.ts` - Claude implementation with prompts
- `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/services/providers/geminiProvider.ts` - Gemini wrapper
- `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/services/geminiService.ts` - Full Gemini implementation with prompts
- `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/App.tsx` - handleGenerate and upload state

### Secondary (MEDIUM confidence)
- `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/.planning/phases/09-ai-adaptation-logic/09-CONTEXT.md` - User decisions

### Tertiary (LOW confidence)
- None - all research based on existing codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, extending existing pattern
- Architecture: HIGH - clear extension path for existing interface
- Pitfalls: HIGH - based on patterns observed in existing code

**Research date:** 2026-01-19
**Valid until:** N/A - codebase-specific implementation
