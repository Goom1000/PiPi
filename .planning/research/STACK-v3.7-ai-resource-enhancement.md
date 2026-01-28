# Technology Stack: AI Resource Enhancement (v3.7)

**Project:** Cue - AI Resource Enhancement Feature
**Researched:** 2026-01-29
**Scope:** Stack additions for document parsing, AI enhancement, and layout reconstruction

## Executive Summary

The AI Resource Enhancement feature requires parsing uploaded documents (images, PDF, Word), analyzing content with AI, and reconstructing enhanced layouts. The existing stack already provides most capabilities needed. The key insight: **leverage existing AI APIs (Gemini/Claude) for document understanding rather than adding complex client-side parsing**.

**Recommendation:** AI-first approach - send documents directly to Gemini/Claude vision APIs for analysis, minimizing client-side parsing complexity. Only add mammoth.js for Word document text extraction.

---

## Existing Stack (Already Validated - DO NOT CHANGE)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| React | ^19.2.0 | UI framework | Existing |
| Vite | ^6.2.0 | Build tool | Existing |
| TypeScript | ~5.8.2 | Type safety | Existing |
| @google/genai | ^1.30.0 | Gemini API | Existing |
| jsPDF | ^4.0.0 | PDF generation | Existing |
| html2canvas | ^1.4.1 | HTML to image | Existing |
| Tailwind CSS | - | Styling | Existing (via CDN) |

**Critical:** These are production-validated. No version changes recommended.

---

## Recommended Stack Additions

### 1. mammoth.js - Word Document Extraction (REQUIRED)

| Property | Value |
|----------|-------|
| **Package** | `mammoth` |
| **Version** | `^1.11.0` (latest stable) |
| **Purpose** | Extract text/HTML from .docx files client-side |
| **Why** | Only reliable client-side Word parser; pure JavaScript, no dependencies |

**Rationale:**
- The app needs to support Word/Docs uploads alongside PDF and images
- mammoth.js is the de-facto standard for client-side .docx parsing
- Works in browser via `mammoth.browser.js` or bundled via npm
- Extracts semantic HTML (headings, lists, paragraphs) - useful for understanding document structure
- 675 npm dependents, actively maintained (last publish: ~4 months ago)

**What it provides:**
```typescript
// Extract HTML for AI analysis
const result = await mammoth.convertToHtml({ arrayBuffer: fileBuffer });
const html = result.value; // Semantic HTML

// Extract raw text for simpler analysis
const textResult = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
const text = textResult.value;
```

**Limitations:**
- Does NOT preserve exact visual layout (fonts, colors, spacing)
- Complex formatting may be lost (this is acceptable - AI will reconstruct layout)
- Does NOT support .doc (legacy format) - only .docx

**Alternative Considered:** docx-preview.js
- Better visual fidelity but we don't need rendering - we need content extraction for AI
- mammoth's semantic HTML is more useful for AI analysis

---

### 2. NO NEW OCR LIBRARY NEEDED (Gemini/Claude Vision)

**Critical Decision: Do NOT add Tesseract.js**

| Approach | Tesseract.js | Gemini/Claude Vision |
|----------|--------------|---------------------|
| Accuracy (printed) | ~85-95% | >95% (benchmark leader) |
| Accuracy (handwriting) | Poor | Excellent |
| Complex layouts | Struggles | Excellent |
| Processing | Client-side CPU (slow) | API (fast) |
| Bundle size | ~5MB+ | 0 (already have APIs) |
| Integration effort | Significant | Minimal |

**Rationale:**
- Gemini 2.0 Flash and Claude 3.5+ both have excellent document understanding
- Can send images/PDFs directly to API with base64 inlineData
- AI understands layout, tables, handwriting - far beyond OCR
- No additional bundle size (already using @google/genai)
- Better accuracy with less code

**How it works (already supported by existing stack):**
```typescript
// Send image directly to Gemini for analysis
const contents = [
  { text: "Analyze this worksheet. Extract all text, describe the layout, and identify educational elements." },
  { inlineData: { mimeType: 'image/png', data: base64Image } }
];
const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents
});
```

**When Tesseract.js WOULD be needed (but isn't for this feature):**
- Offline-first requirement (we're online-dependent anyway for AI)
- Privacy regulations preventing cloud processing (not applicable)
- Very high-volume batch processing (not the use case)

---

### 3. PDF.js - PDF Page Rendering (CONDITIONAL)

| Property | Value |
|----------|-------|
| **Package** | `pdfjs-dist` |
| **Version** | `^5.x` or `^4.x` (verify compatibility with build) |
| **Purpose** | Render PDF pages to canvas for image capture |
| **Status** | CONDITIONAL - may not need if sending PDF directly to AI |

**Decision Matrix:**

| Approach | When to Use |
|----------|-------------|
| Send PDF directly to Gemini | PDF < 20MB, want full document analysis |
| Render pages via PDF.js | Need page-by-page analysis, want preview UI |

**Recommendation:** Start WITHOUT PDF.js. Gemini accepts PDFs directly via inlineData:
```typescript
const contents = [
  { text: "Analyze this worksheet PDF" },
  { inlineData: { mimeType: 'application/pdf', data: base64Pdf } }
];
```

**Add PDF.js later IF:**
- Need to show PDF preview before processing
- Need to process individual pages differently
- PDF size exceeds Gemini's limits (50MB for parsing)

**Note:** The project already uses PDF.js concepts for lesson plan parsing - may be able to reuse that infrastructure if needed.

---

### 4. NO ADDITIONAL PDF GENERATION LIBRARY NEEDED

**Existing jsPDF + html2canvas is sufficient.**

The app already generates PDFs (Working Wall export). For differentiated output:
- Generate 3 HTML layouts (simple/standard/detailed)
- Render each to canvas via html2canvas
- Add to PDF via jsPDF

**Alternative Considered:** @react-pdf/renderer
- More React-native approach
- BUT: Would require rewriting existing PDF generation
- NOT recommended - maintain consistency with existing approach

---

## What NOT to Add (and Why)

### Tesseract.js
- **Why Not:** Gemini/Claude vision is more accurate, already integrated, no bundle bloat
- **Exception:** Only if offline-first becomes a requirement

### docx-preview.js
- **Why Not:** Visual rendering not needed - need content extraction
- **Use mammoth.js** for semantic content extraction instead

### pdf-lib
- **Why Not:** For PDF manipulation (forms, editing) - not our use case
- **jsPDF** handles generation; AI handles understanding

### pdfmake
- **Why Not:** More complex API, would require rewriting existing PDF logic
- **Existing jsPDF** approach is working and simpler

### @react-pdf/renderer
- **Why Not:** Different paradigm from existing jsPDF approach
- **Would require** significant refactoring of posterService.ts

### canvas libraries (Konva.js, Fabric.js)
- **Why Not:** Over-engineered for this feature
- **HTML + CSS + html2canvas** is sufficient for layout reconstruction

---

## Integration Architecture

```
                    User Upload
                         |
          +--------------+--------------+
          |              |              |
        .docx          .pdf         .png/.jpg
          |              |              |
     mammoth.js     Direct or      Direct
     (extract HTML)  PDF.js         |
          |              |              |
          +--------------+--------------+
                         |
                   Base64 + Context
                         |
              Gemini/Claude Vision API
                         |
            Structured Analysis Response
            (layout, content, suggestions)
                         |
              React Component Rendering
              (preview + editing UI)
                         |
              User Approval + Edits
                         |
              jsPDF + html2canvas
                         |
              Differentiated PDF Output
```

---

## File Type Support Matrix

| Format | Parsing Approach | AI Analysis | Notes |
|--------|-----------------|-------------|-------|
| PNG/JPG | Read as base64 | Gemini vision | Direct, simplest path |
| PDF | Read as base64 | Gemini PDF support | Up to 50MB, 1000 pages |
| DOCX | mammoth.js -> HTML | Gemini text | Convert first, then analyze |
| DOC (legacy) | NOT SUPPORTED | - | .doc is binary, no client-side parser |
| Google Docs | Export as PDF/DOCX | Same as above | Instruct users to export |

---

## Browser Compatibility Considerations

### mammoth.js Browser Support
- Requires modern browser with ArrayBuffer support
- Works in: Chrome 49+, Firefox 52+, Safari 10+, Edge 79+
- **iOS Safari:** Supported (tested)

### File API Requirements
- FileReader API for reading uploads
- Blob API for handling binary data
- All supported in target browsers (Safari 10+)

### Memory Constraints
- Large PDFs (>10MB) may cause memory issues on mobile
- Recommend: Client-side file size limits (e.g., 25MB)
- Consider: Progressive loading for large documents

---

## Installation Commands

```bash
# Required addition
npm install mammoth

# That's it - one package
```

**Total bundle impact:** ~200KB (mammoth.js minified)

---

## Version Verification

| Package | Claimed Version | Source | Confidence |
|---------|-----------------|--------|------------|
| mammoth | 1.11.0 | [npm registry](https://www.npmjs.com/package/mammoth) | HIGH |
| @google/genai | 1.30.0 | package.json (existing) | HIGH |
| Gemini 2.0 Flash | Current | [Google AI docs](https://ai.google.dev/gemini-api/docs/document-processing) | HIGH |

**Note:** Gemini 2.0 Flash will be retired March 3, 2026. Plan to migrate to gemini-2.5-flash-lite or newer before then.

---

## Configuration Additions

### vite.config.ts
No changes needed - mammoth.js works with standard Vite bundling.

### TypeScript
mammoth includes TypeScript type definitions.

```typescript
// types.ts additions
interface ResourceEnhancementInput {
  file: File;
  mimeType: 'image/png' | 'image/jpeg' | 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  lessonContext?: string; // Current presentation context for alignment
}

interface EnhancementAnalysis {
  originalContent: string;
  layout: 'worksheet' | 'handout' | 'flashcard' | 'quiz' | 'other';
  suggestedImprovements: string[];
  differentiationOptions: {
    simple: string;
    standard: string;
    detailed: string;
  };
}
```

---

## Sources

### Verified (HIGH confidence)
- [mammoth npm package](https://www.npmjs.com/package/mammoth) - v1.11.0 confirmed
- [Gemini Document Processing](https://ai.google.dev/gemini-api/docs/document-processing) - PDF/image support confirmed
- [Gemini Image Understanding](https://ai.google.dev/gemini-api/docs/image-understanding) - inlineData base64 confirmed
- [Claude PDF Support](https://docs.anthropic.com/en/docs/build-with-claude/pdf-support) - vision-based PDF analysis

### Cross-referenced (MEDIUM confidence)
- [OCR Accuracy Benchmarks 2026](https://research.aimultiple.com/ocr-accuracy/) - Gemini leads printed text
- [Best JS PDF Libraries 2025](https://www.nutrient.io/blog/top-js-pdf-libraries/) - jsPDF recommended for client-side
- [React PDF Libraries 2025](https://blog.react-pdf.dev/6-open-source-pdf-generation-and-modification-libraries-every-react-dev-should-know-in-2025) - confirms jsPDF approach

---

## Summary: Minimal Changes, Maximum Capability

| Category | Change | Impact |
|----------|--------|--------|
| New packages | +mammoth (200KB) | Word support |
| Existing leverage | Gemini/Claude vision | Document understanding |
| Existing leverage | jsPDF + html2canvas | PDF generation |
| NOT adding | Tesseract.js | Avoided 5MB+ bloat |
| NOT adding | Heavy canvas libs | Keep it simple |

**Total new dependencies:** 1 (mammoth)
**Bundle size increase:** ~200KB
**New APIs to learn:** mammoth.convertToHtml()

This approach respects the existing architecture while adding the minimum necessary for the new feature.
