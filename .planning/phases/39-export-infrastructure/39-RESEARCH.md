# Phase 39: Export Infrastructure - Research

**Researched:** 2026-01-27
**Domain:** Client-side PDF generation, React modals, A4 document export
**Confidence:** HIGH

## Summary

Phase 39 enables teachers to export selected slides as A4 PDFs for classroom Working Wall display. The phase covers: (1) "Export for Working Wall" button in toolbar, (2) export modal with Quick Export vs AI Poster mode options, (3) slide preview with deselection capability, and (4) Quick Export functionality that captures slides as-is to PDF.

Research reveals a clear standard approach:
1. **PDF Generation**: Use jsPDF + html2canvas - industry standard for client-side HTML-to-PDF conversion with 2.6M+ weekly downloads
2. **Modal Pattern**: Codebase has established modal patterns (ClassBankSaveModal, RecoveryModal, SettingsModal) with fixed overlay, centered card, dark mode support, and Escape key handling
3. **Slide Rendering**: SlideRenderers.tsx has SlideContentRenderer that renders any slide layout - use this for PDF preview and capture
4. **Selection State**: Phase 38 provides selectedSlideIds Set and handlers - pass to modal, sync removal changes back to parent

The approach is to create a hidden render container for each selected slide, use html2canvas to capture each as an image, then use jsPDF to create a multi-page A4 PDF with one slide per page. The modal previews slides using the existing SlideContentRenderer component with removal capability.

**Primary recommendation:** Install jsPDF + html2canvas, create ExportModal component following established modal patterns, render slide previews using SlideContentRenderer, capture each slide to canvas and add to PDF pages, auto-download the generated PDF.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsPDF | 4.x | PDF document creation | 30K+ GitHub stars, 2.6M+ weekly downloads, built-in TypeScript types |
| html2canvas | 1.4.x | HTML element to canvas screenshot | Standard pairing with jsPDF, renders styled elements to canvas |
| React | 19.2.0 | Modal component, state management | Already in project |
| TypeScript | 5.8.2 | Type safety for PDF options | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SlideContentRenderer | Existing | Render slide layouts | Preview slides in modal, render for PDF capture |
| selectedSlideIds | Phase 38 | Track which slides to export | Filter slides array, update on modal deselection |
| Blob | Native | Create downloadable file | Generate PDF blob for auto-download |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jsPDF + html2canvas | react-to-pdf | react-to-pdf is simpler but limited - jsPDF gives full control over multi-page documents |
| jsPDF + html2canvas | pdfmake | pdfmake requires declarative document structure - html2canvas captures existing styled HTML directly |
| jsPDF + html2canvas | @react-pdf/renderer | @react-pdf/renderer requires rewriting components in PDF-specific JSX - too much work for this use case |
| html2canvas | Native toDataURL | toDataURL only works on canvas elements - html2canvas captures styled DOM elements |
| Hidden render container | Visible preview | Visible preview might flash during capture - hidden container is seamless |

**Installation:**
```bash
npm install jspdf html2canvas
```

Both libraries include TypeScript types - no @types packages needed.

## Architecture Patterns

### Recommended Project Structure
```
components/
  ExportModal.tsx           # New modal component
  ExportModal/
    SlidePreview.tsx        # Preview card with removal button (optional split)
services/
  pdfExportService.ts       # PDF generation logic (optional - can inline in modal)
```

Note: Given codebase patterns (flat components, no services folder except pptxService), the simplest approach is a single ExportModal.tsx file with inline PDF generation logic.

### Pattern 1: Modal Component Structure
**What:** Follow existing modal patterns (ClassBankSaveModal, RecoveryModal)
**When to use:** Any full-screen overlay with centered content
**Example:**
```typescript
// Source: Adapted from ClassBankSaveModal.tsx
interface ExportModalProps {
  slides: Slide[];
  selectedSlideIds: Set<string>;
  onUpdateSelection: (ids: Set<string>) => void;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  slides,
  selectedSlideIds,
  onUpdateSelection,
  onClose
}) => {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        {/* Header, Content, Actions */}
      </div>
    </div>
  );
};
```

### Pattern 2: PDF Generation with jsPDF + html2canvas
**What:** Capture DOM elements to canvas, add to PDF pages
**When to use:** Converting styled HTML to PDF
**Example:**
```typescript
// Source: jsPDF + html2canvas documentation
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const generatePDF = async (elements: HTMLElement[]): Promise<Blob> => {
  // A4 dimensions in points (595.28 x 841.89 for portrait)
  // For landscape: 841.89 x 595.28
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < elements.length; i++) {
    if (i > 0) pdf.addPage();

    const canvas = await html2canvas(elements[i], {
      scale: 2,              // Higher quality
      useCORS: true,         // Load cross-origin images
      allowTaint: false,     // Don't taint canvas with cross-origin
      backgroundColor: null, // Transparent (element has its own bg)
      logging: false         // Silence console
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
  }

  return pdf.output('blob');
};
```

### Pattern 3: Hidden Render Container for PDF Capture
**What:** Render slides off-screen at fixed dimensions for consistent PDF output
**When to use:** Capturing elements that need specific dimensions not matching viewport
**Example:**
```typescript
// Render container for PDF capture (hidden from view)
// A4 landscape ratio: 297mm x 210mm = ~1.414:1
// Use 1190 x 842 pixels (2x A4 at 72dpi for quality)
<div
  ref={renderContainerRef}
  className="fixed -left-[9999px] top-0"
  style={{ width: '1190px', height: '842px' }}
>
  {selectedSlides.map((slide, idx) => (
    <div
      key={slide.id}
      ref={el => slideRefs.current[idx] = el}
      style={{ width: '1190px', height: '842px' }}
    >
      <SlideContentRenderer
        slide={slide}
        visibleBullets={slide.content.length} // Show all bullets
      />
    </div>
  ))}
</div>
```

### Pattern 4: Mode Selection (Quick Export vs AI Poster)
**What:** Radio buttons or cards for selecting export mode
**When to use:** Binary choice before proceeding
**Example:**
```typescript
// Source: Adapted from codebase button patterns
const [exportMode, setExportMode] = useState<'quick' | 'ai-poster'>('quick');

// Card-style selection
<div className="grid grid-cols-2 gap-4 mb-6">
  <button
    onClick={() => setExportMode('quick')}
    className={`p-4 rounded-xl border-2 text-left transition-all ${
      exportMode === 'quick'
        ? 'border-indigo-600 dark:border-amber-500 bg-indigo-50 dark:bg-amber-500/10'
        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
    }`}
  >
    <h3 className="font-bold text-slate-800 dark:text-white">Quick Export</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400">Export slides as-is</p>
  </button>

  <button
    onClick={() => setExportMode('ai-poster')}
    className={`p-4 rounded-xl border-2 text-left transition-all ${
      exportMode === 'ai-poster'
        ? 'border-indigo-600 dark:border-amber-500 bg-indigo-50 dark:bg-amber-500/10'
        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
    }`}
  >
    <h3 className="font-bold text-slate-800 dark:text-white">AI Poster</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400">Transform into posters</p>
  </button>
</div>
```

### Pattern 5: Slide Preview with Removal
**What:** Grid of slide previews with X button to remove from export selection
**When to use:** Preview before export with ability to modify selection
**Example:**
```typescript
// Preview grid with removal (changes sync to parent selection state)
const handleRemoveSlide = (slideId: string) => {
  const newIds = new Set(selectedSlideIds);
  newIds.delete(slideId);
  onUpdateSelection(newIds);
};

<div className="grid grid-cols-3 gap-4 overflow-y-auto p-4">
  {selectedSlides.map((slide, idx) => (
    <div key={slide.id} className="relative group aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
      {/* Slide thumbnail preview */}
      <div className="w-full h-full">
        <SlideContentRenderer
          slide={slide}
          visibleBullets={slide.content.length}
        />
      </div>

      {/* Slide number badge */}
      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        {idx + 1}
      </div>

      {/* Remove button */}
      <button
        onClick={() => handleRemoveSlide(slide.id)}
        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  ))}
</div>
```

### Anti-Patterns to Avoid
- **Don't use jsPDF's built-in html() method alone**: It struggles with complex CSS - html2canvas handles Tailwind styles better
- **Don't capture visible elements directly**: Visible elements may have wrong dimensions - use hidden fixed-size container
- **Don't use scale: 1 in html2canvas**: Lower quality output - use scale: 2 for print-quality PDF
- **Don't block UI during PDF generation**: Show loading state, generation can take 1-3 seconds for multiple slides
- **Don't mutate parent selection state directly**: Pass callback to modal, let modal request changes
- **Don't forget to handle empty selection**: Close modal or disable export if all slides removed

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML to PDF conversion | Canvas drawing + PDF construction | jsPDF + html2canvas | Years of edge cases handled (fonts, images, CSS, cross-origin) |
| A4 page dimensions | Manual pixel calculations | jsPDF format: 'a4' | Standard dimensions built into library |
| Multi-page PDF | Manual page management | jsPDF addPage() | Handles page breaks, maintains document state |
| Image quality for print | Basic toDataURL | html2canvas scale: 2 + JPEG quality: 0.95 | 2x scale ensures 150+ DPI for print |
| Modal overlay pattern | Custom positioning | Existing modal pattern (fixed inset-0 + centered flex) | Codebase has established, accessible pattern |
| Cross-origin image handling | Manual proxy setup | html2canvas useCORS: true | Handles CORS automatically for most cases |

**Key insight:** PDF generation has many edge cases (fonts, images, page breaks, cross-origin). jsPDF + html2canvas handle these reliably - don't reinvent.

## Common Pitfalls

### Pitfall 1: Cross-Origin Image Taint
**What goes wrong:** html2canvas throws error or produces blank image when slide has external images
**Why it happens:** Browser security prevents canvas from reading cross-origin image data
**How to avoid:** Use `useCORS: true` in html2canvas options, ensure images are served with CORS headers, or accept that some images may not render
**Warning signs:** "Tainted canvas" console errors, blank areas where images should be

### Pitfall 2: PDF Dimensions Mismatch
**What goes wrong:** Slides appear stretched, squashed, or have white borders in PDF
**Why it happens:** Capture container size doesn't match A4 aspect ratio
**How to avoid:** Use exact A4 aspect ratio (1.414:1 for landscape, 0.707:1 for portrait) for render container
**Warning signs:** Slides look distorted, unexpected margins appear

### Pitfall 3: Low Quality PDF Output
**What goes wrong:** Text is blurry, images are pixelated when printed
**Why it happens:** html2canvas defaults to scale: 1 (screen resolution)
**How to avoid:** Use `scale: 2` or higher in html2canvas options, use JPEG quality 0.95
**Warning signs:** PDF looks fine on screen but blurry when printed or zoomed

### Pitfall 4: UI Freeze During Generation
**What goes wrong:** App appears frozen while generating PDF, no feedback to user
**Why it happens:** html2canvas is async but intensive, no loading state shown
**How to avoid:** Set loading state before generation, use await properly, show progress indicator
**Warning signs:** Export button stays pressed, user clicks multiple times, multiple downloads start

### Pitfall 5: Memory Issues with Many Slides
**What goes wrong:** Browser crashes or becomes unresponsive when exporting 20+ slides
**Why it happens:** Holding all canvas data in memory before creating PDF
**How to avoid:** Process slides sequentially (await each html2canvas before next), add small delay between slides, clear refs after adding to PDF
**Warning signs:** Browser tab crashes, memory usage spikes in dev tools

### Pitfall 6: Modal Selection State Desync
**What goes wrong:** Removing slides in modal doesn't update main selection, or changes are lost when modal closes
**Why it happens:** Modal has local copy of selection that isn't synced to parent
**How to avoid:** Pass selection update callback to modal, call callback immediately on each removal (per CONTEXT decisions)
**Warning signs:** Removed slides reappear when reopening modal, selection count doesn't match

### Pitfall 7: Empty Export State
**What goes wrong:** User removes all slides in preview, clicks Export, nothing happens or error
**Why it happens:** No check for empty selection before PDF generation
**How to avoid:** Disable Export button when selection is empty, show message to user
**Warning signs:** Export button does nothing, error in console about empty array

## Code Examples

### Complete ExportModal Component Structure
```typescript
// Source: Adapted from ClassBankSaveModal.tsx + jsPDF/html2canvas docs
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Slide } from '../types';
import { SlideContentRenderer } from './SlideRenderers';

interface ExportModalProps {
  slides: Slide[];
  selectedSlideIds: Set<string>;
  onUpdateSelection: (ids: Set<string>) => void;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  slides,
  selectedSlideIds,
  onUpdateSelection,
  onClose
}) => {
  const [exportMode, setExportMode] = useState<'quick' | 'ai-poster'>('quick');
  const [isExporting, setIsExporting] = useState(false);
  const renderContainerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Get selected slides in order
  const selectedSlides = slides.filter(s => selectedSlideIds.has(s.id));

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isExporting]);

  const handleRemoveSlide = useCallback((slideId: string) => {
    const newIds = new Set(selectedSlideIds);
    newIds.delete(slideId);
    onUpdateSelection(newIds);
  }, [selectedSlideIds, onUpdateSelection]);

  const handleQuickExport = async () => {
    if (selectedSlides.length === 0) return;

    setIsExporting(true);

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < selectedSlides.length; i++) {
        if (i > 0) pdf.addPage();

        const element = slideRefs.current[i];
        if (!element) continue;

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: null,
          logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
      }

      // Auto-download
      pdf.save('working-wall-export.pdf');
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
      {/* Modal content */}

      {/* Hidden render container for PDF capture */}
      <div
        ref={renderContainerRef}
        className="fixed -left-[9999px] top-0"
        aria-hidden="true"
      >
        {selectedSlides.map((slide, idx) => (
          <div
            key={slide.id}
            ref={el => slideRefs.current[idx] = el}
            style={{ width: '1190px', height: '842px' }}
          >
            <SlideContentRenderer
              slide={slide}
              visibleBullets={slide.content.length}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExportModal;
```

### Export Button in Toolbar
```typescript
// Source: Add to App.tsx toolbar after selection controls
<button
  onClick={() => setShowExportModal(true)}
  disabled={selectedSlideIds.size === 0}
  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
    selectedSlideIds.size === 0
      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
      : 'bg-indigo-600 dark:bg-amber-500 text-white dark:text-slate-900 hover:bg-indigo-700 dark:hover:bg-amber-400 shadow-lg'
  }`}
>
  Export for Working Wall
</button>
```

### Loading State During Export
```typescript
// Export button with loading state
<button
  onClick={handleQuickExport}
  disabled={isExporting || selectedSlides.length === 0}
  className="px-6 py-3 bg-indigo-600 dark:bg-amber-500 text-white dark:text-slate-900 rounded-xl font-bold disabled:opacity-50 transition-all flex items-center gap-2"
>
  {isExporting ? (
    <>
      <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      Generating PDF...
    </>
  ) : (
    'Export PDF'
  )}
</button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side PDF generation | Client-side with jsPDF | 2022-2024 | No server needed, instant download, works offline |
| Manual canvas to PDF | html2canvas + jsPDF combo | 2023-2024 | Handles CSS, fonts, images automatically |
| Single-page PDF only | jsPDF addPage() for multi-page | 2024-2025 | Full document support with page breaks |
| Low-res screen capture | html2canvas scale: 2+ | 2024-2025 | Print-quality output (150+ DPI) |
| @types/jspdf separate | Built-in TypeScript types | jsPDF 3.0+ | No extra type package needed |

**Deprecated/outdated:**
- **jspdf-autotable**: Only needed for tables - use html2canvas for styled HTML
- **@types/jspdf**: jsPDF now includes own types (stub package exists for legacy)
- **jspdf-html2canvas**: Combined package exists but using separate packages gives more control
- **react-pdf for generation**: @react-pdf/renderer is for creating PDFs from scratch, not capturing existing HTML

## Open Questions

1. **Filename format for downloaded PDF**
   - What we know: CONTEXT says Claude's discretion
   - What's unclear: Best filename convention
   - Recommendation: Use `working-wall-[timestamp].pdf` or `[lesson-title]-export.pdf` if title available

2. **Portrait vs Landscape orientation**
   - What we know: CONTEXT says Claude's discretion, slides are typically landscape (16:9-ish)
   - What's unclear: Whether A4 landscape is optimal
   - Recommendation: Use landscape A4 (841.89 x 595.28 pt) to match slide aspect ratio

3. **Image loading during PDF generation**
   - What we know: Slides may have images that load asynchronously
   - What's unclear: Whether images are already loaded when modal opens
   - Recommendation: Slides are already rendered in editing view, images should be cached. Add error handling for failed images.

4. **AI Poster mode implementation**
   - What we know: Phase 40 covers AI Poster (out of scope for 39)
   - What's unclear: How much UI scaffolding to add now
   - Recommendation: Add mode selection cards but disable/hide AI Poster option for Phase 39, make it easy to enable in Phase 40

## Sources

### Primary (HIGH confidence)
- Codebase patterns:
  - `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/components/ClassBankSaveModal.tsx` - Modal structure, styling, escape key handling
  - `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/components/SlideRenderers.tsx` - SlideContentRenderer for rendering slide layouts
  - `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/App.tsx` - Selection state from Phase 38, toolbar location
  - `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/types.ts` - Slide interface definition
- [jsPDF GitHub](https://github.com/parallax/jsPDF) - Official documentation, 30K+ stars
- [jsPDF Documentation](https://artskydj.github.io/jsPDF/docs/jsPDF.html) - API reference

### Secondary (MEDIUM confidence)
- [html2canvas Getting Started](https://html2canvas.hertzen.com/getting-started) - Official html2canvas documentation
- [Generate PDFs from HTML in React with jsPDF](https://www.nutrient.io/blog/how-to-convert-html-to-pdf-using-react/) - React-specific patterns
- [jsPDF HTML Example with html2canvas for Multiple Pages PDF](https://phppot.com/javascript/jspdf-html-example/) - Multi-page PDF generation
- [Top JavaScript PDF generator libraries](https://www.nutrient.io/blog/top-js-pdf-libraries/) - Library comparison

### Tertiary (LOW confidence)
- [6 Open-Source PDF generation libraries](https://dev.to/ansonch/6-open-source-pdf-generation-and-modification-libraries-every-react-dev-should-know-in-2025-13g0) - Library overview
- [How to Create Multipage PDF from HTML Using jsPDF and html2Canvas](https://www.freakyjolly.com/html2canvas-multipage-pdf-tutorial/) - Multipage tutorial

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - jsPDF + html2canvas is industry standard with millions of downloads
- Architecture: HIGH - Modal patterns established in codebase, PDF generation well-documented
- Pitfalls: HIGH - Cross-origin and memory issues are well-known, documented workarounds exist

**Research date:** 2026-01-27
**Valid until:** 2026-02-26 (30 days - stable libraries, established patterns)

**Implementation notes:**
- New dependencies: jspdf, html2canvas (both have TypeScript types built-in)
- New file: components/ExportModal.tsx (~150-200 lines)
- App.tsx changes: ~20 lines (export button, modal state, modal render)
- Phase 38 integration: Uses existing selectedSlideIds state, onUpdateSelection callback syncs changes
- A4 landscape dimensions: 841.89 x 595.28 pt (jsPDF units)
- Render container dimensions: 1190 x 842 px (2x A4 at 72dpi for quality)
