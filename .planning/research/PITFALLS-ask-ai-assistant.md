# Pitfalls Research: Ask AI In-Presentation Assistant

**Domain:** Live AI chat assistant for presentation/teaching tools
**Researched:** 2026-01-26
**Confidence:** HIGH (multiple authoritative sources cross-verified)

## Executive Summary

Adding a live "Ask AI" assistant to a presentation teleprompter introduces six high-risk areas: (1) Response latency breaks teaching flow if not streamed; (2) Accidental visibility to students through screen mirroring or incorrect display targeting; (3) Context quality issues from either too little lesson context (unhelpful answers) or too much (confused, slow responses); (4) UX interruption from modal dialogs that steal focus during live teaching; (5) API costs can spike unexpectedly with conversational usage patterns; (6) Keyboard accessibility gaps trap users or break presentation navigation. Each pitfall includes warning signs, prevention strategies, and phase recommendations for the roadmap.

---

## Critical Pitfalls

### 1. Response Latency Breaks Teaching Flow

**What goes wrong:** Teacher asks a question during live teaching, waits 5-15 seconds staring at a loading spinner, loses momentum, students become disengaged. The "cognitive gap" between question and answer breaks the natural teaching rhythm.

**Why it happens:** LLMs have inherent latency. Time to First Token (TTFT) ranges 300ms-2s depending on provider and model. Full responses for complex questions can take 10-15 seconds without streaming.

**Research finding:** "LLM products live and die by that first token. If the app streams something quickly, users lean in. If it stalls, they bounce and the rest of the quality never gets seen." ([Latitude Blog](https://latitude-blog.ghost.io/blog/latency-optimization-in-llm-streaming-key-techniques/))

**Warning signs:**
- Teacher stops mid-sentence waiting for response
- Teacher looks at laptop instead of students
- Teacher abandons the feature after first use
- Teacher pre-types questions before class (workaround)

**Prevention:**

1. **Stream responses immediately** - Display tokens as they arrive. "Users perceive streaming interfaces as 40% faster than buffered responses, even when total time is identical." ([Cloudscape Design](https://cloudscape.design/patterns/genai/genai-loading-states/))

2. **Optimize for TTFT** - Target <500ms to first token:
   - Use faster models for assistant (e.g., `gemini-2.0-flash` over `gemini-2.5-pro`)
   - Keep system prompts concise
   - Consider prompt caching for repeated lesson context

3. **Show "thinking" state immediately** - Display pulsing indicator within 100ms of user submitting question

4. **Make it interruptible** - Allow teacher to abort request and continue presenting

5. **Async preparation option** - Let teachers pre-ask questions before presenting, cache responses

**Phase recommendation:** Streaming must be in v1 of the feature. Non-negotiable for live use.

---

### 2. Accidental Visibility to Students (Display Leak)

**What goes wrong:** Teacher's AI assistant chat is visible to students. This happens when:
- Screen mirroring is enabled (Mac Mirror Displays)
- Wrong display targeted for student view
- Teacher accidentally shares presenter window in Zoom/Teams
- Student walks behind teacher and sees laptop

**Why it happens:** Presentation apps historically struggle with dual-display setups. Users frequently misconfigure display settings, and screen sharing applications capture unintended windows.

**Research finding:** "Using mirroring/duplicating mode will show your notes to the audience as well." ([Apple Discussions](https://discussions.apple.com/thread/254615673)) This is a common problem affecting PowerPoint, Keynote, and all browser-based presentation tools.

**Consequences:**
- Teacher embarrassment
- Students see "cheating" on lesson content
- Inappropriate AI responses visible to class
- Loss of teacher authority/mystique

**Warning signs:**
- Students laughing when teacher uses the feature
- Teacher quickly closes laptop
- Teacher reports "students can see everything"

**Prevention:**

1. **Visual privacy indicator** - Show clear "PRIVATE: Not visible to students" badge on assistant panel. Make teachers confident about what's private.

2. **Minimize chat by default during presentation** - Don't auto-open. Teacher must deliberately expand.

3. **Position strategically** - Place assistant in teleprompter panel area, not floating over slides

4. **Consider "hide on present"** - Auto-collapse assistant when entering fullscreen/presenting mode, require deliberate re-open

5. **Test display detection** - Before entering presentation mode, verify dual-display setup is correct and warn if mirroring detected

6. **Low-profile responses** - Keep responses compact, use muted colors that don't draw peripheral attention

**Phase recommendation:** Address in initial UX design. Add "presentation safety" mode that minimizes assistant visibility.

---

### 3. Context Quality: Not Enough vs. Too Much

**What goes wrong:** Two failure modes:

**A) Too little context:** AI gives generic, unhelpful answers because it doesn't know the lesson content, student grade level, or teaching goals.

**B) Too much context:** AI gets confused, slow, or hallucinates because context window is overloaded with irrelevant information. "Simply providing more information does not ensure comprehension. In fact, it can degrade quality by overwhelming the model with noise." ([Chroma Research](https://research.trychroma.com/context-rot))

**Research finding:** "For many problems with complex context, the LLM's effective working memory can get overloaded with relatively small inputs - far before we hit context window limits." ([How Contexts Fail](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html))

**The "Lost in the Middle" problem:** "LLMs tend to weigh the beginning and end of the prompt more heavily (primacy and recency bias). Important context placed in the middle may be undervalued." ([Towards Data Science](https://towardsdatascience.com/your-1m-context-window-llm-is-less-powerful-than-you-think/))

**Warning signs:**
- AI responses don't mention lesson-specific terms
- AI contradicts what's on current slide
- AI gives wrong grade-level explanations
- Responses take 2x longer than expected
- Answers become generic as conversation continues

**Prevention:**

1. **Smart context injection:**
   - Always include: Current slide content, slide title, 1-2 adjacent slides
   - Include: Lesson topic, grade level, subject
   - Optionally include: Full slide deck (compressed)
   - Never include: Chat history beyond 3-5 exchanges

2. **Context window budget:**
   - Reserve 70% for lesson context, 20% for conversation, 10% for system prompt
   - Truncate older conversation turns first

3. **Fresh context per question:**
   - Don't accumulate stale context
   - Each question should re-inject current slide context

4. **Hierarchical context:**
   - Put current slide at END of context (recency bias helps)
   - Put lesson overview at START
   - Middle for supporting slides

5. **Context quality indicators:**
   - Show "AI knows about: [slide title]" so teacher understands what context is active

**Phase recommendation:** Implement context strategy in initial architecture. Test with real lesson content before shipping.

---

### 4. UX Interruption: Modal vs. Inline

**What goes wrong:** Modal dialogs for chat steal focus, block presentation controls, and force context switch. Teacher can't see slides while typing. Closing modal requires deliberate action, breaking flow.

**Research finding:** "Modal dialogs force users away from the tasks they were working on in the first place. Each interruption translates to lost time and effort, not only because users must address the dialog, but also because, once they go back to their original tasks, people will have to spend some time recovering context." ([NN/g](https://www.nngroup.com/articles/modal-nonmodal-dialog/))

**Warning signs:**
- Teacher has to click multiple times to dismiss chat
- Teacher loses place in presentation after using chat
- Teacher stops using feature because it's "disruptive"
- Chat covers slide content teacher needs to see

**Prevention:**

1. **Use inline/panel design, not modal:**
   - Chat lives in teleprompter panel (already teacher-only)
   - Always visible alongside slides
   - Never covers presentation content

2. **Non-blocking interaction:**
   - Teacher can continue navigating slides while AI responds
   - Typing in chat doesn't capture keyboard (arrow keys still navigate)
   - Chat input uses explicit focus (click or shortcut)

3. **Minimize persistence:**
   - Don't require explicit dismiss
   - Response fades or collapses after read
   - Chat history scrollable but not prominent

4. **Quick-access pattern:**
   - Keyboard shortcut to focus chat input (e.g., `/` or `Cmd+K`)
   - Same shortcut to dismiss focus
   - Tab returns focus to presentation

**Phase recommendation:** Design as inline panel from start. Do not implement modal. Panel placement in teleprompter area is architecturally correct for Cue.

---

### 5. API Cost Spikes with Conversational Usage

**What goes wrong:** Unlike batch operations (generate slides once), chat is open-ended. Teachers ask follow-up questions, context accumulates, costs multiply. A single lesson can consume more tokens than expected.

**Research finding:** "Depending on the provider and model, 2025 costs typically range from $0.25 to $15 per million input tokens and $1.25 to $75 per million output tokens." ([LLM API Pricing 2025](https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025))

**Cost example:**
- Lesson context: ~2000 tokens per request
- Average question: ~50 tokens
- Average response: ~200 tokens
- 10 questions per lesson: 22,500 tokens
- 5 lessons per day: 112,500 tokens/day
- Monthly usage: ~2.5M tokens = $2.50-$12.50/month (varies by model)

**Warning signs:**
- Teacher asks "why is my API bill so high?"
- Teachers avoid using feature due to cost anxiety
- Long context windows from conversation history

**Prevention:**

1. **Use smaller models for chat:**
   - Flash/Haiku models, not Pro/Opus
   - Chat needs speed, not maximum capability
   - Document model choice in settings

2. **Token budget per lesson:**
   - Cap conversation context at ~4000 tokens
   - Summarize or truncate older exchanges
   - Clear conversation on lesson change

3. **Cost visibility:**
   - Show estimated tokens/cost in settings
   - Optional per-session token counter
   - Monthly usage summary

4. **Prompt caching:**
   - Cache lesson context across questions
   - "Prompt caching can reduce latency by cutting prompt encoding time... cache hits typically cost 10% of a standard input token." ([Binadox](https://www.binadox.com/blog/llm-api-pricing-comparison-2025-complete-cost-analysis-guide/))

5. **Rate limiting (optional):**
   - Soft limit: "You've asked 20 questions this lesson. Continue?"
   - Help teachers understand usage patterns

**Phase recommendation:** Select cost-effective model (Flash tier) for v1. Add usage visibility in settings.

---

### 6. Keyboard Accessibility and Focus Conflicts

**What goes wrong:** Chat input creates focus trap issues. Either:
- Focus gets stuck in chat, presentation navigation breaks
- Focus escapes to browser, teacher can't return to chat
- Screen readers can't navigate between chat and slides

**Research finding:** "Keyboard focus must be locked inside the modal when a modal is open. Users shouldn't be able to use tab key to move outside the modal without closing it." BUT "According to WCAG 2.1 Success Criterion 2.1.2, users must be able to move focus away from any component using only a keyboard." ([UXPin](https://www.uxpin.com/studio/blog/how-to-build-accessible-modals-with-focus-traps/))

**The tension:** Chat needs focus for typing, but presentation navigation also uses keyboard.

**Warning signs:**
- Arrow keys type in chat instead of navigating slides
- Teacher can't escape chat without clicking
- Tab key behavior is unpredictable
- Screen reader users can't access feature

**Prevention:**

1. **Explicit focus zones:**
   - Chat input only captures focus when explicitly clicked or shortcut used
   - Escape always returns focus to presentation
   - Arrow keys never captured by chat

2. **Focus indicators:**
   - Clear visual indicator when chat has focus
   - Different cursor or border state
   - Teacher always knows where keyboard input goes

3. **Keyboard shortcut design:**
   - Cmd+K or `/`: Focus chat input
   - Escape: Return focus to presentation
   - Enter: Send message (when in chat)
   - Arrow keys: Always navigate slides (never captured)

4. **ARIA attributes:**
   - role="complementary" for chat panel
   - aria-live="polite" for responses (screen readers)
   - Proper labeling for input field

**Phase recommendation:** Define keyboard model before implementation. Test with screen reader.

---

## Moderate Pitfalls

### 7. AI Hallucination About Lesson Content

**What goes wrong:** AI confidently states something incorrect about the lesson content. Teacher trusts it and teaches wrong information to students.

**Research finding:** "Accuracy and 'hallucinations' are a concern - the bot can sometimes produce incorrect facts or make up information in a confident manner." ([Chatbot Best Practices](https://www.chatbot.com/blog/common-chatbot-mistakes/))

**Warning signs:**
- AI mentions topics not in lesson
- AI contradicts slide content
- AI invents statistics or quotes
- Teacher discovers error during class

**Prevention:**

1. **Ground responses in provided context:**
   - System prompt: "Only answer based on the lesson content provided. If unsure, say so."
   - Prefer extraction over generation

2. **Confidence indicators:**
   - "Based on your lesson:" prefix for grounded answers
   - "I'm not sure, but:" for inferred answers

3. **Source attribution:**
   - "From slide 3:" citations when possible
   - Help teacher verify before teaching

4. **Teacher verification prompt:**
   - For factual claims, encourage teacher to verify
   - Don't present AI as authoritative source

**Phase recommendation:** Address in prompt engineering. Test with domain expert.

---

### 8. Chat History Clutters Teleprompter View

**What goes wrong:** Multiple Q&A exchanges accumulate, pushing speaker notes off screen. Teacher can't find their prepared content.

**Warning signs:**
- Teacher scrolling teleprompter to find notes
- Chat responses longer than teleprompter panel
- Teacher asks "where did my notes go?"

**Prevention:**

1. **Collapsible chat section:**
   - Chat can be minimized to single line
   - One-click expand/collapse
   - Speaker notes always have dedicated space

2. **Fixed height chat area:**
   - Chat scrolls internally
   - Never pushes notes offscreen
   - Configurable height

3. **Auto-fade responses:**
   - Old responses fade after 30 seconds
   - Or collapse to summary view
   - Most recent answer prominent

4. **Clear conversation action:**
   - One-click "Clear chat" button
   - Or auto-clear on slide change (optional)

**Phase recommendation:** Design panel layout with fixed zones. Speaker notes must remain accessible.

---

### 9. Poor Error Handling Confuses Teachers

**What goes wrong:** API errors surface as technical messages. Teacher doesn't know if it's their fault, temporary, or permanent.

**Research finding from v2.0-PITFALLS.md:** "Teachers see 'Error 429' or 'insufficient_quota' and have no idea what to do. They abandon the app."

**Warning signs:**
- Teacher reports "it just says error"
- Teacher stops using feature after one failure
- Teacher assumes feature is broken permanently

**Prevention:**

1. **Translate all errors:**

| Technical | User-Friendly |
|-----------|---------------|
| 429 rate limit | "AI is busy. Trying again in 3 seconds..." (auto-retry) |
| Network error | "Can't reach AI service. Check your internet." |
| Timeout | "That took too long. Try a simpler question?" |
| Context too long | "Too much information. Ask about specific slide." |

2. **Silent retry for transient errors:**
   - Auto-retry 2-3 times for rate limits
   - Show retry countdown, not error

3. **Graceful degradation:**
   - If AI unavailable, feature hides gracefully
   - Don't show broken state during presentation

**Phase recommendation:** Reuse error handling patterns from v2.0. Apply to chat specifically.

---

### 10. No Conversation Persistence

**What goes wrong:** Teacher accidentally navigates away or refreshes. All conversation history lost. Teacher frustrated by repeating context.

**Warning signs:**
- Teacher asks same question multiple times
- Teacher complains about losing helpful response
- Teacher takes screenshots to preserve answers

**Prevention:**

1. **Session persistence:**
   - Store conversation in sessionStorage per lesson
   - Restore on page return
   - Clear on lesson change

2. **Copy response action:**
   - One-click copy AI response
   - Teacher can paste into personal notes

3. **Export option (stretch):**
   - Download conversation as text file
   - Post-lesson reference

**Phase recommendation:** Implement session persistence in v1. Export is v2.

---

## Minor Pitfalls

### 11. Response Length Mismatch

**What goes wrong:** AI gives paragraph-length responses when teacher needs bullet points. Or gives terse responses when explanation needed.

**Prevention:**
- System prompt: "Keep responses concise (2-3 sentences max) unless asked for detail"
- Allow "explain more" / "shorter please" follow-ups
- Test response lengths with real teacher questions

**Phase recommendation:** Tune in prompt engineering phase.

---

### 12. Input Submission Confusion

**What goes wrong:** Teacher presses Enter expecting to submit, but nothing happens (or vice versa with Shift+Enter for newlines).

**Prevention:**
- Enter = submit (single-line input)
- Visual submit button as backup
- Consistent with common chat patterns

**Phase recommendation:** Follow standard chat input patterns.

---

### 13. No Question Suggestions

**What goes wrong:** Teacher doesn't know what to ask. Feature feels useless because they can't think of questions in the moment.

**Prevention:**
- Provide 2-3 contextual suggestions: "What might students struggle with on this slide?"
- Based on current slide content
- Click to ask pre-filled question

**Phase recommendation:** Nice-to-have for v1, prioritize for v2.

---

## Privacy and Compliance Pitfalls

### 14. PII in Chat Messages

**What goes wrong:** Teacher mentions student names in questions. "Why is Johnny struggling with fractions?" Student PII sent to external AI API.

**Research finding:** "FERPA is a federal law that protects the privacy of student education records. Schools must ensure that any AI tools used in the classroom comply with FERPA regulations." ([Fordham Institute](https://fordhaminstitute.org/national/commentary/ai-serious-threat-student-privacy))

**Warning signs:**
- Chat messages contain student names
- Teacher discusses specific student performance
- School district audit flags tool

**Prevention:**

1. **Input warning:**
   - On first use: "Don't include student names or personal information"
   - Subtle reminder near input

2. **No logging of chat content:**
   - Don't persist conversations beyond session
   - Don't send to analytics

3. **Documentation:**
   - Privacy policy explaining API data handling
   - FERPA compliance statement (if applicable)

**Phase recommendation:** Add privacy notice in v1. Document data handling.

---

### 15. Inappropriate AI Responses

**What goes wrong:** AI generates content unsuitable for classroom. Profanity, controversial topics, or age-inappropriate examples.

**Research finding:** "Responding to teacher prompts, AI can automatically create content that looks professional but may include inappropriate material. The AI teacher assistants can also be 'invisible influencers' - presenting biased or inaccurate viewpoints." ([Common Sense Media](https://www.datiak12.io/technology/ai/article/15752629/ai-teacher-assistants-are-useful-but-can-pose-risks-in-the-classroom-report-finds))

**Prevention:**

1. **System prompt guardrails:**
   - "You are helping a K-12 teacher. Keep all responses classroom-appropriate."
   - Specify grade level context

2. **Use provider safety filters:**
   - Gemini has built-in safety settings
   - Configure for educational use case

3. **Teacher review:**
   - Responses go to teleprompter (private), not directly to students
   - Teacher can choose what to share

**Phase recommendation:** Configure safety settings in initial implementation.

---

## Phase-Specific Warning Summary

| Phase | Highest-Risk Pitfall | Mitigation Priority |
|-------|---------------------|---------------------|
| v1 Core | Response latency | Streaming mandatory |
| v1 Core | Accidental visibility | Panel placement + privacy indicator |
| v1 Core | Context quality | Smart context injection |
| v1 UX | Modal interruption | Inline panel design |
| v1 UX | Keyboard conflicts | Define focus model |
| v1 UX | Chat clutter | Fixed-height scrollable panel |
| v1 Integration | API costs | Use Flash models |
| v1 Integration | Error handling | Friendly error messages |
| v2 Enhancement | Question suggestions | Context-aware prompts |
| v2 Enhancement | Conversation persistence | Session storage |

---

## Key Recommendations for Roadmap

1. **Streaming is non-negotiable** - Do not ship without response streaming. Latency kills the feature.

2. **Design as inline panel, not modal** - Chat lives in teleprompter. Never covers slides. Never steals focus.

3. **Context strategy up front** - Decide what context goes to AI before writing any code. Test with real lessons.

4. **Privacy-first visibility** - Make it obvious the assistant is teacher-only. Minimize visual presence during presentation.

5. **Keyboard model defined early** - Document exactly how focus works before implementation. Test with presentation navigation.

6. **Reuse v2.0 error handling** - Apply the error translation patterns already researched.

---

## Sources

### Latency and Streaming
- [Latitude: Latency Optimization in LLM Streaming](https://latitude-blog.ghost.io/blog/latency-optimization-in-llm-streaming-key-techniques/)
- [Cloudscape: Generative AI Loading States](https://cloudscape.design/patterns/genai/genai-loading-states/)
- [OpenAI: Latency Optimization Guide](https://platform.openai.com/docs/guides/latency-optimization)
- [DEV: Streaming LLM Responses Complete Guide](https://dev.to/hobbada/the-complete-guide-to-streaming-llm-responses-in-web-applications-from-sse-to-real-time-ui-3534)

### UX and Modal Design
- [NN/g: Modal & Nonmodal Dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/)
- [UXPin: How to Build Accessible Modals with Focus Traps](https://www.uxpin.com/studio/blog/how-to-build-accessible-modals-with-focus-traps/)
- [Eleken: Mastering Modal UX](https://www.eleken.co/blog-posts/modal-ux)
- [Chatbot.com: Common Chatbot Mistakes](https://www.chatbot.com/blog/common-chatbot-mistakes/)

### Context and AI Quality
- [Chroma Research: Context Rot](https://research.trychroma.com/context-rot)
- [Towards Data Science: Your 1M+ Context Window LLM Is Less Powerful Than You Think](https://towardsdatascience.com/your-1m-context-window-llm-is-less-powerful-than-you-think/)
- [Drew Breunig: How Contexts Fail](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html)
- [Agenta: Techniques to Manage Context Length](https://agenta.ai/blog/top-6-techniques-to-manage-context-length-in-llms)

### Display and Screen Sharing
- [Zoom Community: Presenter View Notes Visible](https://community.zoom.com/t5/Zoom-Meetings/When-I-share-my-screen-in-presenter-view-my-notes-are-visible-to/m-p/193958)
- [Apple Discussions: Keynote Presenter Notes Display](https://discussions.apple.com/thread/254615673)
- [Microsoft Support: Presenter View](https://support.microsoft.com/en-us/office/start-the-presentation-and-see-your-notes-in-presenter-view-4de90e28-487e-435c-9401-eb49a3801257)

### Cost Management
- [IntuitionLabs: LLM API Pricing Comparison 2025](https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025)
- [Binadox: LLM API Pricing Complete Guide](https://www.binadox.com/blog/llm-api-pricing-comparison-2025-complete-cost-analysis-guide/)
- [orq.ai: API Rate Limits Best Practices 2025](https://orq.ai/blog/api-rate-limit)

### Education and Privacy
- [Fordham Institute: AI is a Serious Threat to Student Privacy](https://fordhaminstitute.org/national/commentary/ai-serious-threat-student-privacy)
- [Common Sense Media: AI Teacher Assistants Risk Assessment](https://www.datiak12.io/technology/ai/article/15752629/ai-teacher-assistants-are-useful-but-can-pose-risks-in-the-classroom-report-finds)
- [SchoolAI: What Every Teacher Needs to Know About AI Safety](https://schoolai.com/blog/teacher-ai-safety-education)

### Enterprise AI Integration
- [Composio: Why AI Agent Pilots Fail](https://composio.dev/blog/why-ai-agent-pilots-fail-2026-integration-roadmap)
- [Glean: 5 Common Pitfalls in AI Assistant Implementation](https://www.glean.com/perspectives/5-common-pitfalls-in-ai-assistant-implementation-and-how-to-overcome-them)
- [ISACA: Avoiding AI Pitfalls in 2026](https://www.isaca.org/resources/news-and-trends/isaca-now-blog/2025/avoiding-ai-pitfalls-in-2026-lessons-learned-from-top-2025-incidents)

---

*Pitfalls research: 2026-01-26*
