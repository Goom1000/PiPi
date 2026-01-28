# Architecture Patterns: AI Resource Enhancement

**Domain:** AI Resource Enhancement for Education SPA
**Researched:** 2026-01-29
**Confidence:** HIGH (based on existing codebase patterns)

## Executive Summary

AI Resource Enhancement extends Cue's existing architecture naturally. The feature follows established patterns: file upload via browser APIs (like PDF lesson plans), AI processing through the provider abstraction (Gemini/Claude), preview/export via existing PDF infrastructure (jsPDF + html2canvas), and persistence through the CueFile format.

The key architectural decision is treating enhanced resources as a distinct data type (`EnhancedResource`) stored alongside slides in the presentation state, rather than replacing the existing `LessonResource` type used for AI-generated worksheets.

**Key integration points:**
1. **File Upload** - Extends existing PDF processing pattern in App.tsx
2. **AI Provider** - Adds analyzeDocument() and enhanceResource() methods to AIProviderInterface
3. **State Management** - Resources managed in ResourceHub, persisted via CueFile.content
4. **PDF Export** - Reuses jsPDF + html2canvas pattern from ExportModal
5. **Persistence** - Extends CueFileContent with optional enhancedResources array

## Recommended Architecture

### System Overview

```
+------------------+      +---------------------+      +------------------+
|   Upload Zone    |----->|  Document Analysis  |----->|   Enhancement    |
| (PDF/Image/Word) |      |  (AI Vision + OCR)  |      |  Pipeline (AI)   |
+------------------+      +---------------------+      +------------------+
                                   |                           |
                                   v                           v
                          +----------------+           +------------------+
                          | Original Doc   |           | Enhanced Content |
                          | (base64 blob)  |           | (structured JSON)|
                          +----------------+           +------------------+
                                   |                           |
                                   +-----------+---------------+
                                               |
                                               v
                                    +---------------------+
                                    |  EnhancedResource   |
                                    |  (types.ts)         |
                                    +---------------------+
                                               |
                   +---------------------------+---------------------------+
                   |                           |                           |
                   v                           v                           v
          +----------------+          +----------------+          +----------------+
          | Preview Panel  |          | PDF Export     |          | .cue Persist   |
          | (React comp)   |          | (jsPDF)        |          | (saveService)  |
          +----------------+          +----------------+          +----------------+
```

### Component Boundaries

| Component | Responsibility | Integration Point |
|-----------|---------------|-------------------|
| `ResourceHub.tsx` (modified) | Entry point, upload UI, mode selection | Existing component, add upload mode tab |
| `resourceAnalyzerService.ts` (new) | Document parsing, file type detection | Orchestrates PDF/image/Word processing |
| `AIProviderInterface` (extended) | AI analysis and enhancement | Add 2 methods to existing interface |
| `EnhancedResourcePreview.tsx` (new) | Rendered preview with edit capability | Similar structure to PosterRenderer |
| `resourceExportService.ts` (new) | PDF generation from enhanced content | Follows ExportModal pattern |
| `types.ts` (modified) | EnhancedResource interface | Add alongside LessonResource |
| `saveService.ts` (modified) | Persist enhanced resources | Extend CueFile.content |

### Data Flow

**1. Upload Phase**
```
User drops file → ResourceHub detects file type →
  PDF: processPdf() extracts text + renders pages as images (existing pattern from App.tsx)
  Image: FileReader reads as base64 data URL
  Word: mammoth.js extracts text + embedded images (new dependency)
→ Store original as { type, text, images: base64[], filename }
```

**2. Analysis Phase**
```
Original data → provider.analyzeDocument() →
  Send images to AI with vision capability
  AI returns: { documentType, sections[], tables[], exercises[], metadata }
→ Store analyzed structure
```

**3. Enhancement Phase**
```
Analyzed structure + Lesson context (slides, topic) → provider.enhanceResource() →
  AI enhances content with lesson context awareness
  AI returns: EnhancedContent { title, sections[], colorScheme }
→ Store enhanced version alongside original
```

**4. Preview/Edit Phase**
```
EnhancedContent → EnhancedResourcePreview renders →
  User can edit title, sections, request regeneration
  Changes update EnhancedContent in state
```

**5. Export Phase**
```
EnhancedContent → resourceExportService.generatePDF() →
  jsPDF + html2canvas (same pattern as ExportModal)
→ Download PDF
```

**6. Persistence Phase**
```
EnhancedResource[] → CueFile.content.enhancedResources →
  saveService serializes to JSON
→ .cue file includes enhanced resources
```

## Integration Points with Existing Components

### 1. AIProviderInterface Extension

Add new methods to the interface (`services/aiProvider.ts`):

```typescript
interface AIProviderInterface {
  // ... existing methods (23 total) ...

  // NEW: Document analysis for resource enhancement
  analyzeDocument(
    documentImages: string[],
    documentText: string,
    documentType: 'pdf' | 'image' | 'word'
  ): Promise<DocumentAnalysis>;

  // NEW: Enhance with lesson context
  enhanceResource(
    analysis: DocumentAnalysis,
    lessonContext: ResourceEnhancementContext,
    options: EnhancementOptions
  ): Promise<EnhancedContent>;
}
```

**Why extend interface:** Maintains provider abstraction. Gemini and Claude both support vision models for document analysis. The interface pattern allows swapping providers (existing pattern used for all AI features).

**Implementation pattern:** Follow existing methods like `generatePosterLayout()` in claudeProvider.ts - structured prompts with JSON response parsing.

### 2. ResourceHub Modification

Current ResourceHub (`components/ResourceHub.tsx`) generates new resources from scratch via `provider.generateLessonResources()`. Modify to support dual modes:

```typescript
// ResourceHub.tsx - Add mode toggle
type ResourceMode = 'generate' | 'enhance';

interface ResourceHubProps {
  lessonText: string;
  slideContext: string;
  onClose: () => void;
  provider: AIProviderInterface | null;
  onError: (title: string, message: string) => void;
  onRequestAI: (featureName: string) => void;
  // NEW
  existingResources?: EnhancedResource[];
  onResourcesChange?: (resources: EnhancedResource[]) => void;
}
```

**UI structure:**
```
+------------------------------------------+
| Classroom Resources               [X]    |
+------------------------------------------+
| [ Generate ] [ Enhance ]    <- Mode tabs |
+------------------------------------------+
|                                          |
| Generate mode: Existing UI               |
| Enhance mode: Upload zone + preview      |
|                                          |
+------------------------------------------+
```

### 3. CueFile Extension

Extend the file format (`types.ts` and `saveService.ts`):

```typescript
// types.ts - Extend CueFileContent
export interface CueFileContent {
  slides: Slide[];
  studentNames: string[];
  lessonText: string;
  studentGrades?: StudentWithGrade[];
  enhancedResources?: EnhancedResource[]; // NEW - optional for backward compatibility
}

// Increment CURRENT_FILE_VERSION to 4 when this ships
export const CURRENT_FILE_VERSION = 4;
```

**Why optional:** Backward compatibility. Files without enhanced resources (v3 and earlier) load fine. The loadService migration pattern already handles version upgrades.

### 4. Lesson Context Reuse

Reuse existing context builders from `aiProvider.ts`:

```typescript
// New context type for resource enhancement
export interface ResourceEnhancementContext {
  lessonTopic: string;        // From slides[0].title
  slideContent: string;       // Cumulative slide text
  gradeLevel: string;         // "Year 6" default
  originalDocumentType: string; // "worksheet" | "handout" | etc.
}

// Build from existing helper
export function buildResourceEnhancementContext(
  slides: Slide[],
  documentType: string
): ResourceEnhancementContext {
  const slideContext = buildSlideContext(slides, slides.length - 1);
  return {
    lessonTopic: slideContext.lessonTopic,
    slideContent: slideContext.cumulativeContent,
    gradeLevel: 'Year 6',
    originalDocumentType: documentType
  };
}
```

### 5. PDF Export Pattern

Follow ExportModal.tsx pattern for PDF generation:

```typescript
// resourceExportService.ts
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportEnhancedResourcePDF(
  resource: EnhancedResource,
  renderContainer: HTMLDivElement
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  // Render preview component to container (off-screen)
  // Capture with html2canvas
  // Add to PDF
  // Save with filename

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const canvas = await html2canvas(renderContainer, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: resource.enhanced.colorScheme.background,
    logging: false
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

  const filename = `${resource.enhanced.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  pdf.save(filename);
}
```

## New Types

```typescript
// types.ts - Add these interfaces

/** Original uploaded document before enhancement */
export interface UploadedDocument {
  id: string;                    // crypto.randomUUID()
  filename: string;
  type: 'pdf' | 'image' | 'word';
  text: string;                  // Extracted text
  images: string[];              // Base64 data URLs of pages/images
  uploadedAt: string;            // ISO 8601
}

/** AI analysis of document structure */
export interface DocumentAnalysis {
  documentType: 'worksheet' | 'handout' | 'quiz' | 'activity' | 'other';
  title: string;                 // Inferred title
  sections: AnalyzedSection[];
  tables: AnalyzedTable[];
  exercises: AnalyzedExercise[];
  metadata: {
    pageCount: number;
    hasImages: boolean;
    hasAnswerKey: boolean;
    difficulty?: 'simple' | 'standard' | 'advanced';
  };
}

export interface AnalyzedSection {
  heading?: string;
  content: string;
  type: 'instruction' | 'content' | 'exercise' | 'example';
}

export interface AnalyzedTable {
  headers: string[];
  rows: string[][];
  purpose: 'data' | 'comparison' | 'fill-in' | 'matching';
}

export interface AnalyzedExercise {
  instruction: string;
  type: 'multiple-choice' | 'fill-blank' | 'short-answer' | 'matching' | 'drawing';
  items: string[];
}

/** AI-enhanced content ready for rendering */
export interface EnhancedContent {
  title: string;
  subtitle?: string;
  sections: EnhancedSection[];
  colorScheme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  headerImage?: {
    prompt: string;
    url?: string;
  };
}

export interface EnhancedSection {
  heading?: string;
  content: string;              // Markdown formatted
  format: 'paragraph' | 'bullets' | 'numbered' | 'table' | 'exercise';
  emphasis?: boolean;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

/** Complete enhanced resource record */
export interface EnhancedResource {
  id: string;                    // crypto.randomUUID()
  original: UploadedDocument;    // Preserve original for reference
  analysis: DocumentAnalysis;    // Structure analysis
  enhanced: EnhancedContent;     // Final enhanced version
  targetAudience: 'student' | 'support' | 'extension';
  createdAt: string;             // ISO 8601
  modifiedAt: string;            // ISO 8601
}
```

## New Components and Services

### EnhancedResourcePreview.tsx

Similar structure to `PosterRenderer.tsx`:

```typescript
interface EnhancedResourcePreviewProps {
  resource: EnhancedResource;
  onEdit?: (updates: Partial<EnhancedContent>) => void;
  mode: 'preview' | 'edit';
}

// Renders enhanced content with:
// - Styled title with color scheme
// - Sections with appropriate formatting
// - Tables rendered with proper styling
// - Exercises with checkboxes/blanks
// - Optional inline editing (contentEditable sections)
```

### ResourceUploadZone.tsx

Dedicated upload component (can be extracted from ResourceHub):

```typescript
interface ResourceUploadZoneProps {
  onUpload: (document: UploadedDocument) => void;
  isProcessing: boolean;
  acceptedTypes: string[]; // ['.pdf', '.jpg', '.png', '.docx']
}

// Drag-drop zone with file type detection
// Follows existing upload zone styling (green/blue theme)
```

### resourceAnalyzerService.ts

```typescript
// services/resourceAnalyzerService.ts

export async function processUploadedFile(
  file: File
): Promise<UploadedDocument> {
  const type = detectFileType(file);

  switch (type) {
    case 'pdf':
      return processPdfDocument(file); // Reuse existing processPdf pattern
    case 'image':
      return processImageDocument(file); // FileReader + base64
    case 'word':
      return processWordDocument(file); // mammoth.js (new dependency)
  }
}

function detectFileType(file: File): 'pdf' | 'image' | 'word' {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.includes('word') || file.name.endsWith('.docx')) return 'word';
  throw new Error('Unsupported file type');
}

// Reuse existing PDF processing from App.tsx
async function processPdfDocument(file: File): Promise<UploadedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  pdfjsLib.GlobalWorkerOptions.workerSrc = '...';
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

  let fullText = "";
  const images: string[] = [];
  const pagesToProcess = Math.min(pdf.numPages, 5);

  for (let i = 1; i <= pagesToProcess; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item: any) => item.str).join(' ') + "\n\n";

    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
    images.push(canvas.toDataURL('image/jpeg', 0.8));
  }

  return {
    id: crypto.randomUUID(),
    filename: file.name,
    type: 'pdf',
    text: fullText,
    images,
    uploadedAt: new Date().toISOString()
  };
}
```

### resourceEnhancerService.ts

```typescript
// services/resourceEnhancerService.ts

export interface EnhancementOptions {
  targetAudience: 'student' | 'support' | 'extension';
  generateImage: boolean;
  preserveExercises: boolean;
}

export async function enhanceResource(
  provider: AIProviderInterface,
  document: UploadedDocument,
  context: ResourceEnhancementContext,
  options: EnhancementOptions
): Promise<EnhancedResource> {
  // 1. Analyze document structure
  const analysis = await provider.analyzeDocument(
    document.images,
    document.text,
    document.type
  );

  // 2. Enhance with lesson context
  const enhanced = await provider.enhanceResource(
    analysis,
    context,
    options
  );

  // 3. Optionally generate header image
  if (options.generateImage && enhanced.headerImage?.prompt) {
    enhanced.headerImage.url = await provider.generateResourceImage(
      enhanced.headerImage.prompt
    );
  }

  return {
    id: crypto.randomUUID(),
    original: document,
    analysis,
    enhanced,
    targetAudience: options.targetAudience,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  };
}
```

## State Management

### Local State in ResourceHub

Enhanced resources managed locally in ResourceHub, persisted via parent callbacks:

```typescript
// ResourceHub.tsx state additions
const [mode, setMode] = useState<'generate' | 'enhance'>('generate');
const [uploadedDoc, setUploadedDoc] = useState<UploadedDocument | null>(null);
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [isEnhancing, setIsEnhancing] = useState(false);
const [enhancedResources, setEnhancedResources] = useState<EnhancedResource[]>(
  props.existingResources || []
);
const [selectedResource, setSelectedResource] = useState<EnhancedResource | null>(null);
```

### Persistence Integration

ResourceHub receives enhanced resources from parent (App.tsx) on load:

```typescript
// App.tsx - Add state for enhanced resources
const [enhancedResources, setEnhancedResources] = useState<EnhancedResource[]>(
  loadedFile?.content.enhancedResources || []
);

// Pass to ResourceHub
<ResourceHub
  // ... existing props
  existingResources={enhancedResources}
  onResourcesChange={setEnhancedResources}
/>

// Include in save (modify createCueFile call)
const cueFile = createCueFile(
  title,
  slides,
  studentNames,
  lessonText,
  existingFile,
  studentGrades,
  deckVerbosity
);
// Add enhanced resources
cueFile.content.enhancedResources = enhancedResources;
```

## Suggested Build Order

Based on dependencies and integration complexity:

### Phase 1: Types and File Upload
**Goal:** Accept files, process them, store locally
**Complexity:** Low
**Dependencies:** None

1. Add new types to types.ts (UploadedDocument, DocumentAnalysis, etc.)
2. Create resourceAnalyzerService.ts with file detection and processing
3. Add upload zone to ResourceHub with mode toggle
4. Process uploaded files and store in local state

**Validation:** Can upload PDF/image, see it stored in state

### Phase 2: AI Integration
**Goal:** Analyze and enhance documents
**Complexity:** Medium
**Dependencies:** Phase 1

1. Add analyzeDocument() and enhanceResource() to AIProviderInterface
2. Implement in claudeProvider.ts (Claude has better vision)
3. Implement in geminiProvider.ts
4. Create resourceEnhancerService.ts orchestrating the pipeline
5. Wire up enhancement button in ResourceHub

**Validation:** Upload document, click enhance, see EnhancedResource in state

### Phase 3: Preview and Edit
**Goal:** Display enhanced resources, allow edits
**Complexity:** Medium
**Dependencies:** Phase 2

1. Create EnhancedResourcePreview component
2. Add preview panel to ResourceHub
3. Add inline editing capability
4. Add regeneration button per resource

**Validation:** Can preview enhanced resource, edit title, regenerate

### Phase 4: Export
**Goal:** Export as PDF
**Complexity:** Low
**Dependencies:** Phase 3

1. Create resourceExportService.ts with jsPDF + html2canvas
2. Add export button to preview panel
3. Add hidden render container (existing pattern)

**Validation:** Can export enhanced resource as downloadable PDF

### Phase 5: Persistence
**Goal:** Save/load with .cue file
**Complexity:** Low
**Dependencies:** Phase 1 (can parallel with 2-4)

1. Extend CueFileContent with enhancedResources
2. Update CURRENT_FILE_VERSION to 4
3. Modify saveService to include resources
4. Modify loadService migration to handle v3 files
5. Connect App.tsx state to save/load

**Validation:** Save presentation, reload, enhanced resources preserved

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing images inline in EnhancedContent
**What:** Storing base64 image data directly in EnhancedContent
**Why bad:** Bloats .cue files, may exceed localStorage limits (5MB)
**Instead:** Store image prompts, generate images on-demand, keep originals in UploadedDocument

### Anti-Pattern 2: Modifying LessonResource type
**What:** Reusing LessonResource for enhanced resources
**Why bad:** Different data shape (LessonResource has no original, no analysis), breaks existing resource generation, semantic confusion
**Instead:** New EnhancedResource type, clear separation of concerns

### Anti-Pattern 3: Synchronous file processing
**What:** Blocking UI during PDF/Word parsing
**Why bad:** Poor UX, browser may show "not responding" for large files
**Instead:** Async processing with loading states, consider Web Workers for heavy parsing

### Anti-Pattern 4: Passing full slides array to AI
**What:** Including all slide data in enhancement prompt
**Why bad:** Token limits, slower responses, higher costs
**Instead:** Build concise context with buildResourceEnhancementContext()

### Anti-Pattern 5: Direct localStorage for enhanced resources
**What:** Separate localStorage key for enhanced resources
**Why bad:** Sync issues with .cue file, orphaned data on file load
**Instead:** Include in CueFile.content, single source of truth

## Patterns to Follow

### Pattern 1: Provider Abstraction
**What:** All AI calls through AIProviderInterface
**When:** Any new AI feature
**Example:**
```typescript
// Good: Uses interface
const analysis = await provider.analyzeDocument(images, text, type);

// Bad: Direct API call
const response = await fetch('https://api.anthropic.com/...');
```

### Pattern 2: Progressive Loading States
**What:** Distinct states for each async phase
**When:** Multi-step async operations
**Example:**
```typescript
type EnhancementPhase =
  | { phase: 'idle' }
  | { phase: 'uploading'; filename: string }
  | { phase: 'analyzing'; document: UploadedDocument }
  | { phase: 'enhancing'; analysis: DocumentAnalysis }
  | { phase: 'preview'; resource: EnhancedResource }
  | { phase: 'exporting' };
```

### Pattern 3: Backward-Compatible File Format
**What:** Optional new fields, version migration
**When:** Extending CueFile
**Example:**
```typescript
// Good: Optional field with default
const resources = loadedFile.content.enhancedResources || [];

// Good: Version check for migration in loadService
if (data.version < 4) {
  data.content.enhancedResources = [];
}
```

### Pattern 4: Ref-Based Render Capture for PDF
**What:** Hidden container for PDF generation
**When:** Converting React components to PDF
**Example from ExportModal:**
```typescript
<div
  ref={renderContainerRef}
  className="fixed -left-[9999px] top-0 pointer-events-none"
  aria-hidden="true"
/>
```

### Pattern 5: Error Handling with AIProviderError
**What:** Unified error class with user-friendly messages
**When:** AI operations that can fail
**Example:**
```typescript
try {
  const result = await provider.analyzeDocument(...);
} catch (err) {
  if (err instanceof AIProviderError) {
    onError('Analysis Failed', err.userMessage);
  } else {
    onError('Error', 'An unexpected error occurred');
  }
}
```

## Scalability Considerations

| Concern | Current Scale | At 10+ Resources | Mitigation |
|---------|---------------|------------------|------------|
| File size | ~50KB per resource | 500KB+ total | Compress images, exclude originals from save option |
| Memory | In-memory state | May strain browser | Virtualized list for many resources |
| Processing time | ~5s per resource | 50s+ batch | Queue system, progress indicator, allow cancel |
| localStorage | ~5MB limit | Risk of exceeding | Warn on large files, consider IndexedDB for future |

## Dependencies

### Existing (no changes needed)
- jsPDF (^4.0.0) - PDF generation
- html2canvas (^1.4.1) - Component to image
- @google/genai (^1.30.0) - Gemini API

### New (optional)
- mammoth.js - Word document parsing (only if Word support needed)
  - Alternative: Require users to export Word docs as PDF first (simpler, no new dependency)

**Recommendation:** Start without Word support. PDF and image cover 90% of use cases. Add mammoth.js later if teachers request it.

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| File Upload Integration | HIGH | Existing PDF pattern in App.tsx |
| AIProvider Extension | HIGH | Clear interface extension pattern |
| Types/Data Structures | HIGH | Follows existing type patterns |
| Preview Rendering | HIGH | PosterRenderer provides template |
| PDF Export | HIGH | ExportModal provides exact pattern |
| Persistence | HIGH | CueFile extension is straightforward |
| Build Order | MEDIUM | Dependencies clear, parallel work possible |

## Sources

**HIGH confidence sources (existing codebase):**
- `services/aiProvider.ts` - Provider abstraction pattern
- `services/posterService.ts` - Document context building
- `components/ExportModal.tsx` - jsPDF + html2canvas PDF generation
- `components/PosterRenderer.tsx` - Styled content rendering
- `services/saveService.ts` - CueFile persistence
- `services/loadService.ts` - File loading and migration
- `App.tsx` - PDF processing with pdfjsLib (lines 357-388)
- `components/ResourceHub.tsx` - Resource generation UI
- `types.ts` - Type definitions, CueFile structure

---

*Architecture research complete: 2026-01-29*
