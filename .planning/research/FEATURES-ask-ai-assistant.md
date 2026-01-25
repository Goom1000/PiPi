# Feature Landscape: In-Presentation AI Assistant

**Domain:** In-app AI assistant for presentation/teaching tools
**Researched:** 2026-01-26
**Confidence:** HIGH (cross-verified with multiple sources and existing codebase patterns)

---

## Executive Summary

In-presentation AI assistants follow established patterns from tools like Microsoft Copilot, Khanmigo, and modern chatbot UX research. The key differentiator for Cue is **context-awareness** combined with **teacher-specific constraints**: the assistant operates within an existing teleprompter panel, has access to lesson/slide context, and must remain invisible to students while being instantly accessible to teachers.

The feature landscape divides into:
- **Table Stakes:** What teachers expect from any AI help feature
- **Differentiators:** What makes Cue's assistant uniquely valuable
- **Anti-Features:** Common patterns that would hurt the teaching experience

---

## Table Stakes

Features users expect. Missing these makes the product feel incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Text input field** | Core interaction method for AI chat | Low | Standard text input, send button |
| **Streaming responses** | All modern AI tools show text appearing progressively | Medium | Smooth character-by-character animation (not chunky). 5ms/char is optimal per Upstash research |
| **Loading/thinking indicator** | Users need feedback that AI is processing | Low | Animated indicator while waiting for stream start |
| **Response history** | See previous Q&A without re-asking | Low | Scrollable list within session; no cross-session persistence needed |
| **Copy to clipboard** | Quick transfer of AI answer to other contexts | Low | Simple "Copy" button; show "Copied" feedback (NOT "Copied to clipboard" - causes confusion per UX research) |
| **Clear/dismiss action** | Close the assistant panel when done | Low | X button or click-outside to close |
| **Error handling with retry** | AI calls fail; users need recovery path | Low | Inline error message with "Try again" button |
| **Keyboard shortcut to open** | Teachers' hands are often occupied; quick access essential | Low | Single shortcut (e.g., Cmd/Ctrl+K or `?`) to toggle panel |

### UX Pattern: Streaming Animation

**Critical:** Smooth streaming significantly improves perceived speed and engagement. Per research from Upstash and patterns.dev:

```
Token arrives from API -> Buffer -> Render at consistent pace (5ms/char)
```

This prevents "chunky" text appearance that feels robotic. Use `requestAnimationFrame` for smooth animation synchronized to display refresh rate.

### UX Pattern: Loading States

Per Cloudscape Design System research:
- If processing < 1 second: Skip loading state, start streaming directly
- If processing >= 1 second: Show "Thinking..." indicator
- Use contextual messages when possible: "Finding facts about tiger diets..."

---

## Differentiators

Features that set Cue apart. Not universally expected, but highly valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Lesson context injection** | AI knows current slide, teleprompter content, lesson topic | Medium | Build context string from current slide title, content, speakerNotes |
| **Quick action buttons** | Preset prompts for common teacher needs | Low | "Get 3 facts", "Explain simply", "Answer student question" |
| **Response verbosity control** | Match existing Concise/Standard/Detailed pattern | Low | Leverage existing `VerbosityLevel` type |
| **Teleprompter integration** | Panel appears within teacher's existing workflow, not separate modal | Medium | Slide-in panel adjacent to teleprompter, not overlay |
| **Student-question mode** | "A student asked: [X]. Help me answer." with age-appropriate framing | Low | Preset template that includes grade level context |
| **Teacher-only visibility** | Panel only shows on teacher screen, never synced to student view | Low | Exclude from `BroadcastChannel` state sync (existing pattern) |
| **Keyboard-first navigation** | Tab through suggestions, Enter to select, Escape to close | Low | Accessibility best practice that also helps speed |
| **Inline quick facts** | Response shows in a clean, scannable format (bullets, bold key terms) | Low | Markdown parsing (already have `MarkdownText` component) |

### Quick Action Buttons (Recommended Set)

Research from NN/g and ShapeofAI confirms preset prompts significantly reduce friction. Recommended initial set:

1. **"Get 3 quick facts"** - Most common teacher need during lessons
2. **"Explain for [grade level]"** - Age-appropriate simplification
3. **"Answer: [student's question]"** - Pre-framed student question mode
4. **"Give me an example"** - Concrete illustrations for abstract concepts
5. **"Quick definition"** - Dictionary-style lookup

These should appear as clickable pills below the input field (ChatGPT-style) or as a dropdown menu.

### Context Injection Strategy

Leverage existing `buildSlideContext` utility from `aiProvider.ts`. Context should include:

```typescript
// Example context structure for AI assistant
{
  currentSlide: {
    title: "Tiger Habitats",
    content: ["Live in Asia", "Prefer forests", "Solitary animals"],
    speakerNotes: "Mention that tigers are endangered..."
  },
  lessonTopic: "Animals of Asia",
  gradeLevel: "Year 6",
  questionType: "student-question" | "fact-lookup" | "explanation"
}
```

### Teleprompter Integration Options

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Slide-in panel** (from right) | Non-blocking, keeps teleprompter visible | Requires screen space | **Recommended** for desktop |
| **Modal overlay** | Focused attention, simple implementation | Blocks teleprompter view | Backup for narrow screens |
| **Inline expansion** | Seamless, no context switch | Displaces existing content | Not recommended |
| **Bottom drawer** | Mobile-friendly pattern | Unfamiliar for desktop users | Future mobile consideration |

Per UX Collective research, sidepanel with contextual awareness is the dominant pattern for AI copilots in 2026. The key is maintaining visibility of the original content (teleprompter) while interacting with AI.

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Auto-suggest interruptions** | Breaks teaching flow; teachers need control | Passive availability (icon/shortcut), never popup unsolicited |
| **Conversation persistence across sessions** | Adds complexity; teachers want fresh context each presentation | Session-only history; clear on presentation exit |
| **Voice input (Phase 1)** | Classroom noise makes speech recognition unreliable; adds significant complexity | Text-only initially; voice is Phase 2+ if requested |
| **Student-visible AI** | Undermines teacher authority; students should see teacher as knowledge source | Strict teacher-only visibility; no BroadcastChannel sync |
| **Full-screen chat mode** | Loses presentation context; teachers need slide visibility | Always partial-screen panel; never fullscreen |
| **Multi-turn deep conversations** | Teachers need quick answers, not dialogues; classroom time is precious | Optimize for single-turn Q&A; history is for reference only |
| **AI editing teleprompter directly** | High-risk; accidental changes during presentation | Read-only AI; copy-to-clipboard for manual paste |
| **Complex settings/customization** | Teachers won't configure mid-presentation | Sensible defaults; inherit verbosity from deck settings |
| **Typing animation on teacher input** | Unnecessary for sent messages | Only animate AI responses |

### Why No Voice Input Initially

Merlyn and Socrait demonstrate voice AI in classrooms, but they have dedicated hardware/software optimizations. For a browser-based client-side app:
- Browser speech recognition is inconsistent
- Classroom acoustics (echo, multiple voices) degrade accuracy
- Implementation complexity is high for marginal benefit
- Text input is faster for short queries teachers typically need

Voice can be a future enhancement after core text-based assistant is validated.

### Why No AI Editing

Per research on trust in AI assistants, users need "preview, explanation, and easy undo" for any AI action. During live presentation:
- Teleprompter text is actively being read
- Accidental changes would disrupt teaching
- Copy-to-clipboard + manual paste is sufficient and safe

---

## Feature Dependencies

```
[Keyboard shortcut] --> [Panel toggle] --> [Input field]
                                       --> [Quick actions]
                                       --> [History view]

[User query] --> [Context injection] --> [AI API call]
             --> [Verbosity setting]
                                     --> [Streaming response]
                                     --> [Copy button]

[AI Provider interface] (existing) --> [Ask AI feature]
[VerbosityLevel type] (existing) --> [Response verbosity]
[MarkdownText component] (existing) --> [Response rendering]
```

Key dependency: **AI Provider must be configured** - Existing `onRequestAI` pattern handles this gracefully.

---

## MVP Recommendation

For MVP, prioritize:

### Must Have (Phase 1)
1. **Text input with keyboard shortcut** - Core interaction
2. **Lesson context injection** - Differentiating value
3. **Streaming responses with smooth animation** - Expected baseline
4. **3-4 quick action buttons** - Reduces friction
5. **Copy to clipboard** - Practical utility
6. **Teacher-only visibility** - Critical constraint

### Defer to Post-MVP
- **Response verbosity toggle** - Can inherit deck setting initially
- **Session history scrollback** - Nice-to-have, not critical for quick lookups
- **Custom quick actions** - Teachers will use defaults initially
- **Voice input** - High complexity, uncertain value
- **Rich media in responses** - Plain text/markdown sufficient

### Implementation Priority

| Priority | Feature | Rationale |
|----------|---------|-----------|
| P0 | Panel UI (slide-in from right) | Container for all other features |
| P0 | Text input + send | Core interaction |
| P0 | Context injection | Differentiating value |
| P0 | Streaming response display | User experience baseline |
| P1 | Quick action buttons | Friction reduction |
| P1 | Copy to clipboard | Practical utility |
| P1 | Keyboard shortcut | Quick access |
| P2 | Session history | Reference previous answers |
| P2 | Verbosity toggle | Fine control |

---

## UX Patterns Summary

### Panel Behavior
- **Open:** Keyboard shortcut (Cmd/Ctrl+K or ?) or click icon in teleprompter area
- **Close:** Escape key, click outside, or explicit X button
- **Position:** Right side slide-in, 300-400px width
- **State:** Session-only, no persistence

### Input Area
- **Location:** Bottom of panel (familiar chat pattern)
- **Elements:** Text input, send button, quick action pills above
- **Focus:** Auto-focus when panel opens

### Response Area
- **Scrollable:** Yes, for longer responses
- **Formatting:** Markdown rendered (bold, bullets, code)
- **Animation:** Smooth character-by-character (5ms/char)

### Error States
- **API error:** Inline message with "Try again" button
- **No AI configured:** "Enable AI" link (existing pattern)
- **Rate limit:** "Please wait a moment" with countdown if available

### Accessibility
- Full keyboard navigation (Tab, Enter, Escape)
- Focus trap within panel when open
- Screen reader announcements for new responses
- High contrast text for readability

---

## Sources

### AI Copilot UX Patterns
- [Where should AI sit in your UI?](https://uxdesign.cc/where-should-ai-sit-in-your-ui-1710a258390e) - UX Collective
- [Designing for AI Assistants](https://medium.com/@eleana_gkogka/designing-for-ai-assistants-solving-key-challenges-through-ui-ux-e869358d048c) - Medium
- [How to Design an AI Assistant That Actually Helps](https://medium.muz.li/how-to-design-an-ai-assistant-users-actually-use-81b0fc7dc0ec) - Muzli

### Streaming & Animation
- [Smooth Text Streaming in AI SDK v5](https://upstash.com/blog/smooth-streaming) - Upstash
- [AI UI Patterns](https://www.patterns.dev/react/ai-ui-patterns/) - Patterns.dev
- [Generative AI Loading States](https://cloudscape.design/patterns/genai/genai-loading-states/) - Cloudscape Design System

### Prompt Suggestions & Quick Actions
- [Designing Use-Case Prompt Suggestions](https://www.nngroup.com/articles/designing-use-case-prompt-suggestions/) - NN/g
- [Inline Action Pattern](https://www.shapeof.ai/patterns/inline-action) - ShapeofAI
- [Prompt Augmentation UX Patterns](https://jakobnielsenphd.substack.com/p/prompt-augmentation) - Jakob Nielsen

### Education AI Tools
- [Khanmigo](https://www.khanmigo.ai/) - Khan Academy's AI teaching assistant
- [SchoolAI](https://schoolai.com/) - AI platform for teachers
- [Merlyn](https://www.merlyn.org/) - Voice AI for classrooms
- [Brisk Teaching](https://www.briskteaching.com/) - AI tools for educators

### Presentation Software
- [Copilot in PowerPoint](https://support.microsoft.com/en-us/office/create-a-new-presentation-with-copilot-in-powerpoint-3222ee03-f5a4-4d27-8642-9c387ab4854d) - Microsoft Support
- [Google Slides AI vs PowerPoint Copilot](https://skywork.ai/blog/google-slides-ai-vs-powerpoint-copilot-2025-comparison/) - Skywork

### Chatbot UI & Accessibility
- [Chatbot UI Examples](https://sendbird.com/blog/chatbot-ui) - Sendbird
- [Making Chatbots Accessible](https://medium.com/globant/making-chatbots-accessible-6cce73904927) - Globant
- [7 UX/UI Rules for Conversational AI](https://www.willowtreeapps.com/insights/willowtrees-7-ux-ui-rules-for-designing-a-conversational-ai-assistant) - WillowTree

### Copy to Clipboard UX
- [UX Study: Copy to Clipboard](https://flaming.codes/posts/ux-study-copy-to-clipboard-action-web-api) - Flaming Codes
