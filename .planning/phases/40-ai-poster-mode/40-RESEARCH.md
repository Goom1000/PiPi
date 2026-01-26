# Phase 40: AI Poster Mode - Research

**Researched:** 2026-01-27
**Domain:** AI-powered content transformation, educational poster design, PDF generation
**Confidence:** HIGH

## Summary

AI Poster Mode transforms presentation slides into educational wall posters optimized for classroom display. The standard approach combines Claude API for content transformation with jsPDF for programmatic PDF generation. Research reveals that effective educational posters require careful typography hierarchy (36-72pt headlines, 16-24pt body), subject-appropriate color psychology, and AI prompts that adapt vocabulary to student reading levels.

The project already uses Claude Sonnet 4 (`claude-sonnet-4-20250514`) and jsPDF 4.0, providing a solid foundation. The challenge is designing prompts that transform slide content into poster-appropriate layouts while maintaining pedagogical quality.

**Primary recommendation:** Use Claude's structured outputs (JSON mode with schema) to generate poster layouts with content transformation, then render these as React components captured via html2canvas (same approach as Phase 39 Quick Export) for reliable PDF generation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Claude API | claude-sonnet-4-20250514 | Content transformation & layout decisions | Already integrated; excellent at educational content adaptation with structured outputs |
| jsPDF | 4.0.0 | PDF generation | Already used in Phase 39; supports programmatic drawing and image embedding |
| html2canvas | 1.4.1 | React component to canvas rendering | Already used in Phase 39; preserves CSS styling including Tailwind |
| React 19 | 19.2.0 | Component rendering | Project standard; allows preview and PDF generation from same components |
| Tailwind CSS | (via Vite) | Poster styling | Project standard; rapid styling for poster layouts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ReactDOM.createRoot | 19.2.0 | Off-screen rendering | Already used in Phase 39 for hidden slide rendering |
| TypeScript | 5.8.2 | Type safety | Project standard; ensures schema consistency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| html2canvas | jsPDF text/drawing API directly | Direct API is more precise but far more complex; would need manual layout calculations instead of CSS |
| Claude API | Gemini API | Gemini already in project, but Claude performs better at structured educational content transformation |
| Single API call | react-pdf or @react-pdf/renderer | These libraries are specialized for PDF-first workflows but add dependencies; current stack (React + html2canvas) reuses existing infrastructure |

**Installation:**
```bash
# No new dependencies needed - all libraries already installed
# Verify existing packages:
npm list jspdf html2canvas react react-dom
```

## Architecture Patterns

### Recommended Project Structure
```
components/
├── ExportModal.tsx          # Already exists from Phase 39
├── PosterRenderer.tsx        # NEW: Renders poster layouts from AI-generated specs
└── PosterPreview.tsx         # NEW: Shows generated posters before download

services/
├── providers/
│   └── claudeProvider.ts     # EXTEND: Add generatePosterContent method
└── posterService.ts          # NEW: Orchestrates AI generation + PDF creation
```

### Pattern 1: AI Content Transformation with Structured Output
**What:** Use Claude's structured outputs feature (beta) to get reliable JSON schemas for poster layouts
**When to use:** For all AI poster generation - ensures consistent schema without retry logic

**Example:**
```typescript
// Source: Anthropic Structured Outputs docs (Dec 2025)
// https://platform.claude.com/docs/en/build-with-claude/structured-outputs

interface PosterLayout {
  title: string;              // Rewritten for impact
  sections: PosterSection[];  // 5-8 key points
  colorScheme: {
    primary: string;          // Subject-appropriate (hex)
    secondary: string;
    background: string;
  };
  typography: {
    titleSize: 'large' | 'xl' | '2xl';  // Maps to Tailwind classes
    bodyFormat: 'bullets' | 'paragraphs' | 'mixed';
  };
}

interface PosterSection {
  heading?: string;           // Optional subheading
  content: string;            // Transformed content
  format: 'bullet' | 'paragraph' | 'callout';
}

// API call with structured output
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'structured-outputs-2025-11-13',  // REQUIRED header
    'anthropic-dangerous-direct-browser-access': 'true',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    output_format: {
      type: 'json_schema',
      json_schema: {
        name: 'poster_layout',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            sections: {
              type: 'array',
              items: { /* PosterSection schema */ }
            },
            // ... rest of schema
          },
          required: ['title', 'sections', 'colorScheme', 'typography']
        }
      }
    },
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  })
});
```

**Benefits:**
- Eliminates JSON parsing errors (constrained decoding ensures valid output)
- No retry logic needed for malformed responses
- Type-safe with TypeScript interfaces

**Important:** Structured outputs don't work with message prefilling or citations. Monitor `stop_reason` for truncations.

### Pattern 2: Multi-Slide Context Window
**What:** Provide 2-3 slides before/after target slide for narrative context
**When to use:** Always - improves AI's understanding of topic progression and relationships

**Example:**
```typescript
// Build context from surrounding slides
function buildPosterContext(
  slides: Slide[],
  targetIndex: number,
  contextWindow: number = 2
): string {
  const start = Math.max(0, targetIndex - contextWindow);
  const end = Math.min(slides.length, targetIndex + contextWindow + 1);

  const contextSlides = slides.slice(start, end).map((slide, i) => {
    const position = start + i === targetIndex ? '[TARGET]' : '';
    return `Slide ${start + i + 1} ${position}: ${slide.title}\n${slide.content.join('\n')}`;
  });

  return contextSlides.join('\n\n---\n\n');
}

// Use in prompt
const userPrompt = `
Transform the TARGET slide into an educational poster.

CONTEXT (surrounding slides for narrative flow):
${buildPosterContext(slides, selectedIndex)}

PRESENTATION METADATA:
- Subject: ${presentationMetadata?.subject || 'inferred from content'}
- Grade Level: Year 6 (10-11 years old)

Generate a poster optimized for classroom wall display.
`;
```

**Why it works:** AI can identify if slides form a sequence (e.g., "Causes → Effects → Solutions") and incorporate that narrative into poster design.

### Pattern 3: React Component Rendering to PDF
**What:** Render poster layouts as React components, capture with html2canvas, embed in jsPDF
**When to use:** For all PDF generation - leverages existing Phase 39 infrastructure

**Example:**
```typescript
// Reuse Phase 39 pattern for consistent PDF generation
const generatePosterPDF = async (posterLayouts: PosterLayout[]) => {
  const pdf = new jsPDF({
    orientation: 'portrait',  // A4 portrait for posters
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < posterLayouts.length; i++) {
    if (i > 0) pdf.addPage();

    // Render poster component off-screen (same pattern as Phase 39)
    const container = renderContainerRef.current;
    const posterElement = document.createElement('div');
    posterElement.style.width = '595px';   // A4 width at 72 DPI
    posterElement.style.height = '842px';  // A4 height at 72 DPI
    container.appendChild(posterElement);

    const root = ReactDOM.createRoot(posterElement);
    root.render(<PosterRenderer layout={posterLayouts[i]} />);

    await new Promise(resolve => setTimeout(resolve, 200)); // Wait for render

    const canvas = await html2canvas(posterElement, {
      scale: 2,  // 2x for print quality (150 DPI)
      useCORS: true,
      backgroundColor: posterLayouts[i].colorScheme.background
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

    root.unmount();
  }

  pdf.save(`AI-Poster-${new Date().toISOString().split('T')[0]}.pdf`);
};
```

### Anti-Patterns to Avoid
- **Don't use jsPDF text API directly:** Manual text positioning is error-prone; html2canvas preserves CSS layout automatically
- **Don't skip AI context:** Single-slide input produces generic posters; surrounding slides enable better topic understanding
- **Don't use unstructured Claude output:** Structured outputs eliminate parsing failures and retry logic
- **Don't generate images:** Posters should be text-focused for clarity and print quality; decorative elements can be CSS shapes/dividers

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation | Custom parser with try/catch retry logic | Claude structured outputs API | Constrained decoding guarantees valid JSON; eliminates parsing errors entirely |
| Reading level adaptation | Regex-based vocabulary replacement | Claude prompt with age context | AI infers reading level from content and adjusts naturally; handles idioms, sentence structure, complexity |
| Color palette selection | Hardcoded subject → color mapping | AI color scheme generation in structured output | Handles edge cases (interdisciplinary topics, cultural context); can adapt based on content tone |
| Typography hierarchy | Manual font size calculations | Tailwind CSS classes in React components | Pre-designed scales ensure visual harmony; responsive to content density |
| PDF text layout | jsPDF.text() with coordinate math | html2canvas → jsPDF.addImage() | CSS handles wrapping, alignment, overflow; supports complex layouts (flexbox, grid) |
| Multi-page posters | Manual page break detection | Generate one poster per slide, compile in single PDF | Simpler architecture; each poster is independent and can be regenerated |

**Key insight:** The hardest problems are content transformation (vocabulary, density, clarity) and layout decisions (format, colors, hierarchy). AI excels at these; use it instead of rule-based systems. PDF generation is purely mechanical - reuse Phase 39's proven approach.

## Common Pitfalls

### Pitfall 1: Over-Dense Poster Content
**What goes wrong:** AI includes too much information from slide, creating unreadable wall posters
**Why it happens:** Slides are designed for 3-5 bullet points; AI preserves all content by default
**How to avoid:**
- Explicitly prompt: "5-8 key points maximum"
- Add to system prompt: "Poster readability from 10 feet is priority #1"
- Schema enforcement: `sections: { type: 'array', minItems: 5, maxItems: 8 }`
**Warning signs:** Preview shows >10 text blocks, body text <24pt equivalent, cramped spacing

### Pitfall 2: Generic/Bland Transformations
**What goes wrong:** AI rephrases content but doesn't enhance it pedagogically
**Why it happens:** Insufficient context or vague prompts like "make this a poster"
**How to avoid:**
- Provide surrounding slides (Pattern 2)
- Specify enhancements: "add relevant examples, use analogies for abstract concepts"
- Request specific improvements: "create clearer title that hooks student interest"
**Warning signs:** Poster content closely matches slide verbatim, no new examples/clarifications

### Pitfall 3: Inconsistent Color Schemes Across Posters
**What goes wrong:** Multi-slide export generates posters with clashing color schemes
**Why it happens:** Each poster generated independently without cross-reference
**How to avoid:**
- Include subject metadata: `Subject: Science` (if available) in all prompts
- Add consistency instruction: "Maintain subject-appropriate color scheme across all posters"
- For multi-poster batches: Generate all at once in array format OR pass first poster's scheme as context
**Warning signs:** Preview shows blue poster, then green, then orange with no thematic connection

### Pitfall 4: Reading Level Mismatch
**What goes wrong:** Vocabulary too advanced or too simple for Year 6 (10-11yo)
**Why it happens:** AI doesn't know target age without explicit instruction
**How to avoid:**
- Always include in system prompt: "Target audience: Year 6 students (10-11 years old)"
- Add vocabulary guidance: "Use age-appropriate vocabulary - explain technical terms simply"
- Inference instruction: "If content suggests younger/older, adjust accordingly but default to Year 6"
**Warning signs:** Teacher feedback that posters are "too babyish" or "words students don't know"

### Pitfall 5: Slow PDF Generation for Many Slides
**What goes wrong:** Generating 10+ posters takes minutes, blocking UI
**Why it happens:** Sequential AI calls + rendering + canvas capture per poster
**How to avoid:**
- Show progress indicator: "Generating poster 3 of 10..."
- Consider batching AI calls: Request all poster layouts in one API call (array response)
- Add "Generate & Download" flow (no preview) for bulk exports
- For preview: Generate first 3 posters only, then full set on confirm
**Warning signs:** User complaints about waiting, no visual feedback during generation

### Pitfall 6: html2canvas Font Rendering Issues
**What goes wrong:** Fonts look different in PDF than in preview
**Why it happens:** Fonts not fully loaded when html2canvas captures; system fonts may differ
**How to avoid:**
- Use web-safe fonts only (Arial, Verdana, Georgia) OR embedded Google Fonts
- Wait for font load: `await document.fonts.ready` before html2canvas
- Test preview vs PDF on different systems
**Warning signs:** PDF has fallback fonts (Times New Roman instead of intended font)

## Code Examples

Verified patterns from official sources and existing codebase:

### AI Poster Generation Prompt (System Prompt)
```typescript
// Pattern: Educational content transformation with structured output
// Confidence: HIGH - based on existing claudeProvider.ts patterns

const POSTER_GENERATION_SYSTEM_PROMPT = `
You are an expert educational poster designer for Year 6 (10-11 year old) classrooms.

Your task: Transform presentation slide content into educational wall posters optimized for:
- Readability from 10 feet distance
- Student reference during independent work
- Visual clarity with strong hierarchy

CONTENT TRANSFORMATION RULES:
1. DENSITY: 5-8 key points maximum (posters are reference aids, not textbooks)
2. VOCABULARY: Year 6 reading level - explain technical terms simply, use concrete examples
3. ENRICHMENT: Add relevant examples, analogies, or clarifications beyond the slide content
4. TITLES: Create clear, engaging titles (don't copy slide title verbatim)
5. NARRATIVE: Use surrounding slides to understand topic progression

LAYOUT DECISION RULES:
1. TYPOGRAPHY FORMAT: Choose based on content type
   - Bullets: For lists, steps, features
   - Paragraphs: For explanations, definitions, context
   - Mixed: For posters with intro paragraph + detail points
2. COLOR SCHEME: Subject-appropriate colors
   - Science: Greens, teals (nature/discovery)
   - Math: Blues, purples (logic/precision)
   - Language: Warm tones (creativity/expression)
   - History: Earth tones (heritage/time)
   - Mixed/unclear: Neutral blues or school brand colors
3. VISUAL HIERARCHY: Ensure title dominates, sections are distinct, content is scannable

CONTEXT USAGE:
- Previous slides show what students already learned
- Next slides show where the lesson is heading
- Use this to judge what needs emphasis, what can be brief

OUTPUT REQUIREMENTS:
- You MUST return valid JSON matching the provided schema
- All content must be appropriate for Year 6 students
- Color values must be valid hex codes (e.g., "#2563eb")
- Typography sizes: "large" (36-48pt equiv), "xl" (48-64pt), "2xl" (64-72pt)
`;

const USER_PROMPT_TEMPLATE = `
Transform the [TARGET] slide into an educational poster.

CONTEXT (surrounding slides for narrative understanding):
{{slideContext}}

PRESENTATION METADATA:
- Subject: {{subject || 'inferred from content'}}
- Grade Level: Year 6 (10-11 years old)

POSTER REQUIREMENTS:
- Optimize for classroom wall display (A4 portrait)
- Ensure readability from 10 feet
- Include 5-8 key points
- Add examples or analogies where helpful
- Create an engaging, student-friendly title

Generate the poster layout now.
`;
```

### Structured Output Schema
```typescript
// Pattern: TypeScript schema matching Claude structured output
// Confidence: HIGH - based on Anthropic docs + existing type patterns

interface PosterLayout {
  title: string;              // Enhanced title (not verbatim from slide)
  subtitle?: string;          // Optional context/hook
  sections: PosterSection[];  // 5-8 content sections
  colorScheme: {
    primary: string;          // Hex code for headers, accents
    secondary: string;        // Hex code for subheadings
    background: string;       // Hex code for poster background
    text: string;             // Hex code for body text
  };
  typography: {
    titleSize: 'large' | 'xl' | '2xl';
    bodyFormat: 'bullets' | 'paragraphs' | 'mixed';
  };
}

interface PosterSection {
  heading?: string;           // Optional section heading
  content: string;            // Main content (enhanced from slide)
  format: 'bullet' | 'paragraph' | 'callout';  // How to display
  emphasis?: boolean;         // Should this stand out? (colored background, border)
}

// JSON Schema for Claude API
const POSTER_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Clear, engaging poster title' },
    subtitle: { type: 'string', description: 'Optional hook or context' },
    sections: {
      type: 'array',
      description: '5-8 key content sections',
      minItems: 5,
      maxItems: 8,
      items: {
        type: 'object',
        properties: {
          heading: { type: 'string' },
          content: { type: 'string', description: 'Transformed, age-appropriate content' },
          format: {
            type: 'string',
            enum: ['bullet', 'paragraph', 'callout']
          },
          emphasis: { type: 'boolean' }
        },
        required: ['content', 'format']
      }
    },
    colorScheme: {
      type: 'object',
      properties: {
        primary: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        secondary: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        background: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        text: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }
      },
      required: ['primary', 'secondary', 'background', 'text']
    },
    typography: {
      type: 'object',
      properties: {
        titleSize: { type: 'string', enum: ['large', 'xl', '2xl'] },
        bodyFormat: { type: 'string', enum: ['bullets', 'paragraphs', 'mixed'] }
      },
      required: ['titleSize', 'bodyFormat']
    }
  },
  required: ['title', 'sections', 'colorScheme', 'typography']
};
```

### PosterRenderer Component
```typescript
// Pattern: Tailwind-styled React component for poster layouts
// Confidence: HIGH - reuses project's React + Tailwind patterns

interface PosterRendererProps {
  layout: PosterLayout;
}

const PosterRenderer: React.FC<PosterRendererProps> = ({ layout }) => {
  const titleSizeClasses = {
    'large': 'text-5xl',   // ~48pt
    'xl': 'text-6xl',      // ~60pt
    '2xl': 'text-7xl'      // ~72pt
  };

  return (
    <div
      className="w-[595px] h-[842px] p-12 flex flex-col"
      style={{
        backgroundColor: layout.colorScheme.background,
        color: layout.colorScheme.text
      }}
    >
      {/* Title */}
      <h1
        className={`${titleSizeClasses[layout.typography.titleSize]} font-bold mb-2 leading-tight`}
        style={{ color: layout.colorScheme.primary }}
      >
        {layout.title}
      </h1>

      {/* Subtitle */}
      {layout.subtitle && (
        <p
          className="text-2xl mb-8 italic"
          style={{ color: layout.colorScheme.secondary }}
        >
          {layout.subtitle}
        </p>
      )}

      {/* Sections */}
      <div className="flex-1 space-y-6 overflow-hidden">
        {layout.sections.map((section, i) => (
          <div
            key={i}
            className={`${section.emphasis ? 'p-4 rounded-lg border-2' : ''}`}
            style={section.emphasis ? {
              borderColor: layout.colorScheme.primary,
              backgroundColor: `${layout.colorScheme.primary}15` // 15% opacity
            } : {}}
          >
            {/* Section heading */}
            {section.heading && (
              <h2
                className="text-3xl font-semibold mb-2"
                style={{ color: layout.colorScheme.primary }}
              >
                {section.heading}
              </h2>
            )}

            {/* Section content */}
            {section.format === 'bullet' ? (
              <div className="flex items-start gap-3">
                <span
                  className="text-2xl mt-1 flex-shrink-0"
                  style={{ color: layout.colorScheme.primary }}
                >
                  •
                </span>
                <p className="text-xl leading-relaxed">{section.content}</p>
              </div>
            ) : section.format === 'callout' ? (
              <div
                className="p-4 rounded-lg border-l-4"
                style={{
                  borderLeftColor: layout.colorScheme.primary,
                  backgroundColor: `${layout.colorScheme.secondary}10`
                }}
              >
                <p className="text-xl font-medium leading-relaxed">{section.content}</p>
              </div>
            ) : (
              <p className="text-xl leading-relaxed">{section.content}</p>
            )}
          </div>
        ))}
      </div>

      {/* Optional footer decoration */}
      <div
        className="h-1 w-full mt-8 rounded"
        style={{ backgroundColor: layout.colorScheme.primary }}
      />
    </div>
  );
};
```

### Regenerate Single Poster
```typescript
// Pattern: Allow teacher to regenerate unsatisfactory posters
// Confidence: MEDIUM - new pattern but follows existing AI service patterns

const regeneratePoster = async (
  slides: Slide[],
  targetIndex: number,
  apiKey: string
): Promise<PosterLayout> => {
  const slideContext = buildPosterContext(slides, targetIndex);
  const subject = inferSubject(slides); // From presentation metadata or first slide

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'structured-outputs-2025-11-13',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      output_format: {
        type: 'json_schema',
        json_schema: {
          name: 'poster_layout',
          strict: true,
          schema: POSTER_SCHEMA
        }
      },
      system: POSTER_GENERATION_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: USER_PROMPT_TEMPLATE
          .replace('{{slideContext}}', slideContext)
          .replace('{{subject || \'inferred from content\'}}', subject)
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();

  // Structured outputs guarantee valid JSON in content[0].text
  return JSON.parse(data.content[0].text);
};

// Usage in UI: "Regenerate" button on poster preview
// Calls regeneratePoster, updates preview, teacher can regenerate until satisfied
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual poster creation | AI-generated layouts | 2024-2025 | AI poster tools reduced design time by 35% with 22-28% better layout consistency |
| Rule-based reading level | AI content adaptation | 2025 | Microsoft Teach tool (2026) adapts materials to reading levels via simple prompts |
| jsPDF text API | html2canvas → jsPDF | 2020s | CSS-based layout far simpler than coordinate math; supports complex designs |
| Retry logic for JSON | Structured outputs | Dec 2025 | Constrained decoding eliminates parsing failures entirely |
| Generic educational colors | Subject-specific psychology | 2025-2026 | Color psychology research shows blue increases concentration, green reduces stress |

**Deprecated/outdated:**
- **Manual JSON parsing with try/catch:** Structured outputs API (beta since Dec 2025) eliminates need for retry logic
- **jsPDF direct text/drawing API for complex layouts:** html2canvas approach is now standard for CSS-styled content
- **Single-slide AI prompts:** Current best practice (2026) includes context windows for better AI understanding

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal context window size**
   - What we know: 2-3 slides before/after is common practice; Claude Sonnet 4 has 200k token context window
   - What's unclear: Diminishing returns point (does 5 slides help vs 2?); token cost vs quality tradeoff
   - Recommendation: Start with 2 slides each direction; A/B test with teacher feedback

2. **Batch vs sequential AI generation**
   - What we know: Claude can return arrays; single API call is faster and cheaper
   - What's unclear: Quality difference (does generating all at once reduce per-poster quality?)
   - Recommendation: For 1-3 posters, batch in single call; for 4+, test both approaches

3. **Preview rendering performance**
   - What we know: html2canvas is synchronous and blocks main thread; rendering 10 posters could freeze UI
   - What's unclear: Whether Web Workers or requestIdleCallback would help; memory limits for many posters
   - Recommendation: Generate previews lazily (only visible posters); show placeholders for others

4. **Subject inference accuracy**
   - What we know: AI can infer subject from content; presentation metadata may be unreliable/missing
   - What's unclear: Accuracy rate for inference; what happens with interdisciplinary content (Science + Math)
   - Recommendation: Add optional manual subject selection in UI; default to AI inference

## Sources

### Primary (HIGH confidence)
- [Anthropic Structured Outputs Documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) - Official API docs for JSON schema enforcement
- [Anthropic Prompt Engineering Overview](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/overview) - Current best practices (2026)
- Existing codebase: `services/providers/claudeProvider.ts` - Verified Claude API integration patterns
- Existing codebase: `.planning/phases/39-export-infrastructure/39-01-PLAN.md` - Verified jsPDF + html2canvas approach

### Secondary (MEDIUM confidence)
- [School Poster Design Best Practices](https://schoolposterprinters.com/school-poster-design-tips-classroom-visuals-that-captivate/) - Typography hierarchy (36-72pt headlines, 16-24pt body)
- [Typography for Educational Materials](https://www.locusdigital.com/blog/discovering-the-best-practices-for-typography-in-education) - Readability from distance guidelines
- [Classroom Poster Trends 2025-2026](https://schoolposterprinters.com/top-10-classroom-decor-trends-for-the-2025-2026-school-year/) - Current educational poster standards
- [Color Psychology in Education](https://schoolposterprinters.com/the-psychology-of-color-in-education-how-visuals-shape-mood/) - Subject-specific color selection (blue for calm, green for stress reduction)
- [Microsoft AI Teaching Tools 2026](https://www.microsoft.com/en-us/education/blog/2026/01/introducing-microsoft-innovations-and-programs-to-support-ai-powered-teaching-and-learning/) - Reading level adaptation patterns
- [AI Poster Generation Performance](https://www.granthaalayahpublication.org/Arts-Journal/ShodhKosh/article/view/6842) - AI poster tools 22-28% better layout consistency, 35% faster design time

### Tertiary (LOW confidence - verification needed)
- [jsPDF Text Positioning](https://artskydj.github.io/jsPDF/docs/jsPDF.html) - API reference (version not specified in docs; project uses 4.0)
- [HTML to PDF with jsPDF](https://joyfill.io/blog/creating-pdfs-from-html-css-in-javascript-what-actually-works) - General guidance on html2canvas + jsPDF approach
- [AI Prompts for Educational Content](https://www.mentimeter.com/blog/education/ai-prompts-for-teachers) - Prompt patterns (not Claude-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project; Claude API integration verified in codebase
- Architecture: HIGH - Reuses proven Phase 39 patterns; structured outputs documented by Anthropic
- Pitfalls: MEDIUM - Based on general best practices; needs validation with actual teacher usage
- Color psychology: MEDIUM - Research-backed but subject inference requires testing
- Reading level adaptation: HIGH - Claude performs well at educational content transformation (verified in existing code)

**Research date:** 2026-01-27
**Valid until:** ~60 days (Claude API stable; educational best practices change slowly)

**Key dependencies verified:**
- Claude Sonnet 4 model: `claude-sonnet-4-20250514` (current as of Jan 2026)
- Structured outputs beta: Available since Dec 2025, still in beta
- Project libraries: jsPDF 4.0.0, html2canvas 1.4.1, React 19.2.0 (all confirmed in package.json)
