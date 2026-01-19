# Phase 8: Flexible Upload UI - Research

**Researched:** 2026-01-19
**Domain:** Multi-file PDF upload, conditional UI state, React form patterns
**Confidence:** HIGH

## Summary

This phase adds a second PDF upload zone to the landing page, allowing teachers to upload an "Existing Presentation (PDF)" alongside the existing "Lesson Plan PDF" upload. The codebase already has complete PDF processing infrastructure (pdf.js via CDN, text extraction, page-to-image conversion), so this phase is primarily a **UI/state extension task**.

The existing `handleFileChange` function processes PDFs and extracts both text (`lessonText`) and page images (`pageImages`). For the new upload zone, we need a parallel set of state variables (`existingPresentationFile`, `existingPresentationImages`, etc.) and visual indicators showing which files are uploaded and what generation mode will be used.

**Primary recommendation:** Duplicate the existing upload zone pattern for the second PDF, add state for tracking the second file, and update the "Generate Slideshow" button to reflect the current upload mode (fresh/refine/blend). The AI prompt changes happen in Phase 9 - this phase is UI only.

## Standard Stack

The established libraries/tools for this domain:

### Core (No New Dependencies)
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| React useState | 19.2.0 | File state management | Already used throughout App.tsx |
| pdf.js | 3.11.174 (CDN) | PDF processing | Already loaded in index.html |
| Native File input | N/A | File selection | Already implemented for lesson PDF |
| Tailwind CSS | CDN | Styling | Already used for upload zone styling |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Button component | N/A | Consistent button styling | Generate button |
| Toast notifications | N/A | User feedback | Upload success/error feedback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Two separate uploads | Single multi-file upload | Separate zones provide clearer mental model of "lesson" vs "existing presentation" |
| react-dropzone library | Native drag/drop API | App already uses native approach; adding library would be inconsistent |
| Unified processing function | Separate handlers per zone | Separate handlers are cleaner; each file type has distinct purpose |

**Installation:**
```bash
# No new dependencies required - all infrastructure exists
```

## Architecture Patterns

### Recommended Project Structure
No new files needed. All changes in:
```
App.tsx                    # Add second upload zone and state to INPUT state UI
```

### Pattern 1: Parallel State Variables for Second File
**What:** Mirror the existing state pattern for the second PDF upload
**When to use:** Always - maintain consistency with existing code
**Example:**
```typescript
// EXISTING state for lesson PDF (lines 139-143)
const [uploadedFile, setUploadedFile] = useState<File | null>(null);
const [isProcessingFile, setIsProcessingFile] = useState(false);
const [pageImages, setPageImages] = useState<string[]>([]);

// NEW state for existing presentation PDF
const [existingPptFile, setExistingPptFile] = useState<File | null>(null);
const [isProcessingPpt, setIsProcessingPpt] = useState(false);
const [existingPptImages, setExistingPptImages] = useState<string[]>([]);
const existingPptInputRef = useRef<HTMLInputElement>(null);
```

### Pattern 2: Reuse PDF Processing Logic
**What:** Create a shared PDF processing function with callback for state updates
**When to use:** Avoid duplicating the pdf.js processing code
**Example:**
```typescript
// Generic PDF processor
const processPdf = async (
  file: File,
  onProgress: (processing: boolean) => void,
  onComplete: (text: string, images: string[]) => void,
  onError: (error: string) => void
) => {
  onProgress(true);
  try {
    const arrayBuffer = await file.arrayBuffer();
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
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
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      images.push(canvas.toDataURL('image/jpeg', 0.8));
    }

    onComplete(fullText, images);
  } catch (err) {
    onError("Failed to process PDF.");
  } finally {
    onProgress(false);
  }
};

// Usage for lesson PDF
const handleLessonFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || file.type !== 'application/pdf') { setError("Please upload a PDF."); return; }
  setUploadedFile(file);
  await processPdf(file, setIsProcessingFile, (text, images) => {
    setLessonText(text);
    setPageImages(images);
  }, setError);
};

// Usage for existing presentation PDF
const handlePptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || file.type !== 'application/pdf') { setError("Please upload a PDF."); return; }
  setExistingPptFile(file);
  await processPdf(file, setIsProcessingPpt, (text, images) => {
    setExistingPptText(text); // May not need text, but capture for Phase 9
    setExistingPptImages(images);
  }, setError);
};
```

### Pattern 3: Upload Mode Derivation
**What:** Derive generation mode from which files are uploaded
**When to use:** For UI indicators and passing to AI in Phase 9
**Example:**
```typescript
// Derive upload mode from state
type UploadMode = 'fresh' | 'refine' | 'blend' | 'none';

const uploadMode = useMemo<UploadMode>(() => {
  const hasLesson = uploadedFile !== null || lessonText.trim() !== '';
  const hasPpt = existingPptFile !== null;

  if (hasLesson && hasPpt) return 'blend';
  if (hasPpt) return 'refine';
  if (hasLesson) return 'fresh';
  return 'none';
}, [uploadedFile, lessonText, existingPptFile]);

// Use in UI
<Button disabled={uploadMode === 'none'}>
  {uploadMode === 'fresh' && 'Generate Slideshow'}
  {uploadMode === 'refine' && 'Refine Presentation'}
  {uploadMode === 'blend' && 'Enhance with Lesson'}
</Button>
```

### Pattern 4: Two-Column Upload Layout
**What:** Side-by-side upload zones with clear visual distinction
**When to use:** Landing page layout
**Example:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
  {/* Lesson Plan Upload */}
  <div
    onClick={() => lessonInputRef.current?.click()}
    className={`border-2 border-dashed rounded-2xl p-6 ... ${uploadedFile ? 'border-green-300' : 'border-slate-200'}`}
  >
    {/* Lesson upload content */}
  </div>

  {/* Existing Presentation Upload */}
  <div
    onClick={() => pptInputRef.current?.click()}
    className={`border-2 border-dashed rounded-2xl p-6 ... ${existingPptFile ? 'border-blue-300' : 'border-slate-200'}`}
  >
    {/* PPT upload content */}
  </div>
</div>
```

### Anti-Patterns to Avoid
- **Duplicating pdf.js processing code:** Extract shared logic into helper function
- **Single file state with type discriminator:** Clearer to have separate state per purpose
- **Modifying AI generation logic in this phase:** That's Phase 9 - keep this phase UI-only
- **Using different styling patterns:** Match existing upload zone styling exactly

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | New parser | Existing pdf.js setup | Already configured with worker |
| Page image rendering | New canvas code | Existing render logic | Already handles scale and compression |
| Upload zone styling | New CSS | Clone existing dashed-border pattern | Visual consistency |
| File validation | Complex checks | Simple type check | PDF-only keeps it simple |
| Progress indication | Custom spinner | Existing spinner pattern | Used in current upload zone |

**Key insight:** The existing upload zone is ~40 lines of JSX. Duplicating and parameterizing is faster than abstracting into a component for just two uses.

## Common Pitfalls

### Pitfall 1: Overcomplicating Mode Detection
**What goes wrong:** Complex conditional logic for determining fresh/refine/blend mode
**Why it happens:** Trying to handle every edge case
**How to avoid:** Use simple boolean checks: `hasLesson && hasPpt = blend`, `hasPpt = refine`, `hasLesson = fresh`
**Warning signs:** Nested ternaries, multiple useEffect dependencies

### Pitfall 2: Forgetting to Clear State on Remove
**What goes wrong:** Stale page images remain after user removes file
**Why it happens:** Only clearing File state, not derived arrays
**How to avoid:** Clear handler must reset all related state:
```typescript
const handleRemovePpt = () => {
  setExistingPptFile(null);
  setExistingPptImages([]);
  setExistingPptText('');
};
```
**Warning signs:** Old images showing in processing view after file removal

### Pitfall 3: Not Handling "Both Files" Scenario
**What goes wrong:** UI doesn't clearly show when both files are uploaded
**Why it happens:** Only designed for single-file mental model
**How to avoid:** Mode indicator below upload zones showing current mode
**Warning signs:** User confusion about what will happen when Generate is clicked

### Pitfall 4: Breaking Existing Behavior
**What goes wrong:** Lesson-only upload stops working correctly
**Why it happens:** Refactoring existing code instead of extending
**How to avoid:** Verify UPLOAD-02 (lesson only) works exactly as before
**Warning signs:** `handleGenerate` changes break existing flow

### Pitfall 5: Inconsistent Color Coding
**What goes wrong:** Upload zones use conflicting colors, confusing users
**Why it happens:** Not establishing a clear color system for file types
**How to avoid:** Use consistent color: lesson = green (existing), presentation = blue
**Warning signs:** Multiple similar colors in different contexts

## Code Examples

Verified patterns from existing codebase:

### Existing Upload Zone (lines 648-687 in App.tsx)
```typescript
// Current lesson PDF upload zone - USE AS TEMPLATE
<div
    onClick={() => fileInputRef.current?.click()}
    className={`mb-6 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${uploadedFile ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
>
    <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf"
    />

    {isProcessingFile ? (
        <div className="flex flex-col items-center animate-pulse">
            <div className="w-10 h-10 border-4 border-indigo-600 dark:border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold text-indigo-600 dark:text-amber-500 uppercase tracking-widest">Analyzing Pages...</p>
        </div>
    ) : uploadedFile ? (
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
                <p className="font-bold text-slate-800 dark:text-white">{uploadedFile.name}</p>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Document ready for visual analysis</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setPageImages([]); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    ) : (
        <div className="text-center">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-800 text-indigo-500 dark:text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-300">Upload Lesson Document (PDF)</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">Best for complex tables and charts</p>
        </div>
    )}
</div>
```

### Mode Indicator Component
```typescript
// Add below the two upload zones
const ModeIndicator = () => {
  if (uploadMode === 'none') return null;

  const modeLabels = {
    fresh: { text: 'Fresh Generation', desc: 'AI creates new slides from your lesson plan', color: 'green' },
    refine: { text: 'Refine Mode', desc: 'AI enhances your existing presentation', color: 'blue' },
    blend: { text: 'Blend Mode', desc: 'AI combines lesson content with your slides', color: 'purple' }
  };

  const mode = modeLabels[uploadMode];
  return (
    <div className={`mb-6 p-4 rounded-xl bg-${mode.color}-50 dark:bg-${mode.color}-900/20 border border-${mode.color}-200 dark:border-${mode.color}-700`}>
      <p className={`font-bold text-${mode.color}-700 dark:text-${mode.color}-300`}>{mode.text}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400">{mode.desc}</p>
    </div>
  );
};
```

### Updated handleGenerate Signature (Prep for Phase 9)
```typescript
// Phase 8 just passes data; Phase 9 handles different modes
const handleGenerate = async () => {
  if (!provider) {
    setEnableAIModal({ featureName: 'generate slides' });
    return;
  }

  // Validation: at least one input source
  const hasLessonContent = lessonText.trim() || pageImages.length > 0;
  const hasPptContent = existingPptImages.length > 0;

  if (!hasLessonContent && !hasPptContent) return;

  setIsGenerating(true);
  setAppState(AppState.PROCESSING_TEXT);
  setError(null);

  try {
    // Phase 9 will differentiate by mode here
    // For Phase 8, just pass existing behavior for lesson-only
    const generatedSlides = await provider.generateLessonSlides(lessonText, pageImages);
    // ... rest unchanged
  } catch (err) {
    // ... error handling unchanged
  }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single file upload | Multi-zone upload | This phase | Enables refine/blend modes |
| Implicit mode | Explicit mode indicator | This phase | Clearer UX for teachers |
| Monolithic handler | Shared PDF processor | This phase | Reduced code duplication |

**Deprecated/outdated:**
- **Single upload + dropdown for type:** Worse UX than visual zones
- **File picker dialog with filter:** Zones are more intuitive

## Open Questions

Things that couldn't be fully resolved:

1. **Exact wording for upload zone labels**
   - What we know: Need "Lesson Plan PDF" and "Existing Presentation (PDF)"
   - What's unclear: Exact subtitle text and icon choice
   - Recommendation: Use requirements wording; iterate if user feedback suggests changes

2. **Layout on mobile (responsive)**
   - What we know: Desktop is two-column grid
   - What's unclear: Stack vertically or horizontal scroll on mobile?
   - Recommendation: Stack vertically (`grid-cols-1 md:grid-cols-2`)

3. **Processing view when both files are processing**
   - What we know: Current processing view shows lesson PDF images
   - What's unclear: Show both? Interleave? Separate sections?
   - Recommendation: Show both sets of thumbnails with labels

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis:
  - `App.tsx` - handleFileChange (lines 147-197), upload zone UI (lines 648-687)
  - `index.html` - pdf.js CDN script loading
  - `components/Button.tsx` - button styling patterns
  - `.planning/codebase/CONVENTIONS.md` - naming and styling conventions

### Secondary (MEDIUM confidence)
- Phase 6 Research (`06-RESEARCH.md`) - landing page patterns
- v2.2 Requirements (`REQUIREMENTS.md`) - UPLOAD-01 through UPLOAD-04

### Tertiary (LOW confidence)
- Web search: React multi-file upload patterns (2025)
  - [Implementing Drag & Drop File Uploads in React](https://dev.to/hexshift/implementing-drag-drop-file-uploads-in-react-without-external-libraries-1d31)
  - [Modern Media Upload Component in React](https://medium.com/@jeninsutariya2833/chatgpt-cc30f9a87887)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all patterns from existing code
- Architecture: HIGH - Direct extension of existing upload pattern
- Pitfalls: HIGH - Based on existing codebase patterns and common React state issues

**Research date:** 2026-01-19
**Valid until:** 2026-03-19 (60 days - stable patterns, internal to codebase)

---

## Implementation Checklist

For the planner's reference:

| Requirement | What Exists | What's Needed |
|-------------|-------------|---------------|
| UPLOAD-01: Show existing PPT upload | N/A | Add second upload zone with distinct styling |
| UPLOAD-02: Lesson only works | `handleFileChange`, `handleGenerate` | Verify no regression |
| UPLOAD-03: PPT only works | N/A | Add state + handler; Phase 9 handles AI |
| UPLOAD-04: Both files together | N/A | Mode derivation logic; Phase 9 handles AI |

**Estimated scope:** ~150 lines of new code in `App.tsx`:
- ~30 lines: New state declarations
- ~20 lines: Shared PDF processing helper
- ~50 lines: Second upload zone JSX
- ~30 lines: Mode indicator component
- ~20 lines: Updated validation in handleGenerate
