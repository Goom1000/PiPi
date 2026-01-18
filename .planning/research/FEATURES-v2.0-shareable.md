# Features Research: v2.0 Shareable Presentations

**Domain:** Teacher presentation tool with AI features - file sharing and API key management
**Researched:** 2026-01-19
**Confidence:** MEDIUM-HIGH (patterns well-established, education-specific context extrapolated)

## Executive Summary

For shareable presentations targeting 4 non-technical colleagues, the feature set should prioritize simplicity over flexibility. Save/load should use explicit file download/upload (not cloud sync) with JSON format for portability. API key management needs a dedicated settings panel with clear BYOK (Bring Your Own Key) instructions since users own their keys. Disabled AI features should remain visible but clearly marked as "requires API key" with inline setup guidance - hiding them entirely would confuse users who saw the presentation author use those features.

---

## Save/Load Features

### Table Stakes

| Feature | Rationale | Complexity |
|---------|-----------|------------|
| **Export to file (download)** | Users expect to "save" work locally. Browser download is universally understood. | Low |
| **Import from file (upload)** | Counterpart to export. File picker is standard pattern. | Low |
| **JSON format** | Human-readable, debuggable, no binary corruption issues. Teachers can email files. | Low |
| **Clear file naming** | Auto-suggest name like `presentation-name-2024-01-19.json`. Prevents "Untitled.json" confusion. | Low |
| **Overwrite confirmation** | When loading a file, warn if current work will be lost. | Low |
| **Success feedback** | Toast/notification confirming "Presentation saved" or "Loaded successfully". | Low |
| **Recent/current file indicator** | Show filename in header so users know what they're working on. | Low |

### Nice to Have

| Feature | Value | Complexity |
|---------|-------|------------|
| **Drag-and-drop file loading** | Faster than file picker for power users. Drop zone with dashed border. | Medium |
| **Auto-save to localStorage** | Prevents accidental data loss (browser crash, refresh). Separate from explicit export. | Medium |
| **Version in file metadata** | Enables future format migrations. Include `{ version: "2.0", ... }`. | Low |
| **File validation with helpful errors** | "This file is missing required fields" not "Invalid JSON". | Medium |
| **Template files** | Pre-built presentations users can load and customize. | Medium |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Cloud sync / accounts** | Adds complexity, privacy concerns, server costs. 4-person team doesn't need it. | File download/upload |
| **Auto-save replacing explicit save** | Users want control. "I didn't mean to save that" is worse than "I forgot to save". | Auto-save to localStorage as recovery only, explicit export for sharing |
| **Multiple file formats** | Supporting .pptx, .pdf export adds massive complexity for minimal value. | JSON only - it works |
| **Real-time collaboration** | Google Slides territory. Out of scope for a small teacher tool. | One author, share via file |
| **File versioning/history** | Complex to build, overkill for this use case. | User manages versions manually |

---

## API Key Management Features

### Table Stakes

| Feature | Rationale | Complexity |
|---------|-----------|------------|
| **Dedicated settings panel** | Gear icon in header opening modal/drawer. Standard pattern. | Low |
| **Single API key input field** | Text input with "API Key" label. Mask by default (password field style). | Low |
| **Show/hide toggle for key** | Eye icon to reveal key. Users need to verify they pasted correctly. | Low |
| **Local storage only** | Keys never leave the browser. Critical for BYOK trust. Display "Stored locally only" text. | Low |
| **Test connection button** | "Verify" button that makes test API call. Confirms key works before user closes settings. | Medium |
| **Clear success/error states** | Green checkmark for valid key, red error with specific message for failures. | Low |
| **Delete/clear key option** | Users should be able to remove their key easily. | Low |

### Nice to Have

| Feature | Value | Complexity |
|---------|-------|------------|
| **Multi-provider support** | If supporting OpenAI + Anthropic + others, tabbed interface or dropdown selector. | Medium |
| **Usage indicator** | Show "API calls this session: 12" so users understand costs. | Medium |
| **Key nickname/label** | If multiple keys possible, let users name them ("Work key", "Personal key"). | Low |
| **Import/export settings** | Let colleagues share their settings (excluding the key itself). | Low |
| **Link to billing dashboard** | Direct link to OpenAI/provider billing page for cost monitoring. | Low |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Server-side key storage** | Security risk, trust issues, GDPR concerns. | localStorage only |
| **Account system for keys** | Adds login requirement, complexity. Overkill for 5 users. | BYOK with local storage |
| **Multiple API keys per provider** | Confusing for non-technical users. One key per provider is enough. | Single key per provider |
| **Automatic key rotation** | Users manage their own keys at provider level. | Link to provider docs |
| **Key sharing between colleagues** | Security risk. Each teacher should have own key. | Document that each user needs own key |

---

## Disabled State Patterns

### Core Principle: Visible but Clearly Disabled

Users who load a shared presentation should **see** the AI features exist, but understand they need setup. Hiding features entirely causes confusion ("The author showed me a quiz generator, where is it?").

### Recommended Patterns

**1. Grayed-out with lock icon**
```
[Lock Icon] Generate Questions  (Requires API key)
```
- Button is visually disabled (50% opacity)
- Lock icon communicates "locked" not "broken"
- Text explains what's missing

**2. Inline tooltip on hover/tap**
```
"This feature requires an OpenAI API key.
Set up in Settings > API Keys"
```
- Explains the problem
- Points to the solution
- Single click to settings

**3. First-click education**
When clicking a disabled AI feature, show a modal:
```
[Modal: Set Up AI Features]

To use question generation, you'll need an OpenAI API key.

What's an API key?
An API key is like a password that lets PiPi use
OpenAI's AI service. You pay OpenAI directly for usage.

[Get an API Key] [Open Settings]
```

**4. Feature badge system**
Mark AI features consistently:
```
[Sparkle Icon] AI Feature - requires setup
```
Users learn the icon means "needs API key".

### Patterns to Avoid

| Anti-Pattern | Problem | Better Approach |
|--------------|---------|-----------------|
| **Hiding disabled features** | Users don't know what they're missing | Show disabled with explanation |
| **Generic "Feature unavailable"** | Doesn't explain why or how to fix | Specific message + action |
| **Aggressive upsells** | Feels like paywall, not education | Gentle education, clear value |
| **Disabled without any feedback** | Users click repeatedly, get frustrated | Always explain on interaction |
| **Modal on every page load** | Annoying, users dismiss without reading | Show on feature interaction only |

### Graceful Degradation Strategy

The app should be **fully functional** without AI features:

| State | Experience |
|-------|------------|
| **No API key** | Can create, edit, present, save, load. AI buttons disabled with clear messaging. |
| **Invalid API key** | Same as above + error message in settings explaining the problem. |
| **API rate limited** | Temporary degradation. Show "Try again in X minutes" not permanent disable. |
| **API service down** | Same as rate limited. Feature works when service returns. |

---

## Onboarding/Instructions

### Core Principle: Meet Users Where They Are

Non-technical teachers need step-by-step guidance. Assume they've never heard of an API key.

### Recommended Instruction Flow

**1. In-app getting started guide (first launch)**
```
Welcome to PiPi!

[Basic features work now - no setup needed]
Create presentations, add slides, present to students.

[Optional: Enable AI Features]
AI can generate quiz questions and games.
Requires a free OpenAI account + API key.

[Skip for now] [Set up AI]
```

**2. Dedicated setup wizard (when user clicks "Set up AI")**

Step-by-step with screenshots:

```
Step 1 of 4: Create OpenAI Account
Go to platform.openai.com and click "Sign Up"
[Screenshot of signup page]
[I've done this - Next]

Step 2 of 4: Add Payment Method
OpenAI requires a payment method (you'll only pay for what you use)
Typical cost: $0.01-0.10 per AI request
[Screenshot of billing page]
[I've done this - Next]

Step 3 of 4: Create API Key
Go to API Keys page and click "Create new secret key"
[Screenshot of API keys page]
Important: Copy your key now - you won't see it again!
[I've copied my key - Next]

Step 4 of 4: Paste Key Here
[Input field]
[Verify Key]
```

**3. Help text in settings panel**

Persistent instructions near the API key field:
```
Need an API key? Follow our setup guide
Typical cost: $1-5 per month for moderate use
Your key is stored locally and never sent to our servers
```

**4. Inline help for colleagues**

When a colleague loads a shared presentation:
```
[Info banner at top]
This presentation uses AI features.
To enable them, you'll need your own OpenAI API key.
[Setup Guide] [Dismiss]
```

### Instruction Content Best Practices

| Do | Don't |
|----|-------|
| Use screenshots from the actual provider UI | Describe steps in text only |
| Explain costs upfront ($0.01-0.10 per request) | Hide or minimize cost discussion |
| Provide direct links to exact pages | Link to provider homepage |
| Test instructions monthly (UIs change) | Set and forget documentation |
| Offer "I'm stuck" contact option | Assume instructions cover everything |
| Explain what the key does (simply) | Assume users understand API concepts |

### Error Message Guidelines

| Scenario | Bad Message | Good Message |
|----------|-------------|--------------|
| Invalid key | "Authentication failed" | "This API key doesn't seem to work. Double-check you copied the whole key." |
| Expired key | "401 Unauthorized" | "Your API key may have expired. Create a new one at platform.openai.com" |
| No credits | "Insufficient quota" | "Your OpenAI account needs credits. Add them at platform.openai.com/account/billing" |
| Rate limited | "429 Too Many Requests" | "Slow down! Wait a minute before trying again." |

---

## Implementation Priorities for v2.0

### Phase 1: Core Shareable (Must Have)
1. Export presentation to JSON file
2. Import presentation from JSON file
3. Settings panel with API key input
4. Disabled state UI for AI features
5. Basic setup instructions in settings

### Phase 2: Polish (Should Have)
1. Drag-and-drop file loading
2. Auto-save to localStorage (recovery)
3. Setup wizard with screenshots
4. Test connection button for API key
5. Inline help for colleagues loading shared files

### Phase 3: Nice to Have
1. Multi-provider API key support
2. Usage tracking/indicator
3. Template presentations
4. File validation with helpful errors

---

## Sources

### Save/Load Patterns
- [Smashing Magazine - Designing Usable Data Importers](https://www.smashingmagazine.com/2020/12/designing-attractive-usable-data-importer-app/)
- [Smart Interface Design Patterns - Bulk Import UX](https://smart-interface-design-patterns.com/articles/bulk-ux/)
- [Primer Design System - Saving](https://primer.style/ui-patterns/saving/)
- [UI Patterns - Autosave](https://ui-patterns.com/patterns/autosave)
- [GitLab Pajamas - Saving and Feedback](https://design.gitlab.com/patterns/saving-and-feedback/)
- [Uploadcare - File Uploader UX Best Practices](https://uploadcare.com/blog/file-uploader-ux-best-practices/)
- [LogRocket - Drag and Drop UI Design](https://blog.logrocket.com/ux-design/drag-and-drop-ui-examples/)
- [Smart Interface Design Patterns - Drag and Drop UX](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/)

### API Key Management
- [Carbon Design System - Generate an API Key](https://carbondesignsystem.com/community/patterns/generate-an-api-key/)
- [OpenAI - API Key Safety Best Practices](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
- [BYOK Browser Extension Pattern](https://www.xiegerts.com/post/browser-extension-genai-key-prompts/)
- [Open WebUI - API Key Management](https://deepwiki.com/open-webui/docs/5.4-api-key-management)

### Disabled States & Paywalls
- [Smashing Magazine - Hidden vs Disabled in UX](https://www.smashingmagazine.com/2024/05/hidden-vs-disabled-ux/)
- [UX Knowledge Base - Disabled State in UI Design](https://uxknowledgebase.com/the-disabled-state-in-ui-design-8c091d72868/)
- [Smart Interface Design Patterns - Disabled Buttons](https://smart-interface-design-patterns.com/articles/disabled-buttons/)
- [Carbon Design System - Disabled States](https://carbondesignsystem.com/patterns/disabled-states/)
- [The Growth List - Disabled Premium Features](https://thegrowthlist.co/tactics/disabled-premium-features)
- [UI Patterns - Paywall](https://ui-patterns.com/patterns/Paywall)
- [UI Patterns - Unlock Features](https://ui-patterns.com/patterns/Unlock-features)

### Settings & Onboarding
- [Material Design - Settings](https://m1.material.io/patterns/settings.html)
- [LogRocket - Modal UX Design Patterns](https://blog.logrocket.com/ux-design/modal-ux-design-patterns-examples-best-practices/)
- [Design Monks - Side Drawer UI](https://www.designmonks.co/blog/side-drawer-ui)
- [Tyk - API Onboarding Strategies](https://tyk.io/blog/api-onboarding-strategies-for-smooth-integration-success/)
- [ReadMe - Onboarding with Personalized Docs](https://blog.readme.com/onboarding-users-with-personalized-docs/)

### Graceful Degradation
- [LogRocket - Guide to Graceful Degradation](https://blog.logrocket.com/guide-graceful-degradation-web-development/)
- [Unleash - Graceful Degradation and FeatureOps](https://www.getunleash.io/blog/graceful-degradation-featureops-resilience)

### Education Tool Context
- [Edcafe AI - Teacher Collaboration Features](https://angelaa-lee.medium.com/8-best-classroom-collaboration-tools-teachers-love-why-they-love-them-top-tips-d5ae2ff96280)
- [Teamplace - File Sharing for Education](https://www.teamplace.net/en/education/)
