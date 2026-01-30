# Phase 47: Export and Persistence - Research

**Researched:** 2026-01-31
**Domain:** PDF generation, client-side zip file bundling, JSON file persistence
**Confidence:** HIGH

## Summary

Phase 47 implements two core features: (1) PDF export of enhanced resources with multiple differentiation levels delivered as a zip file, and (2) persistence of enhanced resources within the existing .cue file format. The codebase already has jsPDF 4.0 installed and working (used in ExportModal.tsx), the CueFile format infrastructure is mature with versioning/migration support, and the enhancement data structures from Phase 45/46 are well-defined.

The key technical decision is whether to use jsPDF's text API (for structured text documents) or html2canvas approach (for visual fidelity). Given the requirement for "clean and minimal print optimization" with A4 paper, binding margins, and proper typography, the text API approach is preferable - it produces sharper text, smaller files, and true vector output. JSZip will bundle multiple PDFs (one per differentiation level) into a single download.

**Primary recommendation:** Use jsPDF's text API with `splitTextToSize()` for automatic line wrapping and manual page break management. Add JSZip for multi-file bundling. Extend CueFile content to include enhanced resources with edit overlays, incrementing the file version to 4.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Codebase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jspdf | 4.0.0 | PDF generation | Already installed, text API supports A4, margins, multi-page |
| html2canvas | 1.4.1 | DOM to canvas capture | Already installed, used by ExportModal for slide export |
| React 19 | ^19.2.0 | Component state | Already in codebase |

### New Dependencies Required
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jszip | ^3.10.1 | Client-side zip bundling | Industry standard, 100M+ weekly npm downloads, no dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSZip | client-zip | client-zip is smaller (2.6KB) but JSZip is more mature and documented |
| jsPDF text API | html2canvas + jsPDF | html2canvas gives visual fidelity but text API gives vector text, sharper output |
| File download | FileSaver.js | FileSaver redundant - jsPDF.save() and Blob/URL.createObjectURL work fine |

**Installation:**
```bash
npm install jszip
```

## Architecture Patterns

### Recommended Project Structure
```
services/
  exportService.ts             # NEW: PDF generation + zip bundling
  saveService.ts               # MODIFY: Add enhanced resource support
  loadService.ts               # MODIFY: Load enhanced resources
types.ts                       # MODIFY: Add EnhancedResourceState, CueFileContent updates
components/
  EnhancementPanel.tsx         # MODIFY: Add export button
  ResourceHub.tsx              # MODIFY: Surface export action
```

### Pattern 1: Text-Based PDF Generation
**What:** Use jsPDF's text API for structured document output
**When to use:** Text-heavy educational worksheets with headers, paragraphs, lists
**Why:** Vector text is sharper, smaller files, proper text selection in PDF viewer
**Example:**
```typescript
// Source: jsPDF documentation + best practices
import { jsPDF } from 'jspdf';

function generateWorksheetPDF(version: DifferentiatedVersion, title: string): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();  // 210mm for A4
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm for A4

  // Binding margin on left (extra for hole punching)
  const marginLeft = 25;   // 25mm left margin for binding
  const marginRight = 15;  // 15mm right margin
  const marginTop = 20;    // 20mm top margin
  const marginBottom = 20; // 20mm bottom margin

  const contentWidth = pageWidth - marginLeft - marginRight;
  let currentY = marginTop;

  // Header with level name
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(version.title, marginLeft, currentY);
  currentY += 10;

  // Document title
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text(title, marginLeft, currentY);
  currentY += 15;

  // Content elements
  for (const element of version.elements) {
    currentY = renderElement(doc, element, currentY, marginLeft, contentWidth,
                             pageHeight - marginBottom, marginTop);
  }

  return doc;
}
```

### Pattern 2: Automatic Page Breaks with splitTextToSize
**What:** Use jsPDF's `splitTextToSize()` to wrap text and calculate page breaks
**When to use:** Any text content that may span multiple lines or pages
**Example:**
```typescript
// Source: jsPDF documentation - splitTextToSize method
function renderParagraph(
  doc: jsPDF,
  text: string,
  y: number,
  marginLeft: number,
  contentWidth: number,
  pageBottom: number,
  pageTop: number
): number {
  doc.setFontSize(11);
  const lineHeight = 6; // mm per line

  // Split text to fit content width
  const lines = doc.splitTextToSize(text, contentWidth);

  for (const line of lines) {
    // Check if we need a new page
    if (y + lineHeight > pageBottom) {
      doc.addPage();
      y = pageTop;
    }

    doc.text(line, marginLeft, y);
    y += lineHeight;
  }

  return y + 4; // Extra spacing after paragraph
}
```

### Pattern 3: Section-Based Page Breaks
**What:** Start major sections on new pages
**When to use:** Per CONTEXT.md decision "Each major section starts on a new page"
**Example:**
```typescript
// Source: User decision in CONTEXT.md
function shouldStartNewPage(element: EnhancedElement, prevElement?: EnhancedElement): boolean {
  // Major sections start on new page
  if (element.type === 'header') return true;

  // Answer key always starts on new page
  if (element.type === 'answer' && prevElement?.type !== 'answer') return true;

  return false;
}
```

### Pattern 4: Multi-File Zip Bundling
**What:** Bundle multiple PDFs into a single zip download
**When to use:** Exporting all differentiation levels at once (CONTEXT.md decision)
**Example:**
```typescript
// Source: JSZip documentation
import JSZip from 'jszip';

async function exportEnhancedResource(
  result: EnhancementResult,
  title: string,
  editState: EditState,
  onProgress: (percent: number) => void
): Promise<void> {
  const zip = new JSZip();
  const levels = ['simple', 'standard', 'detailed'] as const;

  // Generate PDFs for each level
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const version = applyEdits(result.versions[level], editState.edits[level]);

    // Generate worksheet PDF
    const worksheetPdf = generateWorksheetPDF(version, title);
    const worksheetBlob = worksheetPdf.output('blob');
    zip.file(`${title} - ${level.charAt(0).toUpperCase() + level.slice(1)}.pdf`, worksheetBlob);

    onProgress((i + 1) * 25);
  }

  // Generate answer key PDFs (separate files per CONTEXT.md)
  const answerKeyPdf = generateAnswerKeyPDF(result.answerKeys, title);
  zip.file(`${title} - Answer Key.pdf`, answerKeyPdf.output('blob'));
  onProgress(100);

  // Generate and download zip
  const content = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (metadata) => onProgress(Math.round(metadata.percent))
  );

  // Trigger download
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title} - Enhanced Resources.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
```

### Pattern 5: Enhanced Resource Persistence in CueFile
**What:** Store enhanced resources and edit overlays in the .cue file
**When to use:** When saving presentation (CONTEXT.md: "associated at presentation-level")
**Example:**
```typescript
// Source: Existing CueFile pattern in types.ts + CONTEXT.md decisions
// File version bump: 3 -> 4

interface EnhancedResourceState {
  resourceId: string;           // Links to UploadedResource.id
  originalResource: UploadedResource;
  analysis: DocumentAnalysis;
  enhancementResult: EnhancementResult;
  editOverlays: EditState;      // User edits stored separately per CONTEXT.md
  enhancedAt: string;           // ISO 8601 timestamp
}

interface CueFileContent {
  slides: Slide[];
  studentNames: string[];
  lessonText: string;
  studentGrades?: StudentWithGrade[];
  enhancedResources?: EnhancedResourceState[];  // NEW in v4
}

// Migration from v3 to v4: enhancedResources defaults to []
function migrateToV4(data: CueFile): CueFile {
  return {
    ...data,
    version: 4,
    content: {
      ...data.content,
      enhancedResources: data.content.enhancedResources || []
    }
  };
}
```

### Anti-Patterns to Avoid
- **html2canvas for text documents:** Results in raster text, large files, blurry when zoomed
- **Storing full PDFs in .cue file:** PDFs are generated on-demand; store structured data only
- **Separate enhanced resource files:** Keep everything in .cue for single-file portability
- **Blocking UI during export:** Use progress callbacks and async patterns

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Line wrapping | Manual character counting | jsPDF.splitTextToSize() | Handles Unicode, font metrics, edge cases |
| Zip compression | Manual file concatenation | JSZip | Proper ZIP format, DEFLATE compression, cross-browser |
| File download | Manual anchor click | Blob + URL.createObjectURL | Standard pattern, already used in codebase |
| A4 dimensions | Hardcoded pixel values | jsPDF format: 'a4' | jsPDF handles DPI, orientation, units correctly |

**Key insight:** jsPDF and JSZip handle the complex edge cases (font metrics, Unicode, compression algorithms) that would take weeks to hand-roll correctly.

## Common Pitfalls

### Pitfall 1: Font Loading Race Condition
**What goes wrong:** Text renders with fallback font because custom font hasn't loaded
**Why it happens:** PDF generation starts before web fonts finish loading
**How to avoid:** Wait for `document.fonts.ready` before generating PDF
**Warning signs:** Inconsistent font rendering, characters missing

### Pitfall 2: Page Break Mid-Word
**What goes wrong:** Words or sentences cut off between pages
**Why it happens:** Manual Y tracking without checking line content
**How to avoid:** Use `splitTextToSize()` first, then check if each line fits
**Warning signs:** Words split across pages, orphaned punctuation

### Pitfall 3: Memory Pressure with Large Documents
**What goes wrong:** Browser freezes or crashes during export
**Why it happens:** Generating all PDFs synchronously, holding all in memory
**How to avoid:** Generate one PDF at a time, add to zip, let GC run
**Warning signs:** Memory warnings, slow progress, UI freeze

### Pitfall 4: Edit State Serialization (Map to JSON)
**What goes wrong:** Edit state lost on save/load
**Why it happens:** JavaScript Map doesn't serialize to JSON directly
**How to avoid:** Convert Map to array of [key, value] tuples for storage
**Warning signs:** Edits disappear after reload
```typescript
// Serialize
const editArray = Array.from(editState.edits.simple.entries());

// Deserialize
const editMap = new Map(editArray);
```

### Pitfall 5: Zip File Corrupted on iOS Safari
**What goes wrong:** Downloaded zip can't be opened on iOS
**Why it happens:** Safari handles Blob downloads differently
**How to avoid:** Use `type: 'blob'` not `type: 'base64'`, ensure MIME type is correct
**Warning signs:** Works on desktop, fails on mobile Safari

## Code Examples

Verified patterns from official sources and existing codebase:

### A4 PDF Setup with Binding Margins
```typescript
// Source: jsPDF documentation + CONTEXT.md print optimization decisions
import { jsPDF } from 'jspdf';

export function createA4Document(): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // A4 dimensions: 210mm x 297mm
  // Return configured doc - caller manages content
  return doc;
}

export const PDF_CONFIG = {
  pageWidth: 210,
  pageHeight: 297,
  marginLeft: 25,    // Extra for binding/hole-punching
  marginRight: 15,
  marginTop: 20,
  marginBottom: 20,
  get contentWidth() { return this.pageWidth - this.marginLeft - this.marginRight; },
  get contentHeight() { return this.pageHeight - this.marginTop - this.marginBottom; }
};
```

### Element-to-PDF Rendering
```typescript
// Source: types.ts EnhancedElement + jsPDF text API
function renderEnhancedElement(
  doc: jsPDF,
  element: EnhancedElement,
  y: number,
  config: typeof PDF_CONFIG
): number {
  const { marginLeft, contentWidth, pageHeight, marginTop, marginBottom } = config;
  const pageBottom = pageHeight - marginBottom;

  switch (element.type) {
    case 'header':
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      if (y + 12 > pageBottom) { doc.addPage(); y = marginTop; }
      doc.text(element.enhancedContent, marginLeft, y);
      return y + 12;

    case 'paragraph':
    case 'instruction':
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(element.enhancedContent, contentWidth);
      for (const line of lines) {
        if (y + 6 > pageBottom) { doc.addPage(); y = marginTop; }
        doc.text(line, marginLeft, y);
        y += 6;
      }
      return y + 4;

    case 'question':
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      // Add question number/prefix styling
      const qLines = doc.splitTextToSize(element.enhancedContent, contentWidth - 5);
      for (const line of qLines) {
        if (y + 6 > pageBottom) { doc.addPage(); y = marginTop; }
        doc.text(line, marginLeft + 5, y);
        y += 6;
      }
      return y + 8; // Extra space after question

    case 'blank-space':
      // Answer line
      if (y + 15 > pageBottom) { doc.addPage(); y = marginTop; }
      doc.setDrawColor(200);
      doc.line(marginLeft, y + 10, marginLeft + contentWidth * 0.6, y + 10);
      return y + 15;

    case 'list':
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const items = element.children || [element.enhancedContent];
      for (const item of items) {
        if (y + 6 > pageBottom) { doc.addPage(); y = marginTop; }
        doc.text('\u2022 ' + item, marginLeft + 5, y);
        y += 6;
      }
      return y + 4;

    default:
      // Fallback for other types
      doc.setFontSize(11);
      doc.text(element.enhancedContent, marginLeft, y);
      return y + 6;
  }
}
```

### JSZip Multi-PDF Bundle
```typescript
// Source: JSZip documentation + CONTEXT.md workflow decisions
import JSZip from 'jszip';

export interface ExportProgress {
  phase: 'generating' | 'bundling';
  percent: number;
  currentFile?: string;
}

export async function exportAllLevels(
  result: EnhancementResult,
  editState: EditState,
  title: string,
  onProgress: (progress: ExportProgress) => void
): Promise<void> {
  const zip = new JSZip();
  const sanitizedTitle = title.replace(/[^a-z0-9 ]/gi, '').trim() || 'Enhanced Resource';

  const levels = ['simple', 'standard', 'detailed'] as const;
  const levelNames = { simple: 'Simple Version', standard: 'Standard Version', detailed: 'Detailed Version' };

  // Generate worksheet PDFs
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    onProgress({ phase: 'generating', percent: (i / 4) * 100, currentFile: levelNames[level] });

    const version = result.versions[level];
    const edits = editState.edits[level];
    const pdf = generateWorksheetPDF(version, sanitizedTitle, levelNames[level], edits);

    zip.file(`${sanitizedTitle} - ${levelNames[level]}.pdf`, pdf.output('blob'));
  }

  // Generate answer key
  onProgress({ phase: 'generating', percent: 75, currentFile: 'Answer Key' });
  const answerPdf = generateAnswerKeyPDF(result.answerKeys, sanitizedTitle);
  zip.file(`${sanitizedTitle} - Answer Key.pdf`, answerPdf.output('blob'));

  // Bundle into zip
  onProgress({ phase: 'bundling', percent: 90 });
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  onProgress({ phase: 'bundling', percent: 100 });

  // Download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizedTitle} - All Versions.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
```

### CueFile v4 with Enhanced Resources
```typescript
// Source: Existing types.ts patterns + CONTEXT.md persistence decisions

// types.ts additions
export const CURRENT_FILE_VERSION = 4; // Bump from 3

// Serializable edit state (Map doesn't serialize to JSON)
export interface SerializedEditState {
  simple: [number, string][];   // Array of [position, content] tuples
  standard: [number, string][];
  detailed: [number, string][];
}

export interface EnhancedResourceState {
  resourceId: string;
  originalResource: UploadedResource;
  analysis: DocumentAnalysis;
  enhancementResult: EnhancementResult;
  editOverlays: SerializedEditState;
  enhancedAt: string;
}

export interface CueFileContent {
  slides: Slide[];
  studentNames: string[];
  lessonText: string;
  studentGrades?: StudentWithGrade[];
  enhancedResources?: EnhancedResourceState[];  // NEW in v4
}

// saveService.ts - serialize edits
function serializeEditState(editState: EditState): SerializedEditState {
  return {
    simple: Array.from(editState.edits.simple.entries()),
    standard: Array.from(editState.edits.standard.entries()),
    detailed: Array.from(editState.edits.detailed.entries())
  };
}

// loadService.ts - deserialize edits
function deserializeEditState(serialized: SerializedEditState): EditState {
  return {
    edits: {
      simple: new Map(serialized.simple),
      standard: new Map(serialized.standard),
      detailed: new Map(serialized.detailed)
    }
  };
}

// loadService.ts - migration v3 -> v4
function migrateFile(data: CueFile): CueFile {
  let migrated = data;

  if (data.version < 4) {
    migrated = {
      ...migrated,
      version: 4,
      content: {
        ...migrated.content,
        enhancedResources: []  // Default empty array
      }
    };
  }

  return migrated;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| html2pdf.js wrapper | Direct jsPDF + html2canvas | jsPDF 2.0 (2020) | Better control, smaller bundle |
| Synchronous zip generation | JSZip generateAsync | JSZip 3.0 (2017) | Non-blocking, progress callbacks |
| localStorage for large data | IndexedDB for > 5MB | Always | Better for large embedded images |

**Deprecated/outdated:**
- **jspdf-autotable:** Overkill for simple document export, adds 30KB
- **pdfkit:** Server-side only, doesn't work in browser
- **html2pdf.js:** Wrapper library; use jsPDF + html2canvas directly

## Open Questions

Things that couldn't be fully resolved:

1. **File size limits for embedded resources**
   - What we know: UploadedResource.content.images can contain large base64 strings
   - What's unclear: Max practical .cue file size before browser performance degrades
   - Recommendation: Test with realistic worksheets; consider compression or external storage if > 50MB

2. **Font embedding for consistent PDF output**
   - What we know: jsPDF includes Helvetica/Times/Courier by default
   - What's unclear: Whether custom web font (Fredoka) should be embedded in PDFs
   - Recommendation: Use Helvetica for print (cleaner, universal), Fredoka only for headers if desired

## Sources

### Primary (HIGH confidence)
- jsPDF official documentation - text API, splitTextToSize, multi-page handling
- JSZip official documentation - generateAsync, blob output, compression options
- Existing codebase patterns - ExportModal.tsx, saveService.ts, loadService.ts

### Secondary (MEDIUM confidence)
- [jsPDF Documentation](https://artskydj.github.io/jsPDF/docs/jsPDF.html) - API reference
- [JSZip Documentation](https://stuk.github.io/jszip/) - API and examples
- [Text and Fonts | jsPDF DeepWiki](https://deepwiki.com/parallax/jsPDF/3.1-text-and-fonts) - Font handling
- [Create Zip Archives in Browser](https://transloadit.com/devtips/create-zip-archives-in-the-browser-with-jszip/) - JSZip patterns

### Tertiary (LOW confidence)
- Stack Overflow discussions on jsPDF page breaks (verified against official docs)
- Community examples for multi-file zip download (verified against JSZip docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - jsPDF already in codebase, JSZip is standard
- Architecture: HIGH - Patterns follow existing codebase conventions
- Pitfalls: HIGH - Based on documented issues and existing ExportModal experience

**Research date:** 2026-01-31
**Valid until:** 90 days (stable libraries, minimal breaking changes expected)
