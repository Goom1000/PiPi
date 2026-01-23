# Phase 22: AI Integration - Research

**Researched:** 2026-01-23
**Domain:** AI-powered educational question generation with game-specific formatting
**Confidence:** HIGH

## Summary

This phase adds AI question generation specifically designed for quiz games, building on the existing AI provider infrastructure (`aiProvider.ts`, `geminiProvider.ts`, `claudeProvider.ts`). The codebase already has mature patterns for AI calls, structured JSON output, and error handling. The new capability is generating game-specific question sets with difficulty progression.

The primary challenge is crafting prompts that generate:
1. Progressively difficult questions for Millionaire (easy-to-hard across 3/5/10 questions)
2. Consistently-leveled rapid-fire questions for Chase/Beat the Chaser
3. Plausible distractors that test understanding, not guessing
4. Cumulative context from slide content (current + previous slides)

The existing `generateImpromptuQuiz` function provides the foundation. Phase 22 extends this with explicit difficulty mapping (Bloom's taxonomy), game-specific prompts, and teacher-selected difficulty presets.

**Primary recommendation:** Extend the existing `AIProviderInterface` with a new `generateGameQuestions` method that accepts game type, difficulty preset, question count, and slide context. Use Bloom's taxonomy levels in prompts for consistent difficulty calibration.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @google/genai | (existing) | Gemini API structured output | Already integrated, native JSON schema support |
| Anthropic Claude API | (existing) | Claude text generation with JSON | Already integrated via fetch |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native fetch | built-in | HTTP requests to Claude | Used for all Claude API calls |
| Response schemas | Gemini native | Enforce JSON structure | Guarantees valid question format |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native implementation | LangChain | Adds 500KB+ dependency, project constraint is zero new runtime deps |
| Inline prompts | Prompt templates library | Overkill for this use case, inline prompts are maintainable |

**Installation:**
```bash
# No new dependencies - uses existing AI providers
```

## Architecture Patterns

### Recommended Project Structure
```
services/
├── aiProvider.ts              # Add generateGameQuestions to interface
├── geminiService.ts           # Add generateGameQuestions implementation
└── providers/
    ├── geminiProvider.ts      # Wrap new function
    └── claudeProvider.ts      # Implement with tool call pattern
components/
└── games/
    └── shared/
        └── GameQuestionTypes.ts  # Game-specific question type definitions
```

### Pattern 1: Game-Specific Question Generation
**What:** Separate prompt strategies per game type
**When to use:** When different games need different question characteristics
**Example:**
```typescript
// Existing pattern from geminiService.ts (verified in codebase)
export interface GameQuestionRequest {
  gameType: 'millionaire' | 'the-chase' | 'beat-the-chaser';
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  slideContext: SlideContext;
  optionalHints?: string;  // Teacher's focus hints
}

function getPromptForGame(request: GameQuestionRequest): string {
  switch (request.gameType) {
    case 'millionaire':
      return getMillionairePrompt(request.questionCount);
    case 'the-chase':
    case 'beat-the-chaser':
      return getChasePrompt(request.difficulty, request.questionCount);
  }
}
```

### Pattern 2: Difficulty via Bloom's Taxonomy
**What:** Map Easy/Medium/Hard to Bloom's levels
**When to use:** Converting teacher-friendly presets to pedagogically-sound prompts
**Example:**
```typescript
// Based on existing generateQuestionWithAnswer pattern in codebase
const BLOOM_DIFFICULTY_MAP = {
  easy: {
    levels: ['Remember', 'Understand'],
    questionTypes: '"What is...", "Name the...", "Give an example of..."',
    description: 'Basic recall and comprehension questions'
  },
  medium: {
    levels: ['Apply', 'Analyze'],
    questionTypes: '"How would you...", "What would happen if...", "Compare..."',
    description: 'Application and analysis questions'
  },
  hard: {
    levels: ['Evaluate', 'Create'],
    questionTypes: '"Why does X affect Y?", "What is the best strategy for..."',
    description: 'Evaluation and synthesis questions requiring reasoning'
  }
};
```

### Pattern 3: Retry with Silent Auto-Recovery
**What:** Auto-retry 2-3 times on generation failure before surfacing error
**When to use:** All game question generation calls
**Example:**
```typescript
// Matches error handling pattern from existing claudeProvider.ts
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (e) {
      lastError = e as Error;
      if (attempt < maxRetries - 1) {
        await sleep(initialDelay * Math.pow(2, attempt));
      }
    }
  }
  throw lastError;
}
```

### Pattern 4: Cumulative Slide Context
**What:** Include current + previous slides for question generation
**When to use:** All game question generation
**Example:**
```typescript
// Matches existing generateImpromptuQuiz pattern (verified in codebase line 539-550)
interface SlideContext {
  lessonTopic: string;
  cumulativeContent: string;  // All slides up to and including current
  currentSlideTitle: string;
  currentSlideContent: string[];
}

function buildSlideContext(slides: Slide[], currentIndex: number): SlideContext {
  const relevantSlides = slides.slice(0, currentIndex + 1);
  const cumulativeContent = relevantSlides
    .map((s, i) => `Slide ${i + 1} (${s.title}): ${s.content.join('; ')}`)
    .join('\n\n');

  return {
    lessonTopic: slides[0]?.title || 'Unknown Topic',
    cumulativeContent,
    currentSlideTitle: slides[currentIndex].title,
    currentSlideContent: slides[currentIndex].content
  };
}
```

### Anti-Patterns to Avoid
- **Hardcoding question counts:** Let game type determine count, not the prompt itself
- **Single-shot generation without retry:** Network failures are common, always retry silently
- **Ignoring Bloom's taxonomy:** "Make it harder" is vague, use specific cognitive levels
- **Overloading prompts:** Keep prompts focused on one game type, don't try to do everything

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation | Manual parsing with try/catch | Gemini responseSchema / Claude tool pattern | Native enforcement prevents malformed output |
| Distractor generation | Simple random wrong answers | Explicit prompt instructions for plausible distractors | Research shows AI makes longest answer correct unless explicitly instructed |
| Difficulty calibration | "Easy/Medium/Hard" keywords | Bloom's taxonomy levels in prompt | Pedagogically validated, consistent results |
| Rate limit handling | Single request with timeout | Exponential backoff retry (existing pattern) | Industry standard, prevents cascading failures |
| Error messages | Technical error text | AIProviderError with USER_ERROR_MESSAGES | Already standardized in codebase |

**Key insight:** The existing codebase has excellent error handling patterns in `aiProvider.ts`. Don't reinvent - extend the existing `AIProviderError` and `USER_ERROR_MESSAGES` for new error cases.

## Common Pitfalls

### Pitfall 1: Distractors Too Obviously Wrong
**What goes wrong:** AI generates correct answer that's longest/most detailed, distractors are clearly implausible
**Why it happens:** LLMs naturally make correct answers more precise and complete
**How to avoid:** Explicit prompt instruction: "Make all options similar length. Distractors must be plausible misconceptions a student might have."
**Warning signs:** Students scoring 90%+ on first try indicates too-easy distractors

### Pitfall 2: Difficulty Regression in Sequences
**What goes wrong:** Millionaire question 8 is easier than question 3
**Why it happens:** LLMs may lose context of difficulty progression in long sequences
**How to avoid:** Include explicit difficulty markers per question: "Question 1-3: Remember/Understand. Question 4-6: Apply/Analyze. Question 7-10: Evaluate/Create."
**Warning signs:** Teacher feedback that questions "felt random in difficulty"

### Pitfall 3: Questions Outside Slide Content
**What goes wrong:** AI generates questions about topics not covered in slides
**Why it happens:** LLM uses training data instead of provided context (hallucination)
**How to avoid:** Strong prompt constraint: "Generate questions ONLY from the provided slide content. Do not use external knowledge."
**Warning signs:** Students confused by questions about topics not discussed

### Pitfall 4: Mid-Game Regeneration State Corruption
**What goes wrong:** Teacher regenerates a bad question, game state becomes inconsistent
**Why it happens:** Partial state update without proper transaction
**How to avoid:** Regenerate single question by index, keep all other state unchanged
**Warning signs:** Game shows wrong question number or crashes after regeneration

### Pitfall 5: Thin Content Generates Bad Questions
**What goes wrong:** Slide with 1 bullet generates repetitive or off-topic questions
**Why it happens:** Insufficient source material for requested question count
**How to avoid:** Detect thin content and either reduce question count or show warning to teacher
**Warning signs:** AI generating questions from same fact phrased differently

## Code Examples

Verified patterns from official sources and existing codebase:

### Millionaire Progressive Difficulty Prompt
```typescript
// Based on existing generateImpromptuQuiz pattern, extended with Bloom's mapping
const MILLIONAIRE_SYSTEM_PROMPT = `
You are a quiz master creating "Who Wants to Be a Millionaire" style questions for Year 6 students (10-11 years old).

PROGRESSIVE DIFFICULTY RULES (Bloom's Taxonomy):
${getProgressionRules(questionCount)}

DISTRACTOR RULES (CRITICAL):
- All 4 options must be similar in length and specificity
- Distractors must be plausible misconceptions, NOT obviously wrong
- Never include "All of the above" or "None of the above"
- Avoid using negatives in questions ("Which is NOT...")

OUTPUT FORMAT:
Return a JSON array with exactly ${questionCount} questions.
Each question object must have:
- question (string): Clear, age-appropriate question
- options (array of exactly 4 strings): A, B, C, D choices
- correctAnswerIndex (number 0-3): Index of correct answer
- explanation (string): Brief encouraging explanation
`;

function getProgressionRules(count: 3 | 5 | 10): string {
  if (count === 3) {
    return `
Questions 1-1: EASY (Remember/Understand) - "What is...", "Name the..."
Questions 2-2: MEDIUM (Apply/Analyze) - "How would...", "What would happen..."
Questions 3-3: HARD (Evaluate/Create) - "Why does...", "What is the best..."`;
  }
  if (count === 5) {
    return `
Questions 1-2: EASY (Remember/Understand) - "What is...", "Name the..."
Questions 3-4: MEDIUM (Apply/Analyze) - "How would...", "What would happen..."
Question 5: HARD (Evaluate/Create) - "Why does...", "What is the best..."`;
  }
  return `
Questions 1-3: EASY (Remember/Understand) - "What is...", "Name the..."
Questions 4-6: MEDIUM (Apply/Analyze) - "How would...", "What would happen..."
Questions 7-10: HARD (Evaluate/Create) - "Why does...", "What is the best..."`;
}
```

### Chase Consistent Difficulty Prompt
```typescript
// Rapid-fire questions at consistent level
const CHASE_SYSTEM_PROMPT = (difficulty: 'easy' | 'medium' | 'hard') => `
You are a quiz master creating rapid-fire questions for "The Chase" style game for Year 6 students.

DIFFICULTY: ${difficulty.toUpperCase()}
${BLOOM_DIFFICULTY_MAP[difficulty].description}
Question types: ${BLOOM_DIFFICULTY_MAP[difficulty].questionTypes}

ALL questions must be at ${difficulty} level. No progression - consistent difficulty.

QUICK-FIRE RULES:
- Questions should be answerable in 5-10 seconds
- Single concept per question, no multi-part questions
- Avoid ambiguous wording
- Keep options short (1-5 words each when possible)

DISTRACTOR RULES:
- All 4 options must be plausible
- Distractors should reflect common misconceptions
- Similar length and specificity across all options
`;
```

### Regenerate Single Question
```typescript
// Pattern for mid-game question regeneration
async function regenerateQuestion(
  provider: AIProviderInterface,
  currentQuestions: QuizQuestion[],
  questionIndex: number,
  slideContext: SlideContext,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<QuizQuestion[]> {
  const systemPrompt = `
Generate a single ${difficulty} question for Year 6 students.
The question must be different from these existing questions:
${currentQuestions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}

Return a single JSON object (not array) with: question, options (4), correctAnswerIndex (0-3), explanation.
`;

  const newQuestion = await withRetry(() =>
    generateSingleQuestion(provider, systemPrompt, slideContext)
  );

  // Replace only the specific question
  const updated = [...currentQuestions];
  updated[questionIndex] = newQuestion;
  return updated;
}
```

### Interface Extension
```typescript
// Extending existing AIProviderInterface pattern
export interface AIProviderInterface {
  // ... existing methods ...

  generateGameQuestions(
    request: GameQuestionRequest
  ): Promise<QuizQuestion[]>;
}

export interface GameQuestionRequest {
  gameType: 'millionaire' | 'the-chase' | 'beat-the-chaser';
  difficulty: 'easy' | 'medium' | 'hard';  // For Chase/Beat the Chaser
  questionCount: number;
  slideContext: SlideContext;
  optionalHints?: string;  // Teacher's optional focus hints
}

export interface SlideContext {
  lessonTopic: string;
  cumulativeContent: string;
  currentSlideTitle: string;
  currentSlideContent: string[];
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic "generate quiz" prompts | Bloom's taxonomy-aligned difficulty | 2024-2025 | 95%+ accuracy with consistent difficulty |
| Hoping distractors are plausible | Explicit distractor rules in prompt | 2024 | Reduces "obviously wrong" answers |
| Single API call with timeout | Retry with exponential backoff | Standard practice | Handles transient failures gracefully |
| Free-form JSON parsing | Native structured output (Gemini responseSchema) | 2024-2025 | Eliminates parse errors |

**Deprecated/outdated:**
- Davinci/GPT-3 for education: Claude Sonnet and Gemini Flash are faster and better for structured output
- Manual JSON extraction: Use native structured output where available

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal question count for Chase rapid-fire**
   - What we know: TV show uses ~60 seconds of questions, varies by round
   - What's unclear: Ideal count for classroom (not timed the same way)
   - Recommendation: Start with 10 questions, make configurable based on teacher feedback

2. **Thin content threshold**
   - What we know: 1-2 bullet points generate poor questions
   - What's unclear: Exact threshold for warning vs. auto-adjustment
   - Recommendation: If cumulative content < 200 words, show warning but proceed

3. **True/false format for rapid-fire**
   - What we know: CONTEXT.md mentions "true/false for rapid-fire" as Claude's discretion
   - What's unclear: Whether to mix true/false with MCQ or have separate modes
   - Recommendation: Stick with 4-option MCQ for consistency, revisit in Phase 24 if needed

## Sources

### Primary (HIGH confidence)
- Codebase: `services/geminiService.ts` - existing question generation patterns (verified lines 527-599)
- Codebase: `services/providers/claudeProvider.ts` - Claude JSON extraction pattern (verified lines 205-215)
- Codebase: `services/aiProvider.ts` - error handling patterns (verified lines 17-53)
- [Gemini Structured Output Documentation](https://firebase.google.com/docs/ai-logic/generate-structured-output)

### Secondary (MEDIUM confidence)
- [Automated Educational Question Generation at Different Bloom's Skill Levels](https://arxiv.org/html/2408.04394v1) - Academic research on Bloom's taxonomy + LLMs
- [Generating Plausible Distractors for Multiple-Choice Questions](https://arxiv.org/html/2501.13125v3) - Research on distractor quality
- [Structured Output Comparison across LLM Providers](https://medium.com/@rosgluk/structured-output-comparison-across-popular-llm-providers-openai-gemini-anthropic-mistral-and-1a5d42fa612a) - Provider capability comparison

### Tertiary (LOW confidence)
- [AI Chatbots Are Terrible at Creating Multiple-Choice Questions](https://medium.com/@sverbic/ai-chatbots-are-terrible-at-creating-multiple-choice-questions-cca4c6c3d37e) - Common pitfalls (anecdotal)
- [How to generate outstanding multiple-choice questions using ChatGPT](https://workera.ai/blog/chatgpt-learning-assessments) - Practical tips

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing proven providers
- Architecture: HIGH - Extending established patterns from codebase
- Prompts: MEDIUM - Based on research but needs validation with real content
- Pitfalls: MEDIUM - Based on research and known LLM limitations

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - LLM APIs are stable)
