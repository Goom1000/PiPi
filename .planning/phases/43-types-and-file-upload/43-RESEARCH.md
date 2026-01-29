# Phase 43: Types and File Upload - Research

**Researched:** 2026-01-29
**Domain:** File upload, document processing, preview generation
**Confidence:** HIGH

## Summary

This phase implements a file upload panel for teachers to upload existing resources (PDF worksheets, images, Word documents) for AI enhancement. The codebase already has established patterns for PDF processing (pdf.js loaded via CDN), drag-drop handling (useDragDrop hook), and dashed-border upload zones. The only new dependency needed is mammoth.js for Word document conversion.

Key technical decisions are straightforward: use the existing PDF.js CDN for PDF thumbnails/page counting, native FileReader for image handling, and mammoth.js for .docx text extraction. The upload panel should be a dedicated component in the resource sidebar with classic dashed-border drop zone styling consistent with existing upload zones.

**Primary recommendation:** Extend existing patterns (pdf.js, dashed border zones, FileReader) with mammoth.js for Word support. No need for react-dropzone or other libraries - native browser APIs suffice.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Codebase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pdf.js | 3.11.174 | PDF rendering, text extraction, page counting | Already loaded via CDN at `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js` |
| FileReader API | Native | Read files as base64/ArrayBuffer | Browser standard, no dependencies |

### New Dependency
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| mammoth | 1.11.0 | Convert .docx to HTML/text | De facto standard for browser-side Word parsing, 675+ dependents |

### Not Needed
| Library | Reason Not Needed |
|---------|-------------------|
| react-dropzone | Native drag-drop APIs sufficient; existing useDragDrop hook pattern works |
| pdfjs-dist (npm) | Already using CDN version; no benefit to npm install |
| pdf-thumbnail | Can use existing pdf.js for thumbnail generation |
| docx-preview | Only need text extraction, not rendering |

**Installation:**
```bash
npm install mammoth
```

## Architecture Patterns

### Recommended Project Structure
```
services/
├── uploadService.ts          # File validation, processing orchestration
├── documentProcessors/
│   ├── pdfProcessor.ts       # PDF thumbnail, page count, text extraction
│   ├── imageProcessor.ts     # Image validation, thumbnail generation
│   └── docxProcessor.ts      # Word document text extraction via mammoth
components/
├── UploadPanel.tsx           # Main upload zone component for resource sidebar
├── UploadProgress.tsx        # Progress bar component (replaces drop zone during upload)
└── UploadPreview.tsx         # Preview thumbnail display component
types.ts                       # Add UploadedResource interface
```

### Pattern 1: File Type Detection and Routing
**What:** Detect file type by MIME type and extension, route to appropriate processor
**When to use:** On file drop/selection
**Example:**
```typescript
// Source: Existing App.tsx pattern + extension
const ACCEPTED_TYPES = {
  'application/pdf': 'pdf',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
} as const;

const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.docx'];

function getFileType(file: File): 'pdf' | 'image' | 'docx' | null {
  // Check MIME type first
  if (ACCEPTED_TYPES[file.type as keyof typeof ACCEPTED_TYPES]) {
    return ACCEPTED_TYPES[file.type as keyof typeof ACCEPTED_TYPES];
  }
  // Fallback to extension (some browsers don't set MIME correctly)
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (['.png', '.jpg', '.jpeg'].includes(ext)) return 'image';
  if (ext === '.docx') return 'docx';
  return null;
}
```

### Pattern 2: PDF Processing (Existing Pattern)
**What:** Use existing pdf.js CDN for PDF handling
**When to use:** Processing PDF uploads
**Example:**
```typescript
// Source: Existing App.tsx processPdf function
async function processPdf(file: File): Promise<ProcessedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const pageCount = pdf.numPages;

  // Validate page count
  if (pageCount > 20) {
    throw new ValidationError('PDF exceeds 20 page limit');
  }

  // Generate thumbnail from first page
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 0.5 }); // Smaller for thumbnail
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  await page.render({ canvasContext: context, viewport }).promise;
  const thumbnail = canvas.toDataURL('image/jpeg', 0.7);

  return { thumbnail, pageCount, type: 'pdf' };
}
```

### Pattern 3: Mammoth.js for Word Documents
**What:** Extract text from .docx files using mammoth.js
**When to use:** Processing Word document uploads
**Example:**
```typescript
// Source: mammoth.js official docs - browser usage
import mammoth from 'mammoth';

async function processDocx(file: File): Promise<ProcessedDocument> {
  const arrayBuffer = await file.arrayBuffer();

  // Extract raw text (for AI processing)
  const textResult = await mammoth.extractRawText({ arrayBuffer });
  const text = textResult.value;

  // Generate page count estimate (Word doesn't have real pages in browser)
  // Rough estimate: ~3000 chars per page
  const estimatedPages = Math.ceil(text.length / 3000);

  if (estimatedPages > 20) {
    throw new ValidationError('Document exceeds estimated 20 page limit');
  }

  // For thumbnail, use a file type icon (Word docs can't be rendered in browser)
  const thumbnail = generateDocxIcon(); // Returns SVG or placeholder image

  return { thumbnail, pageCount: estimatedPages, text, type: 'docx' };
}
```

### Pattern 4: Image Processing
**What:** Read images as base64 and generate thumbnails
**When to use:** Processing image uploads (PNG, JPG)
**Example:**
```typescript
// Source: MDN FileReader docs
async function processImage(file: File): Promise<ProcessedDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;

      // Create thumbnail by resizing
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200; // Thumbnail max dimension
        const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve({
          thumbnail: canvas.toDataURL('image/jpeg', 0.7),
          pageCount: 1, // Images are always 1 "page"
          base64,
          type: 'image'
        });
      };
      img.onerror = reject;
      img.src = base64;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### Pattern 5: Upload Zone Component
**What:** Dashed border drop zone with drag-over visual feedback
**When to use:** The main upload UI
**Example:**
```typescript
// Source: Existing App.tsx upload zones
const [isDragOver, setIsDragOver] = useState(false);

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragOver(true);
};

const handleDragLeave = () => setIsDragOver(false);

const handleDrop = async (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragOver(false);
  const files = Array.from(e.dataTransfer.files);
  await processFiles(files);
};

// JSX - matches existing codebase style
<div
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center
    justify-center cursor-pointer transition-all min-h-[180px]
    ${isDragOver
      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}
>
  {/* Upload cloud icon */}
  <svg className="w-12 h-12 text-slate-400 mb-3" ...>
  <p className="text-sm text-slate-500">Drag files here</p>
  <p className="text-xs text-slate-400">or click to browse</p>
</div>
```

### Anti-Patterns to Avoid
- **Installing react-dropzone**: Native APIs are sufficient and the codebase already has working patterns
- **Installing pdfjs-dist via npm**: CDN version is already configured and working
- **Trying to render Word documents**: Just extract text - browser can't render .docx visually
- **Blocking UI during upload**: Use progress indicator, keep UI responsive

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Word document parsing | Custom XML parser | mammoth.js | .docx is zipped XML with complex structure |
| PDF text extraction | Custom parser | Existing pdf.js | Already in codebase, handles edge cases |
| PDF page counting | Manual calculation | pdf.numPages | Built into pdf.js |
| Drag-drop handling | Custom event handlers | Extend useDragDrop hook | Existing pattern, proven |
| File type validation | Regex on filename | MIME type + extension fallback | More reliable |

**Key insight:** The codebase already has 80% of what's needed. Only Word processing is truly new.

## Common Pitfalls

### Pitfall 1: MIME Type Inconsistency
**What goes wrong:** Different browsers report different MIME types for the same file
**Why it happens:** Browser implementations vary, especially for Word documents
**How to avoid:** Check MIME type first, then fall back to file extension
**Warning signs:** Files rejected on some browsers but not others

### Pitfall 2: Large File Memory Issues
**What goes wrong:** Browser freezes or crashes on large files
**Why it happens:** Reading entire file into memory with FileReader
**How to avoid:** Validate file size BEFORE processing (25MB limit), show error immediately
**Warning signs:** Slow UI response, memory warnings in console

### Pitfall 3: Word Page Count Estimation
**What goes wrong:** Page count is inaccurate for formatted documents
**Why it happens:** Word documents don't have real "pages" - layout depends on paper size, fonts
**How to avoid:** Use word count or character count heuristic (~3000 chars/page), clearly label as "estimated"
**Warning signs:** Documents rejected that should pass, or vice versa

### Pitfall 4: PDF Worker Not Loaded
**What goes wrong:** PDF processing fails silently or with cryptic error
**Why it happens:** pdf.js worker URL not set before getDocument call
**How to avoid:** Always set GlobalWorkerOptions.workerSrc before any pdf.js calls
**Warning signs:** "Setting up fake worker" warning in console, slow processing

### Pitfall 5: Multiple File Race Conditions
**What goes wrong:** Files process out of order, UI shows wrong state
**Why it happens:** Async processing without proper coordination
**How to avoid:** Use Promise.all for parallel processing, or process sequentially with clear state management
**Warning signs:** Progress bar shows incorrect count, files appear in wrong order

## Code Examples

Verified patterns from official sources:

### Mammoth.js Browser Usage
```typescript
// Source: https://github.com/mwilliamson/mammoth.js#browser
import mammoth from 'mammoth';

// Extract raw text from ArrayBuffer
const result = await mammoth.extractRawText({ arrayBuffer: buffer });
console.log(result.value); // The extracted text
console.log(result.messages); // Any warnings/errors during extraction

// Convert to HTML (if needed for rich preview)
const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
console.log(htmlResult.value); // HTML string
```

### File Size Validation
```typescript
// Source: Existing saveService.ts pattern
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function validateFileSize(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMB}MB) exceeds ${MAX_FILE_SIZE_MB}MB limit`
    };
  }
  return { valid: true };
}
```

### Progress Indicator State
```typescript
// Source: Common React pattern for file upload progress
interface UploadState {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number; // 0-100 for determinate, -1 for indeterminate
  error?: string;
  files: ProcessedFile[];
}

// Progress bar replaces drop zone content during upload
{uploadState.status === 'processing' ? (
  <div className="w-full px-6">
    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-indigo-500 transition-all duration-300"
        style={{ width: `${uploadState.progress}%` }}
      />
    </div>
    <p className="text-xs text-slate-500 mt-2 text-center">
      Processing {uploadState.files.length} file(s)...
    </p>
  </div>
) : (
  // Normal drop zone content
)}
```

### Uploaded Resource Type Definition
```typescript
// Source: Derived from existing LessonResource + upload requirements
interface UploadedResource {
  id: string;                    // crypto.randomUUID()
  filename: string;              // Original filename
  type: 'pdf' | 'image' | 'docx';
  thumbnail: string;             // Base64 data URL
  pageCount: number;             // Actual for PDF, 1 for images, estimate for docx
  sizeBytes: number;
  uploadedAt: string;            // ISO 8601
  // Raw content for AI processing (populated in enhancement phase)
  content?: {
    text?: string;               // Extracted text (all types)
    images?: string[];           // Page images as base64 (PDF only)
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Install pdfjs-dist | CDN script | Already in codebase | Simpler, no build complexity |
| Manual .docx parsing | mammoth.js | mammoth 1.x (2020+) | Reliable Word support |
| react-dropzone | Native drag-drop | Always viable | Fewer dependencies |

**Deprecated/outdated:**
- **mammoth.convertToMarkdown()**: Deprecated in mammoth.js - use HTML and convert separately if needed
- **pdf.js legacy build**: Only needed for IE11, not relevant for this app

## Open Questions

Things that couldn't be fully resolved:

1. **Word page count accuracy**
   - What we know: No reliable way to count "pages" in browser
   - What's unclear: What threshold is acceptable for rejection
   - Recommendation: Use character count heuristic (~3000 chars/page), show "~X pages" in UI

2. **Multi-file ordering**
   - What we know: Multiple files can be dropped simultaneously
   - What's unclear: Should they appear in drop order, or alphabetically?
   - Recommendation: Process in order dropped, display in upload order (first dropped = first in list)

## Sources

### Primary (HIGH confidence)
- [mammoth.js GitHub](https://github.com/mwilliamson/mammoth.js) - Browser usage, API reference
- [mammoth NPM](https://www.npmjs.com/package/mammoth) - Version 1.11.0, installation
- [MDN FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader) - readAsDataURL, readAsArrayBuffer
- Existing codebase: App.tsx (processPdf function, upload zones), useDragDrop.ts

### Secondary (MEDIUM confidence)
- [pdf.js Examples](https://mozilla.github.io/pdf.js/examples/) - Rendering, page access
- [pdfjs-dist NPM](https://www.npmjs.com/package/pdfjs-dist) - API confirmation

### Tertiary (LOW confidence)
- WebSearch results for drag-drop best practices - general patterns confirmed with codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - mammoth.js well-established, pdf.js already in codebase
- Architecture: HIGH - Extends existing patterns with minimal changes
- Pitfalls: MEDIUM - Based on general web dev knowledge + mammoth docs

**Research date:** 2026-01-29
**Valid until:** 2026-03-01 (60 days - stable libraries, no fast-moving concerns)
