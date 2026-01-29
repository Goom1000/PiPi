# Phase 44: AI Document Analysis - Research

**Researched:** 2026-01-30
**Domain:** Multimodal AI document analysis, structure detection, educational document classification
**Confidence:** HIGH

## Summary

Phase 44 implements AI-powered document analysis to understand uploaded worksheets, handouts, and quizzes before enhancement. The codebase already has multimodal AI infrastructure (Gemini and Claude vision APIs) that can accept images and PDFs directly. The analysis happens silently inline with the enhancement flow - no separate "analysis complete" step.

Key architectural decisions are established: use Gemini/Claude vision for document understanding (already in codebase), extract full text for all elements, detect document type with user confirmation, and flag visual content for manual review. The analysis service will extend the existing AIProviderInterface with a single new method.

**Primary recommendation:** Add `analyzeDocument()` method to AIProviderInterface that returns structured JSON (document type, detected elements, extracted text). Use Gemini's structured output schema for guaranteed valid responses. User confirms document type before proceeding to Phase 45 enhancement.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Codebase - DO NOT CHANGE)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @google/genai | ^1.30.0 | Gemini multimodal API | Already integrated, supports vision + structured output |
| Claude API | claude-sonnet-4 | Claude multimodal API | Already integrated, excellent document understanding |
| pdf.js | 3.11.174 (CDN) | PDF page rendering to images | Already loaded, renders pages for AI vision |
| mammoth | ^1.11.0 | Word document text extraction | Added in Phase 43, extracts text for AI |

### No New Dependencies Required
| Library | Reason Not Needed |
|---------|-------------------|
| Tesseract.js | Gemini/Claude vision API is more accurate, already integrated |
| Document layout parsers | AI vision handles layout detection natively |
| OCR libraries | Multimodal AI does OCR + understanding in one step |

**Installation:** None required - all dependencies already present.

## Architecture Patterns

### Recommended Project Structure
```
services/
  documentAnalysis/
    documentAnalysisService.ts   # Orchestrates analysis pipeline
    analysisPrompts.ts           # System prompts for document analysis
  aiProvider.ts                   # Add analyzeDocument() method
  providers/
    geminiProvider.ts             # Implement analyzeDocument() with structured output
    claudeProvider.ts             # Implement analyzeDocument() with structured output
types.ts                          # Add DocumentAnalysis, AnalyzedElement types
```

### Pattern 1: Multimodal Document Analysis via AIProvider
**What:** Send document images to existing AI providers for structure analysis
**When to use:** Analyzing uploaded PDF, image, or DOCX documents
**Example:**
```typescript
// Source: Extend existing AIProviderInterface pattern in aiProvider.ts
interface AIProviderInterface {
  // ... existing 25+ methods ...

  // NEW: Document analysis for resource enhancement
  analyzeDocument(
    documentImages: string[],   // Base64 images (pages or single image)
    documentText: string,       // Extracted text (from pdf.js or mammoth)
    documentType: 'pdf' | 'image' | 'docx',
    filename: string
  ): Promise<DocumentAnalysis>;
}
```

### Pattern 2: Gemini Structured Output for Analysis
**What:** Use Gemini's responseMimeType: "application/json" with responseSchema for guaranteed valid JSON
**When to use:** Document type detection and structure extraction
**Example:**
```typescript
// Source: Existing geminiService.ts pattern + Gemini structured output docs
import { GoogleGenAI, Type } from "@google/genai";

const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: [
    { text: ANALYSIS_PROMPT },
    ...documentImages.map(img => ({
      inlineData: { mimeType: 'image/jpeg', data: img }
    }))
  ],
  config: {
    systemInstruction: DOCUMENT_ANALYSIS_SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        documentType: {
          type: Type.STRING,
          enum: ['worksheet', 'handout', 'quiz', 'activity', 'assessment', 'other']
        },
        documentTypeConfidence: {
          type: Type.STRING,
          enum: ['high', 'medium', 'low']
        },
        alternativeTypes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Top 2-3 alternative classifications if confidence is not high"
        },
        title: { type: Type.STRING },
        elements: {
          type: Type.ARRAY,
          items: ELEMENT_SCHEMA
        }
      },
      required: ['documentType', 'documentTypeConfidence', 'title', 'elements']
    }
  }
});
```

### Pattern 3: Element Detection with Position Preservation
**What:** Detect structural elements (questions, headers, tables, images) and preserve their order
**When to use:** Building the elements array in DocumentAnalysis
**Example:**
```typescript
// Source: CONTEXT.md decisions - comprehensive detection
const ELEMENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      enum: ['header', 'subheader', 'paragraph', 'question', 'answer',
             'instruction', 'table', 'diagram', 'image', 'list', 'blank-space']
    },
    content: {
      type: Type.STRING,
      description: "Full text content for text elements, or caption for visual elements"
    },
    position: {
      type: Type.INTEGER,
      description: "Order in document (0-indexed)"
    },
    visualContent: {
      type: Type.BOOLEAN,
      description: "True for diagrams, charts, images that need manual review"
    },
    children: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "For lists or questions with sub-items"
    }
  },
  required: ['type', 'content', 'position']
};
```

### Pattern 4: Claude Structured Outputs (Alternative Provider)
**What:** Use Claude's structured outputs beta for document analysis
**When to use:** When user's provider is Claude
**Example:**
```typescript
// Source: Claude structured outputs docs + existing claudeProvider.ts pattern
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: DOCUMENT_ANALYSIS_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: ANALYSIS_PROMPT },
        ...documentImages.map(img => ({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: img }
        }))
      ]
    }],
    output_config: {
      format: {
        type: 'json_schema',
        schema: DOCUMENT_ANALYSIS_SCHEMA
      }
    }
  })
});
```

### Pattern 5: Inline Analysis Flow (No Separate Step)
**What:** Analysis happens silently as part of enhancement flow
**When to use:** User uploads document, sees type confirmation inline
**Example:**
```typescript
// Source: CONTEXT.md decision - analysis happens silently inline
async function processUploadForEnhancement(
  resource: UploadedResource,
  provider: AIProviderInterface
): Promise<{ analysis: DocumentAnalysis; needsTypeConfirmation: boolean }> {
  // Extract images from resource
  const images = await extractImagesForAnalysis(resource);

  // Run analysis
  const analysis = await provider.analyzeDocument(
    images,
    resource.content?.text || '',
    resource.type,
    resource.filename
  );

  // Determine if user needs to confirm type
  const needsTypeConfirmation = analysis.documentTypeConfidence !== 'high'
    || analysis.alternativeTypes?.length > 0;

  return { analysis, needsTypeConfirmation };
}
```

### Anti-Patterns to Avoid
- **Showing confidence indicators to users**: Decision was to hide confidence - just show findings
- **Creating separate "analysis complete" step**: Analysis is inline, user proceeds to type confirmation
- **Trying to describe visual content**: Flag for manual review, preserve position and caption only
- **Skipping visual content entirely**: Must preserve position, just don't describe contents

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OCR / text extraction | Custom OCR pipeline | Gemini/Claude vision | AI does OCR + understanding in one call |
| Document layout detection | Bounding box detection | AI vision analysis | Models understand layout contextually |
| Table structure parsing | Custom table parser | AI structured output | Vision models excel at table understanding |
| Question detection | Regex patterns | AI classification | Context-aware detection is more accurate |

**Key insight:** Multimodal AI models (Gemini 3, Claude Sonnet 4) are trained on millions of documents and understand educational content layout natively. Custom parsing would be less accurate and more brittle.

## Common Pitfalls

### Pitfall 1: Token Limits with Multi-Page PDFs
**What goes wrong:** Sending too many images causes API errors or truncated responses
**Why it happens:** Each page image is ~500-2000 tokens depending on resolution
**How to avoid:** Limit to 5-10 page images max; for longer documents, sample representative pages
**Warning signs:** API 400 errors, incomplete analysis, slow responses

### Pitfall 2: Inconsistent Type Classification
**What goes wrong:** Same document type classified differently on retry
**Why it happens:** AI variability without temperature control
**How to avoid:** Use temperature: 0 for classification calls, enforce structured output schema
**Warning signs:** User uploads worksheet, sees "handout" then "quiz" on refresh

### Pitfall 3: Missing Visual Content Flags
**What goes wrong:** Diagrams and images processed silently, then missing from enhancement
**Why it happens:** AI describes image instead of flagging for review
**How to avoid:** Explicit prompt instruction: "For diagrams/charts/images: output visualContent: true, do not describe contents"
**Warning signs:** Enhanced document missing graphics that were in original

### Pitfall 4: Losing Element Order
**What goes wrong:** Questions and answers appear in wrong order after enhancement
**Why it happens:** Elements extracted without position tracking
**How to avoid:** Include position index in schema, sort by position before processing
**Warning signs:** Q&A pairs scrambled, numbered lists out of order

### Pitfall 5: Over-Extracting from Low-Quality Images
**What goes wrong:** AI hallucinates text that isn't there from blurry scans
**Why it happens:** Model tries to be helpful by guessing illegible text
**How to avoid:** Instruct AI to mark illegible sections as "[unclear]" rather than guessing
**Warning signs:** Extracted text contains words not in original document

## Code Examples

Verified patterns from official sources:

### System Prompt for Document Analysis
```typescript
// Source: Derived from project requirements + AI document analysis best practices
const DOCUMENT_ANALYSIS_SYSTEM_PROMPT = `
You are an expert educational document analyzer. Your task is to understand the structure of uploaded teaching resources (worksheets, handouts, quizzes, etc.).

CLASSIFICATION RULES:
- worksheet: Has exercises/tasks for students to complete, often with blanks or spaces to write
- handout: Information for students to read/reference, no exercises
- quiz: Has questions with answer options or grading criteria
- activity: Interactive tasks, games, or group work instructions
- assessment: Formal tests with scoring rubrics
- other: Documents that don't fit above categories

STRUCTURE DETECTION:
- Detect ALL structural elements in document order
- For text elements: Extract full text content
- For visual elements (diagrams, charts, images): Set visualContent: true, provide caption if visible, do NOT describe the image contents
- Preserve the exact reading order via position index

ANSWER DETECTION:
- If you see answer blanks (_____, [ ], numbered spaces), type is 'blank-space'
- If you see provided answers or answer keys, type is 'answer'
- Distinguish between questions and their corresponding answer spaces

OUTPUT:
Return valid JSON matching the provided schema. Do not include commentary.
`;

const ANALYSIS_USER_PROMPT = `
Analyze this educational document.

Document filename: {filename}
Document type hint: {documentType}
Extracted text (may be partial):
{extractedText}

Based on the visual layout and content:
1. Classify the document type with confidence level
2. Identify all structural elements in order
3. Extract text content from each element
4. Flag any visual content (diagrams, images, charts) for manual review
`;
```

### DocumentAnalysis Type Definition
```typescript
// Source: Derived from CONTEXT.md decisions + architectural patterns
interface DocumentAnalysis {
  // Classification
  documentType: 'worksheet' | 'handout' | 'quiz' | 'activity' | 'assessment' | 'other';
  documentTypeConfidence: 'high' | 'medium' | 'low';
  alternativeTypes?: string[]; // If confidence not high, top 2-3 alternatives

  // Metadata
  title: string;
  pageCount: number;
  hasAnswerKey: boolean;

  // Detected elements in document order
  elements: AnalyzedElement[];

  // Visual content summary
  visualContentCount: number; // Number of diagrams/images flagged for review
}

interface AnalyzedElement {
  type: 'header' | 'subheader' | 'paragraph' | 'question' | 'answer' |
        'instruction' | 'table' | 'diagram' | 'image' | 'list' | 'blank-space';
  content: string;           // Full text, or caption for visual elements
  position: number;          // Order in document (0-indexed)
  visualContent?: boolean;   // True if needs manual review during enhancement
  children?: string[];       // For lists, numbered items, or multi-part questions
  tableData?: {              // For tables only
    headers: string[];
    rows: string[][];
  };
}
```

### Image Extraction from UploadedResource
```typescript
// Source: Phase 43 uploadService patterns + pdf.js usage
async function extractImagesForAnalysis(
  resource: UploadedResource
): Promise<string[]> {
  if (resource.type === 'image') {
    // Single image - use the content directly
    return resource.content?.images || [];
  }

  if (resource.type === 'pdf') {
    // PDF - render pages to images (limit to avoid token overflow)
    const MAX_PAGES = 10;
    const images: string[] = [];
    const arrayBuffer = await fetchResourceArrayBuffer(resource);

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    const pagesToRender = Math.min(pdf.numPages, MAX_PAGES);
    for (let i = 1; i <= pagesToRender; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 }); // Higher res for AI
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      // Remove data URL prefix for API
      images.push(dataUrl.split(',')[1]);
    }

    return images;
  }

  if (resource.type === 'docx') {
    // DOCX - no visual rendering possible, return empty
    // AI will rely on extracted text from mammoth
    return [];
  }

  return [];
}
```

### Gemini Provider Implementation
```typescript
// Source: Existing geminiProvider.ts pattern + Gemini structured output
async analyzeDocument(
  documentImages: string[],
  documentText: string,
  documentType: 'pdf' | 'image' | 'docx',
  filename: string
): Promise<DocumentAnalysis> {
  const ai = new GoogleGenAI({ apiKey: this.apiKey });
  const model = "gemini-3-flash-preview";

  // Build content parts
  const contents: any[] = [
    {
      text: ANALYSIS_USER_PROMPT
        .replace('{filename}', filename)
        .replace('{documentType}', documentType)
        .replace('{extractedText}', documentText.substring(0, 3000))
    }
  ];

  // Add images (limit to avoid token overflow)
  const limitedImages = documentImages.slice(0, 10);
  for (const img of limitedImages) {
    contents.push({
      inlineData: { mimeType: 'image/jpeg', data: img }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: contents },
      config: {
        systemInstruction: DOCUMENT_ANALYSIS_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: DOCUMENT_ANALYSIS_SCHEMA,
        generationConfig: { temperature: 0 } // Consistent classification
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    throw new AIProviderError(
      USER_ERROR_MESSAGES.PARSE_ERROR,
      'PARSE_ERROR',
      error
    );
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| OCR + rule-based parsing | Multimodal AI vision | Gemini 2.0 (2024) / Claude 3 (2024) | Single API call for understanding |
| Template-based extraction | AI structured output | Gemini/Claude 2024-2025 | Guaranteed valid JSON |
| Manual layout annotation | AI layout understanding | Native in vision models | No training data needed |
| Separate OCR + classification | Combined vision analysis | Multimodal models | Better accuracy, fewer API calls |

**Current best practices:**
- Use multimodal models directly rather than OCR pipelines
- Leverage structured output for guaranteed valid responses
- Limit image count/resolution to manage token costs
- Include extracted text alongside images for hybrid analysis

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal image resolution for analysis**
   - What we know: Higher resolution = better accuracy = more tokens
   - What's unclear: What scale factor gives best accuracy/cost tradeoff
   - Recommendation: Start with scale 1.5 (existing pattern), adjust if accuracy issues

2. **Handling mixed-content documents**
   - What we know: Some documents are part worksheet, part handout
   - What's unclear: Should we support multiple types per document?
   - Recommendation: Single primary type with alternativeTypes for user to override

3. **DOCX visual analysis**
   - What we know: mammoth.js extracts text but not layout/images
   - What's unclear: Should we render DOCX to images for visual analysis?
   - Recommendation: Use text-only analysis for DOCX; instruct users to export as PDF for visual-heavy documents

## Sources

### Primary (HIGH confidence)
- [Gemini Document Processing](https://ai.google.dev/gemini-api/docs/document-processing) - PDF/image support, structured output
- [Claude Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) - JSON schema enforcement
- Existing codebase: `services/geminiService.ts`, `services/providers/claudeProvider.ts` - multimodal patterns

### Secondary (MEDIUM confidence)
- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3) - Latest model capabilities
- [Best Multimodal Models for Document Analysis 2026](https://www.siliconflow.com/articles/en/best-multimodal-models-for-document-analysis) - Industry benchmarks

### Tertiary (LOW confidence)
- WebSearch results on educational document classification - general patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses existing multimodal AI infrastructure
- Architecture: HIGH - Extends established AIProviderInterface pattern
- Pitfalls: HIGH - Based on documented API limits and project constraints
- Code examples: HIGH - Derived from existing codebase patterns

**Research date:** 2026-01-30
**Valid until:** 2026-03-01 (60 days - Gemini/Claude APIs stable, no fast-moving concerns)
