# Feature Landscape: AI Resource Enhancement (v3.7)

**Project:** Cue - Teacher Presentation Tool
**Domain:** AI-powered worksheet/resource enhancement for K-12 teachers
**Researched:** 2026-01-29
**Confidence:** MEDIUM (based on competitor analysis and educational technology patterns)

---

## Executive Summary

AI resource enhancement in education follows a consistent pattern: teachers upload existing materials, AI adapts them while preserving intent, and outputs are differentiated for student needs. The market leaders (Diffit, MagicSchool, Eduaide.ai) focus on three core capabilities: **text leveling/differentiation**, **format transformation**, and **standards alignment**. Cue's unique advantage is **lesson context awareness**—the AI can align enhanced resources with the adapted presentation, creating cohesive lesson materials rather than isolated worksheets.

---

## Table Stakes

Features teachers expect. Missing = product feels incomplete or unusable.

| Feature | Why Expected | Complexity | Cue Dependencies | Notes |
|---------|--------------|------------|------------------|-------|
| Multi-format upload (PDF, image, Word/Docs) | Teachers have resources in various formats; excluding any major format blocks adoption | MEDIUM | Existing PDF parsing infrastructure | PDF.js already handles lesson plans; extend for general documents |
| Preview before enhancement | Teachers must see what AI will work with before committing | LOW | None | Critical for trust—teacher sees extracted content/image |
| Original intent preservation | Teachers chose this resource for a reason; AI shouldn't rewrite from scratch | HIGH | AI prompting | Most common complaint about AI tools—over-generation |
| Differentiation output (2-3 versions) | Universal design principle; every classroom has mixed abilities | MEDIUM | Verbosity infrastructure | Reuse existing concise/standard/detailed pattern |
| Print-ready PDF export | Resources must be usable immediately; teachers print daily | LOW | Working Wall export infrastructure | jsPDF/html2canvas already proven |
| Editable output | Teachers always want to tweak AI results | MEDIUM | None | Not just preview—actual editing capability |
| Cancel/regenerate | AI output won't always match expectations | LOW | Existing regenerate patterns | "Try again" is expected in any AI tool |

### Table Stakes Details

#### Multi-format Upload

**What teachers expect:**
- Drag-and-drop or click-to-upload
- Accept PDF, PNG, JPG, JPEG, DOCX, Google Docs link
- Clear visual feedback when file accepted
- Error message if format unsupported

**Competitor behavior:**
- Diffit: PDF, text paste, URL, YouTube video
- MagicSchool: Text paste primarily, some file upload
- Canva: Full document import with format preservation
- Eduaide.ai: Topic, article, URL, or document upload

**Cue approach:** PDF + image is minimum viable; Word/Docs is stretch goal. Focus on image upload (photo of worksheet) as primary use case since teachers often have physical resources.

#### Original Intent Preservation

**Critical differentiator between useful and annoying AI.**

Teachers report frustration when AI:
- Rewrites content entirely instead of enhancing
- Adds content not in original
- Changes the learning objective
- Removes key elements teacher deliberately included

**What preservation means:**
- Keep same questions/activities, improve clarity
- Keep same learning objective, improve scaffolding
- Keep same content, improve visual hierarchy
- Add differentiation WITHOUT changing core content

**Implementation:** AI prompt must emphasize "enhance and preserve" not "recreate."

#### Differentiation Output

**Universal expectation in 2025-2026 educational AI.**

Every teacher serves students at different levels. The standard pattern is 3 levels:
- **Simplified/Scaffold** (ELL, SEN, struggling readers): Reduced text complexity, visual supports, sentence starters
- **Standard** (grade-level): Original content with enhanced clarity
- **Extended/Challenge** (advanced): Additional depth, open-ended questions

**Competitor implementations:**
- Diffit: Reading level selector (grades 2-11+, Lexile)
- MagicSchool: Text leveler tool, assignment scaffolder
- Eduaide.ai: One-click differentiation button
- Canva: Magic Write rewords for different reading levels

**Cue advantage:** Already has verbosity system (concise/standard/detailed) for teleprompter. Resource differentiation can reuse this UX pattern.

---

## Differentiators

Features that set Cue apart. Not expected, but high value when present.

| Feature | Value Proposition | Complexity | Cue Dependencies | Notes |
|---------|-------------------|------------|------------------|-------|
| Lesson context awareness | Enhanced resource aligns with adapted lesson content | MEDIUM | Existing lesson state | UNIQUE: No competitor does this |
| Content alignment suggestions | AI suggests how resource connects to current slide | MEDIUM | Slide context | "This worksheet supports slide 3's learning objective" |
| Visual clarity enhancement | Improve layout, spacing, hierarchy of existing resource | HIGH | Image processing | Beyond text—actual visual design improvement |
| Answer key generation | Automatically create teacher answer version | LOW | AI prompting | Common ask, easy win |
| Per-slide resource linking | Resources appear contextually with relevant slides | LOW | Slide/resource association | Presentation flow integration |
| Batch differentiation | Create all 3 levels at once | MEDIUM | Parallel AI calls | Time saver vs. one-at-a-time |
| Resource library persistence | Save enhanced resources for future lessons | LOW | .cue file format | Already planning this |

### Differentiator Details

#### Lesson Context Awareness (PRIMARY DIFFERENTIATOR)

**What makes this unique:**

Current tools (Diffit, MagicSchool, Eduaide) enhance resources in isolation. They don't know:
- What lesson is being taught
- What age/grade the students are
- What content came before/after in the lesson
- What vocabulary has been introduced

**Cue's advantage:** The teacher already uploaded a lesson plan and generated slides. The AI has full context:
- Topic and learning objectives
- Grade level and student age
- Vocabulary and key terms from slides
- Content flow and progression

**Implementation:**
```
When enhancing resource, include in prompt:
- Current lesson topic
- Grade level
- Key vocabulary from slides
- Learning objectives
- Slide content for alignment suggestions
```

**Teacher benefit:** "The worksheet now uses the same vocabulary as my presentation" instead of generic enhancement.

#### Visual Clarity Enhancement

**Beyond text-only enhancement.**

Teachers often upload:
- Scanned worksheets (grainy, tilted)
- Screenshots from other resources
- Photos of textbook pages
- Hand-drawn diagrams

**Enhancement opportunities:**
- Improve text readability
- Straighten/deskew scanned images
- Enhance contrast
- Improve layout spacing
- Add visual hierarchy (headers, sections)

**Complexity reality check:** Full image enhancement requires vision AI capabilities. For v3.7 MVP, focus on:
- Text extraction and reformatting (achievable)
- Layout suggestions via structured prompts (achievable)
- Actual image manipulation (defer to v4.0+)

#### Answer Key Generation

**Common teacher request, easy implementation.**

Pattern:
1. AI identifies questions in resource
2. Generates answers based on lesson content
3. Creates "Teacher Version" with answers shown

**Already solved:** MagicSchool and Eduaide both offer this. Standard capability.

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full resource recreation | Destroys original intent; teachers feel replaced | Enhance existing content, preserve structure |
| Automatic standards tagging | Scope creep; complex and often wrong | Let teachers specify standards if needed |
| Real-time student interaction | Out of scope; changes product category | Stay focused on resource preparation, not delivery |
| Cloud resource library | Requires auth, storage, sync infrastructure | Local-first with .cue file persistence |
| AI-generated images for resources | Distraction from core value; quality inconsistent | Use existing images, improve layout/text only |
| Gamification of resources | Scope creep; different product category | Resources are print materials, not interactive games |
| Plagiarism/originality checking | Scope creep; complex, contentious | Out of scope—trust teacher |
| Complex formatting (tables, multi-column) | High complexity, fragile | Start with simple layouts, add complexity later |

### Anti-Feature Details

#### Full Resource Recreation

**The #1 mistake in educational AI tools.**

Teachers report (from research on AI tool frustrations):
- "It rewrote my entire worksheet instead of improving it"
- "I lost the specific examples I had chosen"
- "It changed my questions to something generic"

**Why it happens:** AI tools default to "generation" mode, not "enhancement" mode.

**How to avoid:**
- Explicit prompt engineering: "Preserve all original content, questions, and structure"
- Show diff/comparison: "Here's what changed"
- Allow selective enhancement: "Improve section 2 only"

#### Automatic Standards Tagging

**Tempting but problematic.**

Why it seems like a good idea:
- Teachers need standards alignment
- AI can match content to standards
- Other tools advertise this feature

Why to avoid for Cue:
- Standards vary by state/country/school
- Incorrect tagging is worse than no tagging
- Adds significant complexity
- Teacher still has to verify anyway

**Better approach:** Let teacher specify standards if they want, don't auto-detect.

#### AI-Generated Images for Resources

**Distraction from core value.**

Why to avoid:
- Image generation is unreliable for educational accuracy
- Adds cost (image APIs expensive)
- Quality varies wildly
- Teachers have images they want to use
- Focus should be on text/layout enhancement

**Exception:** If teacher explicitly asks "add an illustration of X," that's different. But don't auto-generate.

---

## Feature Dependencies

```
Upload Infrastructure
    |
    v
Content Extraction (PDF parsing / OCR / text extraction)
    |
    v
Preview & Confirmation
    |
    v
Enhancement Selection (differentiation level, enhancement options)
    |
    +------------------+
    |                  |
    v                  v
AI Enhancement    Lesson Context Injection
    |                  |
    +------------------+
    |
    v
Output Generation (differentiated versions)
    |
    v
Preview & Edit
    |
    v
Export (PDF) + Persist (.cue file)
```

### Existing Cue Infrastructure to Leverage

| Existing Feature | How It Supports v3.7 |
|------------------|----------------------|
| PDF.js integration | Document parsing for uploaded PDFs |
| Working Wall export | PDF generation infrastructure |
| Verbosity system | Differentiation UX pattern |
| AI provider abstraction | Gemini/Claude for enhancement |
| Lesson state | Context for lesson-aware enhancement |
| .cue file format | Resource persistence structure |
| Slide context in AI prompts | Pattern for including lesson context |

---

## MVP Recommendation

For v3.7 MVP, prioritize:

### Must Have (Week 1-2)
1. **Image upload** - Photo of worksheet (PNG, JPG)
2. **PDF upload** - Digital worksheets
3. **Text extraction preview** - Show what AI sees
4. **Basic enhancement** - Improve clarity, fix formatting
5. **Differentiation** - Simple/Standard/Detailed versions
6. **PDF export** - Print-ready output
7. **Lesson context injection** - Use topic, grade from lesson

### Should Have (Week 3)
8. **In-app editing** - Tweak AI output before export
9. **Regenerate** - Try again with different approach
10. **Resource persistence** - Save in .cue file
11. **Answer key generation** - Teacher version with answers

### Defer to Post-MVP
- Word/Docs upload (requires additional parsing)
- Visual layout enhancement (complex image processing)
- Per-slide resource linking (UX complexity)
- Batch operations (multi-resource enhancement)

---

## Competitive Landscape Summary

| Tool | Primary Strength | Weakness vs. Cue |
|------|------------------|------------------|
| [Diffit](https://web.diffit.me) | Reading level adaptation, one-click leveling | No lesson context, standalone tool |
| [MagicSchool](https://www.magicschool.ai) | 80+ tools, comprehensive suite | No lesson context, overwhelming options |
| [Eduaide.ai](https://www.eduaide.ai) | Deep differentiation, scaffolding tools | No lesson context, subscription required |
| [Canva for Education](https://www.canva.com/education/) | Visual design, templates | Not education-first, no differentiation |
| [Nearpod](https://nearpod.com) | Interactive delivery | Not resource enhancement, delivery focused |

**Cue's positioning:** "Enhance resources that align with your adapted lesson" vs. competitors' "Enhance resources in isolation."

---

## Sources

- [MagicSchool Teacher Tools](https://www.magicschool.ai/magic-tools) - Feature survey
- [Diffit for Teachers](https://web.diffit.me) - Differentiation patterns
- [Eduaide Content Generator](https://www.eduaide.ai/solutions/content-generator) - Enhancement workflows
- [Canva AI for Teachers](https://www.canva.com/ai-for-teachers/) - Visual enhancement patterns
- [Nearpod Back to School 2025](https://nearpod.com/blog/updates-back-to-school-2025/) - AI feature trends
- [7 Best AI Worksheet Generator Tools](https://monsha.ai/blog/7-best-ai-worksheet-generator-tools-for-teachers) - Competitor analysis
- [AI Tools for Teachers 2025](https://www.chiangraitimes.com/ai/ai-tools-for-teachers-in-2025/) - Differentiation expectations
- [Differentiated Instruction Strategies](https://www.prodigygame.com/main-en/blog/differentiated-instruction-strategies-examples-download) - Pedagogical patterns
- [Truth For Teachers - AI for Differentiation](https://truthforteachers.com/truth-for-teachers-podcast/ai-for-scaffolds-supports-and-differentiated-tasks/) - Teacher workflow expectations
- [EdWeek - AI in Schools Downsides](https://www.edweek.org/technology/rising-use-of-ai-in-schools-comes-with-big-downsides-for-students/2025/10) - Problem patterns to avoid

---

## Confidence Notes

| Area | Confidence | Rationale |
|------|------------|-----------|
| Table stakes features | HIGH | Consistent across all competitors, well-documented expectations |
| Differentiation patterns | HIGH | Universal in educational AI, well-established UX |
| Lesson context advantage | MEDIUM | Novel approach, no direct competitor validation |
| Visual enhancement complexity | LOW | Requires deeper technical research for v4.0 |
| Anti-features | HIGH | Documented complaints and failed patterns |

---

*Research completed: 2026-01-29*
