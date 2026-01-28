# Domain Pitfalls: AI Resource Enhancement

**Domain:** AI-powered document enhancement for educational worksheets
**Researched:** 2026-01-29
**Confidence:** HIGH (multiple authoritative sources, verified against existing Cue architecture)

## Executive Summary

Adding AI-powered document enhancement to Cue introduces five high-risk areas: (1) document parsing is unreliable for complex layouts, tables, and handwritten content; (2) AI enhancement hallucinations can introduce factual errors into educational materials; (3) layout reconstruction loses formatting that teachers consider essential; (4) file size and memory constraints in browsers create silent failures; and (5) teacher trust requires transparency about what AI changed. The existing Cue PDF handling (5-page limit, text extraction + page images) provides a foundation but must be extended carefully. Each pitfall includes warning signs and prevention strategies mapped to implementation phases.

---

## Critical Pitfalls

Mistakes that cause rewrites, major user impact, or require fundamental architecture changes.

---

### Pitfall 1: Document Parsing Fails Silently on Complex Layouts

**What goes wrong:** Teachers upload worksheets with tables, columns, text boxes, or mixed content. PDF.js extracts text as a jumbled stream without spatial relationships. The AI receives garbage input and produces nonsensical enhancements. Teachers see mangled output and lose trust immediately.

**Why it happens:** PDF.js (currently used by Cue) extracts text items individually without layout reconstruction. It cannot:
- Preserve table structure (rows/columns become interleaved text)
- Handle multi-column layouts (columns get concatenated)
- Extract text from images/scanned pages (no OCR capability)
- Maintain text box boundaries (content order becomes arbitrary)

From the [Nutrient PDF.js guide](https://www.nutrient.io/blog/complete-guide-to-pdfjs/): "Complex layouts like multi-column documents create problems because overlapping text layers make it difficult to identify text positions."

**Warning signs:**
- Extracted text contains repeated fragments or appears shuffled
- Tables render as comma-separated values without alignment
- Math worksheets lose equation structure
- Fill-in-the-blank worksheets lose underlines and spacing

**Consequences:**
- AI cannot understand worksheet structure, produces wrong enhancements
- Teachers must manually fix AI output, defeating the purpose
- Abandonment after first bad experience

**Prevention:**

1. **Classify document complexity before processing:**
   ```typescript
   interface DocumentComplexityAssessment {
     hasTablesDetected: boolean;      // via heuristics on text item positions
     hasMultipleColumns: boolean;     // text items in horizontal bands
     isScannedImage: boolean;         // no selectable text, only images
     hasFormsOrTextBoxes: boolean;    // discontinuous text regions
     complexity: 'simple' | 'moderate' | 'complex' | 'unsupported';
   }
   ```

2. **Use multimodal AI (image + text) as primary approach:**
   - Cue already renders PDF pages as images for multimodal input
   - For complex documents, prioritize the image over extracted text
   - Let Gemini/Claude's vision capabilities interpret the layout
   - Only use extracted text as supplementary context

3. **Warn users before processing complex documents:**
   - "This worksheet has tables/columns. AI enhancement works best with simple text layouts."
   - "Scanned worksheet detected. Results may vary - please review carefully."

4. **Provide manual fallback:**
   - Allow teachers to paste/type the worksheet content manually
   - Offer "describe this worksheet" option where teacher provides context

**Phase recommendation:** Address in Document Parsing phase. Build complexity detection before enhancement logic.

**Confidence:** HIGH - Based on [Nutrient.io documentation](https://www.nutrient.io/blog/complete-guide-to-pdfjs/), [ComPDFKit analysis](https://www.compdf.com/blog/what-is-so-hard-about-pdf-text-extraction)

---

### Pitfall 2: AI Enhancement Hallucinations Corrupt Educational Content

**What goes wrong:** AI "enhances" a worksheet by adding plausible-sounding but factually incorrect information. A math worksheet gets wrong answers in the answer key. A science handout includes a fabricated fact. A history timeline has incorrect dates. Teachers unknowingly distribute AI-corrupted materials to students.

**Why it happens:** LLMs hallucinate because "standard training and evaluation procedures reward guessing over acknowledging uncertainty" ([OpenAI research](https://openai.com/index/why-language-models-hallucinate/)). When enhancing educational content:
- AI may "complete" partial information with fabrications
- AI may "improve" correct information with plausible but wrong alternatives
- AI may change numbers, dates, or technical terms to ones that "sound better"
- AI confidence is not correlated with accuracy

From [Faculty Focus](https://www.facultyfocus.com/articles/teaching-with-technology-articles/mitigating-hallucinations-in-llms-for-community-college-classrooms-strategies-to-ensure-reliable-and-trustworthy-ai-powerful-learning-tools/): "Hallucination remains one of the most significant challenges limiting the widespread deployment of LLMs in high-stakes or educational settings."

**Warning signs:**
- AI confidently provides specific numbers/dates not in the original
- Enhanced content is longer than original (AI added information)
- Technical terms slightly changed (e.g., "photosynthesis" becomes "photo-synthesis")
- Answer keys modified from original values

**Consequences:**
- Students learn incorrect information
- Teachers' professional reputation damaged
- Potential academic integrity issues if tests affected
- Legal liability if materials used for assessments

**Prevention:**

1. **Default to "preserve" mode, not "enhance":**
   ```typescript
   type EnhancementMode =
     | 'preserve'      // Keep all facts, improve clarity only
     | 'elaborate'     // Add explanations (clearly marked as AI-generated)
     | 'simplify'      // Reduce complexity, preserve facts
     | 'reformat';     // Change layout only, zero content changes
   ```

2. **Explicitly constrain AI in prompts:**
   ```typescript
   const ENHANCEMENT_PROMPT = `
   You are enhancing a teacher's educational worksheet.

   CRITICAL RULES:
   1. NEVER change any numbers, dates, names, or technical terms
   2. NEVER add facts, examples, or information not in the original
   3. NEVER modify answer keys or correct answers
   4. If unsure about any content, preserve it exactly as-is
   5. Flag any content you're uncertain about with [VERIFY]

   Your role is to improve PRESENTATION, not CONTENT.
   `;
   ```

3. **Implement diff-based review UI:**
   - Show side-by-side: original vs. enhanced
   - Highlight every change with color coding
   - Require explicit approval for each change
   - Flag any numerical/factual changes with warnings

4. **Add verification prompts for high-risk changes:**
   - If AI changed a number: "AI modified '42' to '24'. Is this correct?"
   - If AI added content: "AI added this sentence. Keep it?"
   - If AI removed content: "AI removed this. Was it intentional?"

5. **Store original alongside enhanced version:**
   - Always keep the original document accessible
   - Enable one-click "revert to original" for any section
   - Track enhancement history for audit

**Phase recommendation:** Address in AI Enhancement phase. Build diff UI before any enhancement logic ships.

**Confidence:** HIGH - Based on [OpenAI hallucination research](https://openai.com/index/why-language-models-hallucinate/), [MIT Sloan AI guidance](https://mitsloanedtech.mit.edu/ai/basics/addressing-ai-hallucinations-and-bias/), [Nature paper on semantic entropy](https://www.nature.com/articles/s41586-024-07421-0)

---

### Pitfall 3: Layout Reconstruction Loses Essential Formatting

**What goes wrong:** A worksheet's visual structure carries pedagogical meaning. Fill-in-the-blank exercises need specific spacing. Tables organize related concepts. Answer boxes indicate where students write. After AI enhancement, all this structure is lost - the output is a wall of text or generic formatting.

**Why it happens:** Text extraction discards spatial information. Even if AI understands the content, regenerating the visual layout requires:
- Detecting original formatting intent (lines for writing, boxes for answers)
- Preserving alignment and spacing ratios
- Maintaining visual hierarchy (headings, subheadings, body text)
- Reproducing decorative but meaningful elements (borders, icons, numbering)

From [mammoth.js documentation](https://github.com/mwilliamson/mammoth.js): "There's a large mismatch between the structure used by .docx and the structure of HTML, meaning that the conversion is unlikely to be perfect for more complicated documents."

**Warning signs:**
- Fill-in-the-blank underlines become regular text
- Table borders disappear, cells merge into paragraphs
- Numbered lists lose their structure
- Image positioning changes relative to text
- Page breaks occur in wrong locations

**Consequences:**
- Worksheets become unusable for their intended purpose
- Teachers spend more time fixing output than creating from scratch
- Visual learners lose important structural cues
- Printing produces wrong results

**Prevention:**

1. **Use image-to-image enhancement where possible:**
   - For worksheets where layout is critical, enhance the image itself
   - Gemini/Claude can annotate images with suggestions
   - Teacher applies suggestions manually to preserve layout
   - Trade automation for accuracy when stakes are high

2. **Offer format-specific output templates:**
   ```typescript
   interface OutputFormat {
     type: 'markdown' | 'html' | 'structured-json' | 'annotated-image';
     preservesTables: boolean;
     preservesSpacing: boolean;
     editableByTeacher: boolean;
   }
   ```

3. **Detect and warn about layout-critical documents:**
   - Worksheets with grids, tables, or precise spacing
   - Forms with fill-in fields
   - Documents with specific margins for binder holes
   - Warn: "This worksheet has precise formatting. Enhancement may change layout."

4. **Provide layout preview before committing:**
   - Show how enhanced content will look printed
   - Allow comparison with original layout
   - Enable selective enhancement (enhance text, keep layout)

5. **Consider lightweight enhancement options:**
   - "Enhance text only" - keep all visual structure
   - "Add AI suggestions as comments" - overlay on original
   - "Generate companion notes" - separate document with enhancements

**Phase recommendation:** Address in Output Formatting phase. Build layout detection in Parsing phase.

**Confidence:** HIGH - Based on [mammoth.js GitHub](https://github.com/mwilliamson/mammoth.js), [Mistral OCR documentation](https://mistral.ai/news/mistral-ocr-3)

---

### Pitfall 4: Large Documents Crash Browser or Fail Silently

**What goes wrong:** Teacher uploads a 50-page curriculum guide or a worksheet packet. Browser tab freezes during processing. Memory exhaustion causes silent failure - no error message, just nothing happens. Or partial processing produces incomplete output.

**Why it happens:** Client-side document processing has hard limits:
- PDF.js loads entire document into memory before processing
- Base64 encoding of page images increases size by 33%
- JSON serialization requires contiguous memory allocation
- No streaming or chunking in browser environment

From existing Cue PITFALLS research: "A 50-slide presentation with generated images can easily exceed 100MB as JSON. The entire payload must fit in memory simultaneously."

From [Medium article on chunked loading](https://medium.com/@kurnosovnikita/dont-let-large-files-freeze-your-web-app-chunked-file-loading-in-javascript-efa566e21081): "When dealing with massive files, the traditional approach might make the browser become unresponsive."

**Warning signs:**
- Browser tab "not responding" during upload
- Progress indicator freezes at certain percentage
- Memory usage spikes in browser task manager
- Page crashes with no error message
- Processing completes but output is truncated

**Consequences:**
- Teachers lose work if browser crashes
- Large curriculum documents can't be processed
- No feedback about why processing failed
- Inconsistent behavior across devices (works on desktop, fails on tablet)

**Prevention:**

1. **Enforce file size limits with clear messaging:**
   ```typescript
   const FILE_LIMITS = {
     maxFileSizeMB: 25,
     maxPages: 20,
     maxImagesForMultimodal: 10,
     warningSizeMB: 10,
     warningPages: 10
   };

   function validateFile(file: File, pageCount: number): ValidationResult {
     if (file.size > FILE_LIMITS.maxFileSizeMB * 1024 * 1024) {
       return { valid: false, reason: `File too large (max ${FILE_LIMITS.maxFileSizeMB}MB)` };
     }
     if (pageCount > FILE_LIMITS.maxPages) {
       return { valid: false, reason: `Too many pages (max ${FILE_LIMITS.maxPages})` };
     }
     return { valid: true };
   }
   ```

2. **Process documents in chunks:**
   - Process 5 pages at a time (Cue already limits to 5 pages)
   - Show progress per chunk
   - Allow cancellation between chunks
   - Save partial progress in case of failure

3. **Offer page selection for large documents:**
   - "This document has 45 pages. Select which pages to enhance (max 20)."
   - Show page thumbnails for selection
   - Enable "enhance all" only with explicit memory warning

4. **Detect device capabilities:**
   ```typescript
   function estimateDeviceCapability(): 'high' | 'medium' | 'low' {
     const memory = (navigator as any).deviceMemory; // Chrome only
     if (memory && memory >= 8) return 'high';
     if (memory && memory >= 4) return 'medium';
     return 'low'; // Assume conservative limits
   }
   ```

5. **Show memory usage estimate before processing:**
   - "This 15-page document will use approximately 80MB of memory."
   - "Your device may have difficulty processing this. Continue?"

**Phase recommendation:** Address in File Handling phase. Build validation before processing starts.

**Confidence:** HIGH - Based on existing Cue pitfalls research, [MDN Storage documentation](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [Sense/Net large file handling](https://www.sensenet.com/en/blog/posts/5-challenges-of-handling-extremely-large-files-in-web-applications)

---

### Pitfall 5: Teachers Don't Trust AI Changes They Can't See

**What goes wrong:** AI enhances a worksheet "successfully" but teachers don't know what changed. They're uncomfortable distributing materials they haven't verified. Or they trust too much and don't review, then students find errors. Either way, the feature fails to build appropriate trust calibration.

**Why it happens:** Educational content carries professional responsibility. Teachers need to know:
- Exactly what was changed
- Why it was changed
- How confident the AI is
- What original content looked like

From [Michigan Virtual AI in Education report](https://michiganvirtual.org/research/publications/ai-in-education-a-2025-snapshot-of-trust-use-and-emerging-practices/): "Teachers are adopting AI at a rapid pace, yet their trust and confidence in the technology still trails behind that of administrators."

From [ACM FAccT 2025](https://dl.acm.org/doi/10.1145/3715275.3732176): "While teachers acknowledge AI's performance and its potential to enhance efficiency, they are deeply concerned about its limitations."

**Warning signs:**
- Teachers ask "what did it change?" and tool can't answer
- Teachers use enhanced materials without review (over-trust)
- Teachers reject enhanced materials without looking (under-trust)
- Support requests about "weird changes" that aren't tracked
- Teachers spend time manually comparing original and enhanced

**Consequences:**
- Feature adoption stalls despite working technology
- Errors slip through when teachers over-trust
- Benefits unrealized when teachers under-trust
- No path to appropriate trust calibration

**Prevention:**

1. **Mandatory change review before applying:**
   ```typescript
   interface EnhancementReview {
     originalSection: string;
     enhancedSection: string;
     changeType: 'clarification' | 'reorganization' | 'addition' | 'simplification';
     aiConfidence: 'high' | 'medium' | 'low';
     requiresApproval: boolean;  // true for additions, medium/low confidence
   }
   ```

2. **Visual diff with teacher-friendly explanations:**
   - Red strikethrough for removed text
   - Green highlight for added text
   - Yellow highlight for modified text
   - Plain-language explanation: "Made this sentence clearer by..."

3. **Granular accept/reject controls:**
   - Accept all / Reject all
   - Accept individual changes
   - "Keep original but save AI suggestion as note"
   - Edit AI suggestion before accepting

4. **Transparency about AI limitations:**
   - Show confidence indicator for each change
   - Explain what AI cannot verify (factual accuracy)
   - Recommend teacher review for specific change types
   - Link to "What can AI enhancement do?" help article

5. **Preserve audit trail:**
   - Log all enhancements with timestamps
   - Store original, enhanced, and final (teacher-edited) versions
   - Enable "show what AI suggested" for any document
   - Export enhancement history for records

**Phase recommendation:** Address throughout, but design in UI/UX phase. Must be present from first enhancement feature.

**Confidence:** HIGH - Based on [ScienceDirect trust research](https://www.sciencedirect.com/science/article/pii/S2666920X25000086), [Michigan Virtual report](https://michiganvirtual.org/research/publications/ai-in-education-a-2025-snapshot-of-trust-use-and-emerging-practices/), [US Dept of Education AI report](https://www.ed.gov/sites/ed/files/documents/ai-report/ai-report.pdf)

---

## Moderate Pitfalls

Mistakes that cause delays, poor UX, or technical debt.

---

### Pitfall 6: Word Document Support is Deceptively Hard

**What goes wrong:** Team adds Word (.docx) support expecting similar effort to PDF. But mammoth.js loses most formatting. Tables become text. Images get separated from captions. Styles are stripped. The "Word support" feature produces worse output than PDF.

**Why it happens:** Word documents use a fundamentally different structure from PDFs:
- OOXML format with nested XML relationships
- Styles define appearance, not structure
- Drawing objects (shapes, text boxes) are separate from text flow
- Track changes and comments add complexity

From [mammoth.js GitHub](https://github.com/mwilliamson/mammoth.js): "mammoth.js focuses on semantic HTML and might not retain complex formatting, styles, and layouts."

**Prevention:**

1. **Start with PDF-only, add Word as explicit v2 feature:**
   - Don't promise Word support until proven viable
   - Use PDF as forcing function for teachers with Word docs
   - "Save as PDF" guidance easier than fixing mammoth.js limitations

2. **If Word support needed, use multimodal approach:**
   - Convert Word to PDF first (complex)
   - Or: Tell teacher to screenshot/print-to-PDF
   - Or: Use Word's "Save as HTML" then parse HTML

3. **Set explicit unsupported feature list for Word:**
   - Text boxes (will be lost)
   - SmartArt (will become text)
   - Complex tables (structure may break)
   - Track changes (will be flattened)

**Phase recommendation:** Defer Word support to future milestone. Focus on PDF + image first.

**Confidence:** MEDIUM - Based on [mammoth.js documentation](https://github.com/mwilliamson/mammoth.js)

---

### Pitfall 7: Scanned Document OCR is Slow and Inaccurate

**What goes wrong:** Teacher uploads a scanned worksheet (image-based PDF). OCR takes 30+ seconds per page. Results have errors - especially for handwritten content, unusual fonts, or low-quality scans. Teacher spends more time fixing OCR errors than typing manually.

**Why it happens:** Tesseract.js (browser OCR) has fundamental limitations:
- Requires 300+ DPI for good accuracy
- Struggles with handwriting, cursive, unusual fonts
- Can't handle complex layouts (tables, columns)
- Processing time scales linearly with page count

From [Tesseract documentation](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html): "Tesseract works best on images which have a DPI of at least 300 dpi."

From [Koncile OCR analysis](https://www.koncile.ai/en/ressources/is-tesseract-still-the-best-open-source-ocr): "Tesseract has difficulties with tables, multi-column layouts and complex documents."

**Prevention:**

1. **Use multimodal AI instead of traditional OCR:**
   - Gemini/Claude vision can "read" scanned documents directly
   - No separate OCR step needed
   - Better handling of layout and context
   - More forgiving of image quality issues

2. **Detect scanned documents and set expectations:**
   ```typescript
   function isScannedPDF(pdf: PDFDocument): boolean {
     // If no selectable text but has images, likely scanned
     return pages.every(page =>
       page.textContent.items.length === 0 && page.hasImages
     );
   }
   ```
   - Warn: "This appears to be a scanned document. Processing may be slower and less accurate."

3. **Provide quality guidance:**
   - "For best results, use PDFs with selectable text"
   - "Scanned documents work better at 300 DPI or higher"
   - "Handwritten content may not be recognized accurately"

4. **Offer manual override:**
   - If OCR/vision fails, let teacher type content
   - Save typed content for reuse
   - Don't force multi-minute waits before manual option

**Phase recommendation:** Address in Document Parsing phase. Prefer multimodal over OCR.

**Confidence:** HIGH - Based on [Tesseract documentation](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html), [PyTesseract guide](https://www.extend.ai/resources/pytesseract-guide-ocr-limits-alternatives)

---

### Pitfall 8: Multi-Provider AI Inconsistency

**What goes wrong:** Enhancement results differ dramatically between Gemini and Claude. Teachers get inconsistent experiences depending on which provider is configured. Prompts optimized for one model produce poor results on another.

**Why it happens:** LLMs have different:
- Training data and knowledge cutoffs
- Instruction-following characteristics
- Output formatting preferences
- Handling of constraints and rules

From [Glean document understanding comparison](https://www.glean.com/perspectives/which-ai-models-truly-excel-at-document-understanding): "Benchmarks like MMLU and HumanEval show both Claude and Gemini are top-tier, but Claude tends to produce more careful, grounded answers, while Gemini excels in multimodal reasoning."

**Prevention:**

1. **Create provider-specific prompts:**
   ```typescript
   const ENHANCEMENT_PROMPTS = {
     gemini: `[Gemini-optimized prompt with specific formatting]`,
     claude: `[Claude-optimized prompt with XML tags]`,
     openai: `[OpenAI-optimized prompt]`
   };
   ```

2. **Normalize output format:**
   - Define strict JSON schema for enhancement output
   - Post-process to consistent format regardless of provider
   - Validate output meets schema before displaying

3. **Test all providers for each feature:**
   - Don't ship features tested only on one provider
   - Create test suite of sample documents
   - Track accuracy/quality metrics per provider

4. **Consider provider recommendations:**
   - "For worksheet enhancement, we recommend Gemini (best vision)"
   - Document which features work best with which provider
   - Default to provider with best results for feature

**Phase recommendation:** Address in AI Integration phase. Test across providers throughout.

**Confidence:** MEDIUM - Based on [AI Free API Gemini analysis](https://www.aifreeapi.com/en/posts/gemini3-multimodal-vision-limitations), [Koncile invoice comparison](https://www.koncile.ai/en/ressources/claude-gpt-or-gemini-which-is-the-best-llm-for-invoice-extraction)

---

### Pitfall 9: Context Window Exhaustion on Long Documents

**What goes wrong:** Teacher uploads a comprehensive unit plan (20+ pages). The document plus prompt exceeds the AI's context window. Processing fails with cryptic error, or only part of the document is enhanced.

**Why it happens:** Even large context windows (1M+ tokens for Gemini) can be exhausted by:
- Multiple page images (each image consumes significant tokens)
- Long text content from multi-page documents
- Detailed prompts with examples
- Request for structured output format

**Prevention:**

1. **Calculate token usage before sending:**
   ```typescript
   function estimateTokenUsage(
     text: string,
     imageCount: number,
     promptLength: number
   ): { estimated: number; limit: number; willExceed: boolean } {
     const textTokens = Math.ceil(text.length / 4);
     const imageTokens = imageCount * 765; // ~765 tokens per image for Gemini
     const total = textTokens + imageTokens + promptLength;
     return {
       estimated: total,
       limit: 128000, // Conservative limit
       willExceed: total > 128000
     };
   }
   ```

2. **Chunk large documents:**
   - Process in sections that fit context window
   - Maintain continuity context between chunks
   - Merge results with deduplication

3. **Prioritize content for limited context:**
   - Text over images when context is tight
   - Key pages over supplementary pages
   - Ask teacher to identify priority sections

4. **Show usage feedback:**
   - "Using 45% of AI capacity for this document"
   - "Large document - processing in 3 parts"

**Phase recommendation:** Address in AI Integration phase. Build chunking logic early.

**Confidence:** MEDIUM - Based on [Gemini documentation](https://ai.google.dev/gemini-api/docs/image-understanding)

---

### Pitfall 10: Enhancement Takes Too Long Without Feedback

**What goes wrong:** AI enhancement takes 15-30 seconds. UI shows spinner with no information. Teacher doesn't know if it's working, how long to wait, or if they should cancel. They close the tab or click buttons repeatedly, creating duplicate requests.

**Why it happens:** AI processing is genuinely slow, especially with:
- Multiple images for multimodal analysis
- Long documents requiring extensive generation
- Rate limiting causing retries
- Cold starts on provider APIs

**Prevention:**

1. **Show meaningful progress indicators:**
   ```typescript
   const ENHANCEMENT_STAGES = [
     { stage: 'parsing', message: 'Reading your document...' },
     { stage: 'analyzing', message: 'Understanding the content...' },
     { stage: 'enhancing', message: 'Creating improvements...' },
     { stage: 'formatting', message: 'Preparing your enhanced worksheet...' }
   ];
   ```

2. **Provide time estimates:**
   - "This usually takes 10-15 seconds"
   - "Processing page 2 of 5..."
   - Show elapsed time with expected completion

3. **Enable cancellation:**
   - Clear "Cancel" button always visible
   - Immediate response to cancel
   - Partial results available if cancelled mid-process

4. **Prevent duplicate submissions:**
   - Disable submit button during processing
   - Show clear "processing" state
   - Queue additional requests instead of duplicating

5. **Consider streaming for long responses:**
   - Show enhancement results as they generate
   - Teacher sees progress in real-time
   - Can start reviewing before completion

**Phase recommendation:** Address in UI/UX phase. Build progress system before AI integration.

**Confidence:** HIGH - Based on general UX principles and Cue's existing patterns

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable without major rework.

---

### Pitfall 11: Filename Collisions on Enhanced Documents

**What goes wrong:** Teacher enhances "worksheet.pdf" multiple times. Each enhancement overwrites the previous. Or naming becomes confusing: "worksheet.pdf", "worksheet-enhanced.pdf", "worksheet-enhanced-1.pdf", etc.

**Prevention:**
- Use timestamps in filenames: "worksheet-enhanced-20260129-1430.pdf"
- Store version history with metadata
- Enable "Save as new" vs "Update existing" choice

**Phase recommendation:** Address in Save/Export phase.

---

### Pitfall 12: Enhancement Doesn't Match Lesson Context

**What goes wrong:** AI enhances worksheet without knowing the broader lesson context. A worksheet for 3rd graders gets vocabulary appropriate for high school. A review worksheet gets elaboration that belongs in the initial lesson.

**Prevention:**
- Pass lesson context (from Cue's existing lesson data) to enhancement prompt
- Allow teacher to specify grade level, subject, lesson phase
- Use existing slides/resources as context for tone and vocabulary

**Phase recommendation:** Address in AI Integration phase. Leverage Cue's lesson context.

---

### Pitfall 13: Images in Documents Handled Incorrectly

**What goes wrong:** Worksheet has images (diagrams, photos, clipart). After enhancement, images are:
- Missing entirely
- Replaced with descriptions
- Disconnected from their captions
- In wrong positions relative to text

**Prevention:**
- Detect images and warn about limitations
- Preserve image references in output
- Use "leave images unchanged" as default
- Consider image-in-image enhancement (annotate original)

**Phase recommendation:** Address in Output Formatting phase.

---

## Integration Pitfalls (Cue-Specific)

---

### Pitfall 14: Enhancement Conflicts with Existing Cue Workflow

**What goes wrong:** AI resource enhancement works standalone but doesn't integrate with Cue's existing features. Enhanced worksheets can't be added to Resource Hub. Enhancement results don't persist with saved presentations. Teachers must manage two separate workflows.

**Prevention:**

1. **Design for Resource Hub integration from start:**
   - Enhanced worksheets become `LessonResource` objects
   - Same save/load system as other resources
   - Accessible from existing Resource Hub UI

2. **Connect to lesson context:**
   - Enhancement uses current slides for context
   - Results appear in appropriate section of lesson
   - Consistent with Cue's information architecture

3. **Use existing patterns:**
   - Same modal/overlay patterns as other Cue features
   - Same error handling and messaging
   - Same AI provider infrastructure

**Phase recommendation:** Address in Architecture phase. Define integration points before building.

---

### Pitfall 15: Enhancement State Lost on Navigation

**What goes wrong:** Teacher starts enhancement, navigates away (to check slides, open settings), comes back - enhancement state is lost. Partially completed enhancements aren't recoverable.

**Prevention:**
- Store enhancement state in React state or local storage
- Warn before navigating away during enhancement
- Auto-save enhancement progress
- Use Cue's existing auto-save patterns

**Phase recommendation:** Address in State Management phase. Extend existing auto-save.

---

## Phase-Specific Warning Summary

| Phase | Highest-Risk Pitfall | Mitigation Priority |
|-------|---------------------|---------------------|
| Document Parsing | Complex layouts fail silently | Complexity detection + multimodal fallback |
| AI Enhancement | Hallucinations corrupt facts | Preserve mode + diff review UI |
| Output Formatting | Layout reconstruction loses structure | Image-to-image + format templates |
| File Handling | Large documents crash browser | Size limits + chunked processing |
| UI/UX | Teachers don't trust invisible changes | Mandatory change review |
| AI Integration | Provider inconsistency | Provider-specific prompts + normalization |
| Architecture | Conflicts with Cue workflow | Resource Hub integration from start |

---

## Research Questions for Phase-Specific Deep Dives

The following questions should be investigated during their respective phases:

1. **Document Parsing:** What's the optimal balance between text extraction and multimodal image analysis? Should we always send images, or only for complex documents?

2. **AI Enhancement:** What prompt patterns best prevent hallucinations while still providing useful enhancements? Should we use chain-of-thought verification?

3. **Output Formatting:** Can we preserve layout by generating HTML/CSS rather than plain text? What rendering approach works for print fidelity?

4. **Teacher Trust:** What level of change transparency is optimal? Too much overwhelms, too little undermines trust.

---

## Sources

### Document Parsing
- [Nutrient.io: Complete Guide to PDF.js](https://www.nutrient.io/blog/complete-guide-to-pdfjs/)
- [ComPDFKit: What's So Hard About PDF Text Extraction](https://www.compdf.com/blog/what-is-so-hard-about-pdf-text-extraction)
- [Gary Sieling: Extracting Tables from PDFs with PDF.js](https://www.garysieling.com/blog/extracting-tables-from-pdfs-in-javascript-with-pdf-js/)
- [mammoth.js GitHub Repository](https://github.com/mwilliamson/mammoth.js)

### AI Accuracy and Hallucinations
- [OpenAI: Why Language Models Hallucinate](https://openai.com/index/why-language-models-hallucinate/)
- [MIT Sloan: Addressing AI Hallucinations and Bias](https://mitsloanedtech.mit.edu/ai/basics/addressing-ai-hallucinations-and-bias/)
- [Faculty Focus: Mitigating Hallucinations in LLMs](https://www.facultyfocus.com/articles/teaching-with-technology-articles/mitigating-hallucinations-in-llms-for-community-college-classrooms-strategies-to-ensure-reliable-and-trustworthy-ai-powered-learning-tools/)
- [Nature: Detecting Hallucinations Using Semantic Entropy](https://www.nature.com/articles/s41586-024-07421-0)

### Multimodal AI
- [AI Free API: Gemini 3 Multimodal Vision Limitations](https://www.aifreeapi.com/en/posts/gemini3-multimodal-vision-limitations)
- [Koncile: Claude vs GPT vs Gemini for Invoice Extraction](https://www.koncile.ai/en/ressources/claude-gpt-or-gemini-which-is-the-best-llm-for-invoice-extraction)
- [Glean: Which AI Models Excel at Document Understanding](https://www.glean.com/perspectives/which-ai-models-truly-excel-at-document-understanding)
- [Google: Image Understanding with Gemini](https://ai.google.dev/gemini-api/docs/image-understanding)

### OCR and Layout
- [Tesseract Documentation: Improving Quality](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)
- [Koncile: Is Tesseract Still the Best Open-Source OCR](https://www.koncile.ai/en/ressources/is-tesseract-still-the-best-open-source-ocr)
- [Mistral AI: OCR 3 Introduction](https://mistral.ai/news/mistral-ocr-3)
- [SmolDocling AI: Document Conversion Tool](https://smoldoclingai.org)

### Teacher Trust and AI in Education
- [Michigan Virtual: AI in Education 2025 Snapshot](https://michiganvirtual.org/research/publications/ai-in-education-a-2025-snapshot-of-trust-use-and-emerging-practices/)
- [US Dept of Education: AI and Teaching](https://www.ed.gov/sites/ed/files/documents/ai-report/ai-report.pdf)
- [ScienceDirect: Trust in AI-Powered Educational Technology](https://www.sciencedirect.com/science/article/pii/S2666920X25000086)
- [ACM FAccT: Responsible AI in Education](https://dl.acm.org/doi/10.1145/3715275.3732176)

### Browser Limitations
- [MDN: Storage Quotas and Eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [Medium: Chunked File Loading in JavaScript](https://medium.com/@kurnosovnikita/dont-let-large-files-freeze-your-web-app-chunked-file-loading-in-javascript-efa566e21081)
- [Sense/Net: Challenges of Large Files in Web Applications](https://www.sensenet.com/en/blog/posts/5-challenges-of-handling-extremely-large-files-in-web-applications)

---

*Pitfalls research: 2026-01-29*
