# Project Research Summary

**Project:** Cue v3.7 - AI Resource Enhancement
**Domain:** AI-powered document enhancement for educational worksheets
**Researched:** 2026-01-29
**Confidence:** HIGH

## Executive Summary

AI Resource Enhancement is a well-understood domain with clear patterns: teachers upload existing materials (worksheets, handouts, PDFs), AI analyzes and enhances them while preserving original intent, and outputs are differentiated for varying student abilities. The key insight from research is to **use an AI-first approach with multimodal vision** rather than traditional OCR or complex client-side parsing. Gemini/Claude's vision capabilities handle document understanding better than Tesseract.js or PDF.js text extraction, especially for complex layouts, tables, and scanned documents.

The recommended approach leverages Cue's existing architecture extensively. File upload follows the established PDF processing pattern in App.tsx. AI integration extends the AIProviderInterface with two new methods (analyzeDocument, enhanceResource). PDF export reuses jsPDF + html2canvas from ExportModal. Persistence extends CueFileContent with an optional enhancedResources array. **Only one new dependency is needed: mammoth.js (~200KB) for Word document support**, and even that can be deferred since PDF and images cover 90% of teacher use cases.

The primary risks are hallucination-corrupted educational content and teacher trust erosion. AI can introduce factual errors when "enhancing" worksheets with wrong numbers, dates, or technical terms. Prevention requires a "preserve mode" default where AI improves presentation without changing content, mandatory diff-based review UI showing every change, and explicit constraints in prompts forbidding factual modifications. Teachers need transparency about what changed, why, and how confident the AI is. Without this, the feature will fail despite working technology.

## Key Findings

### Recommended Stack

The existing stack provides nearly everything needed. Cue already uses React 19, Vite, TypeScript, Gemini API, Claude API, PDF.js, jsPDF, and html2canvas. The only required addition is mammoth.js for Word document text extraction.

**Core technologies (existing - no changes):**
- **Gemini/Claude Vision API**: Document understanding via multimodal analysis - far superior to traditional OCR
- **jsPDF + html2canvas**: PDF generation for enhanced resource export - proven pattern from Working Wall
- **PDF.js**: PDF page rendering and text extraction - existing lesson plan processing infrastructure

**New addition:**
- **mammoth.js (^1.11.0)**: Word document text extraction (~200KB) - optional, can defer to v2

**Explicitly NOT adding:**
- Tesseract.js (5MB+ bloat, inferior accuracy to Gemini vision)
- Canvas libraries (Konva.js, Fabric.js - over-engineered)
- Additional PDF libraries (pdf-lib, pdfmake - existing jsPDF sufficient)

### Expected Features

**Must have (table stakes):**
- Multi-format upload (PDF, image) - teachers have resources in various formats
- Preview before enhancement - critical for trust
- Original intent preservation - most common AI complaint is over-generation
- Differentiation output (simple/standard/detailed) - universal expectation in 2025-2026
- Print-ready PDF export - teachers need immediately usable output
- Editable output - teachers always want to tweak AI results
- Cancel/regenerate - expected in any AI tool

**Should have (differentiators):**
- Lesson context awareness - UNIQUE: enhanced resources align with adapted lesson content
- Content alignment suggestions - "This worksheet supports slide 3's learning objective"
- Answer key generation - common ask, easy win

**Defer (v2+):**
- Word/Docs upload - requires additional parsing, PDF covers most cases
- Visual layout enhancement - complex image processing
- Per-slide resource linking - UX complexity
- Batch multi-resource enhancement - time saver but not MVP

### Architecture Approach

The architecture extends Cue naturally with minimal new components. Enhanced resources are a new data type stored alongside slides in presentation state, persisted via CueFile format extension.

**Major components:**
1. **ResourceHub.tsx (modified)** - Adds "Enhance" mode tab alongside existing "Generate" mode
2. **resourceAnalyzerService.ts (new)** - Orchestrates file parsing: PDF via existing pattern, images via FileReader, Word via mammoth.js
3. **AIProviderInterface (extended)** - Adds analyzeDocument() and enhanceResource() methods
4. **EnhancedResourcePreview.tsx (new)** - Renders preview with edit capability (similar to PosterRenderer)
5. **resourceExportService.ts (new)** - PDF generation following ExportModal pattern
6. **CueFileContent (extended)** - Optional enhancedResources array (v4 file format)

### Critical Pitfalls

1. **Document Parsing Fails Silently** - PDF.js extracts text without layout; tables become jumbled. **Prevent:** Use multimodal AI (image + text) as primary approach, detect complexity before processing, warn users about limitations.

2. **AI Hallucinations Corrupt Educational Content** - AI "enhances" worksheets with wrong numbers/facts. **Prevent:** Default to "preserve" mode, explicit prompt constraints forbidding factual changes, mandatory diff-based review UI.

3. **Layout Reconstruction Loses Structure** - Fill-in-blanks, tables, spacing lost in output. **Prevent:** Offer format-specific templates, "text only" enhancement option, layout preview before committing.

4. **Large Documents Crash Browser** - Memory exhaustion with no error message. **Prevent:** Enforce file size limits (25MB, 20 pages), process in chunks, detect device capabilities.

5. **Teachers Don't Trust Invisible Changes** - Feature fails without trust calibration. **Prevent:** Visual diff with accept/reject controls, transparency about AI limitations, preserve audit trail.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Types and File Upload
**Rationale:** Foundation must exist before any processing. File upload is low-risk and validates integration path.
**Delivers:** Accept PDF/image uploads, detect file types, store in local state, show upload preview
**Addresses:** Multi-format upload (table stake)
**Avoids:** Large document crash (by implementing size limits immediately)
**Uses:** Existing PDF processing pattern from App.tsx

### Phase 2: AI Document Analysis
**Rationale:** Analysis must work before enhancement can be built. Testing multimodal approach early validates core assumption.
**Delivers:** Send documents to Gemini/Claude vision, receive structured analysis (document type, sections, exercises)
**Addresses:** Preview before enhancement (table stake)
**Avoids:** Complex layout parsing failure (by using multimodal as primary approach)
**Implements:** AIProviderInterface extension (analyzeDocument method)

### Phase 3: Enhancement with Lesson Context
**Rationale:** Core feature depends on phases 1-2. Lesson context is Cue's primary differentiator.
**Delivers:** AI-enhanced content with lesson awareness, differentiated versions (simple/standard/detailed)
**Addresses:** Original intent preservation, differentiation output, lesson context awareness
**Avoids:** AI hallucinations (by implementing preserve mode and prompt constraints)
**Implements:** AIProviderInterface extension (enhanceResource method)

### Phase 4: Preview, Edit, and Trust UI
**Rationale:** Teachers must see and approve changes before any output. Trust mechanisms cannot be retrofitted.
**Delivers:** Side-by-side diff view, inline editing, accept/reject per change, regenerate option
**Addresses:** Editable output, cancel/regenerate, teacher trust (critical pitfall)
**Avoids:** Invisible changes eroding trust
**Implements:** EnhancedResourcePreview component

### Phase 5: Export and Persistence
**Rationale:** Output delivery after all processing and editing complete. Follows proven patterns.
**Delivers:** Print-ready PDF export, save in .cue file, load preserved resources
**Addresses:** Print-ready PDF export, resource persistence
**Implements:** resourceExportService, CueFile v4 format
**Uses:** jsPDF + html2canvas (existing)

### Phase Ordering Rationale

- **Dependencies are sequential:** Upload -> Analysis -> Enhancement -> Preview -> Export
- **Risk mitigation front-loaded:** File limits (Phase 1), multimodal approach (Phase 2), hallucination prevention (Phase 3), trust UI (Phase 4) all address critical pitfalls early
- **Persistence can parallel:** Phase 5 types work can begin during Phase 2-3 development
- **MVP deliverable at Phase 5:** Full feature loop complete; Word support can follow

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Enhancement):** Prompt engineering for preserve mode vs. elaborate mode; provider-specific prompt optimization for Gemini vs Claude
- **Phase 4 (Preview/Trust):** Diff visualization UX research; optimal granularity for change review

Phases with standard patterns (skip research-phase):
- **Phase 1 (Upload):** Well-established browser File API patterns, existing Cue PDF processing to follow
- **Phase 5 (Export):** Existing jsPDF + html2canvas pattern fully documented in ExportModal.tsx

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Minimal additions; mammoth.js well-documented; Gemini/Claude vision verified |
| Features | HIGH | Competitor analysis consistent; differentiation patterns universal |
| Architecture | HIGH | Extends existing Cue patterns; integration points clearly mapped |
| Pitfalls | HIGH | Multiple authoritative sources; mapped to implementation phases |

**Overall confidence:** HIGH

### Gaps to Address

- **Provider-specific prompt optimization:** Gemini and Claude may need different prompts for consistent results. Test both during Phase 3 development.
- **Complex layout handling:** Multimodal approach is recommended, but edge cases (heavily formatted tables, multi-column worksheets) need validation with real teacher documents.
- **Memory limits on low-end devices:** Device capability detection (navigator.deviceMemory) is Chrome-only. Need fallback strategy for Safari/Firefox.

## Sources

### Primary (HIGH confidence)
- Cue codebase (App.tsx, aiProvider.ts, ExportModal.tsx) - architecture patterns
- [Gemini Document Processing](https://ai.google.dev/gemini-api/docs/document-processing) - PDF/image multimodal support
- [mammoth npm package](https://www.npmjs.com/package/mammoth) - v1.11.0 confirmed
- [OpenAI hallucination research](https://openai.com/index/why-language-models-hallucinate/) - prevention strategies

### Secondary (MEDIUM confidence)
- [Nutrient.io PDF.js guide](https://www.nutrient.io/blog/complete-guide-to-pdfjs/) - layout extraction limitations
- [Michigan Virtual AI in Education](https://michiganvirtual.org/research/publications/ai-in-education-a-2025-snapshot-of-trust-use-and-emerging-practices/) - teacher trust patterns
- [Diffit](https://web.diffit.me), [MagicSchool](https://www.magicschool.ai), [Eduaide](https://www.eduaide.ai) - competitor feature analysis

### Tertiary (LOW confidence)
- [OCR Accuracy Benchmarks 2026](https://research.aimultiple.com/ocr-accuracy/) - Gemini leads printed text; benchmark methodology not verified

---
*Research completed: 2026-01-29*
*Ready for roadmap: yes*
