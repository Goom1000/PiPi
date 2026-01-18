# Project Research Summary

**Project:** PiPi v2.0 - Shareable Presentations
**Domain:** File save/load, multi-provider AI, GitHub Pages deployment
**Researched:** 2026-01-19
**Confidence:** HIGH

## Executive Summary

Building shareable presentations for a 4-person teaching team requires three independent capabilities: (1) file save/load using JSZip with a `.pipi` archive format, (2) multi-provider AI abstraction supporting Gemini, Claude, and OpenAI with runtime API key management, and (3) GitHub Pages deployment with proper base path configuration. All three can be achieved client-side only with zero backend infrastructure. The primary risks are XSS exposure of API keys (mitigated by warnings and clear-data functionality), memory exhaustion on large presentations (mitigated by size limits), and cryptic error messages for non-technical teachers (mitigated by error translation layer).

## Key Findings

### Recommended Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| File format | JSZip + `.pipi` extension | ZIP archives handle JSON + binary images cleanly |
| AI abstraction | Custom provider layer | Vercel AI SDK pattern, swap providers via factory |
| API key storage | localStorage + obfuscation | Client-only, user owns keys, no backend needed |
| Deployment | GitHub Pages + Vite | Free, auto-deploys from git, already have GitHub account |

**New dependencies:**
```bash
npm install jszip file-saver openai @anthropic-ai/sdk
npm install -D @types/file-saver
```

### Table Stakes Features

**Save/Load:**
- Export presentation to downloadable `.pipi` file (JSON + assets in ZIP)
- Import presentation from file picker
- Success/failure feedback toasts
- File size validation before save (warn if > 50MB)

**API Key Management:**
- Settings panel with gear icon
- Masked input with show/hide toggle
- "Verify key" test connection button
- Stored locally only, never transmitted

**Disabled AI State:**
- AI buttons visible but grayed out when no key
- Lock icon + "Requires API key" tooltip
- First-click modal explaining setup
- App fully functional without AI (create, edit, present work)

**Setup Instructions:**
- Step-by-step wizard with screenshots
- Cost information upfront ($0.01-0.10 per AI request)
- Direct links to provider dashboard pages

### Architecture Approach

```
contexts/
  SettingsContext.tsx      # API keys, preferences, localStorage sync

services/
  ai/
    types.ts               # AIProvider interface
    index.ts               # Factory + singleton
    providers/
      gemini.ts            # Existing wrapped
      anthropic.ts         # Future
      openai.ts            # Future
  fileService.ts           # savePiPi(), loadPiPi() with JSZip
```

**File format (.pipi):**
```
presentation.pipi (ZIP)
├── manifest.json          # Version, metadata
├── slides.json            # Slide data
├── settings.json          # Preferences captured at save
└── assets/
    └── slide-0-image.jpg  # Binary images
```

### Critical Pitfalls

| Priority | Pitfall | Impact | Mitigation |
|----------|---------|--------|------------|
| 1 | GitHub Pages base path | Blank page on deploy | Set `base: '/repo-name/'` in vite.config.ts |
| 2 | XSS exposes API keys | Key theft | Security warning modal, clear-data button |
| 3 | Memory exhaustion | Save fails silently | Size validation, 50MB warning |
| 4 | Rate limit format differences | Retry loops | Provider-specific error parsers |
| 5 | Cryptic errors | User abandonment | Error message translation layer |

### Repository Name Issue

Current repo "DEV - PiPi" has spaces, which complicates GitHub Pages URLs. Recommend renaming to `pipi` or `lessonlens` for cleaner deployment.

## Implications for Roadmap

**Suggested phases based on dependencies:**

1. **Settings & API Key Runtime** — Foundation for everything else
   - SettingsContext + localStorage sync
   - API key input UI with verification
   - Remove build-time API key injection

2. **Multi-Provider AI Abstraction** — Depends on Phase 1 for keys
   - Provider interface + factory
   - Wrap existing Gemini code
   - Error normalization layer

3. **File Save/Load** — Independent, can parallel with Phase 2
   - JSZip integration
   - .pipi format with manifest versioning
   - Save/load UI with feedback

4. **GitHub Pages Deployment** — Infrastructure, build last
   - Vite base path config
   - GitHub Actions workflow
   - Cache-busting meta tags

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| JSZip file format | HIGH | Mature library, well-documented |
| Multi-provider abstraction | HIGH | Vercel AI SDK pattern proven |
| localStorage API keys | HIGH | Standard BYOK pattern |
| GitHub Pages deployment | HIGH | Official Vite documentation |
| XSS security | MEDIUM | Can't fully prevent, only mitigate |

**Overall confidence:** HIGH

### Gaps Remaining

1. **Repository rename decision** — Spaces in name cause URL complications
2. **Claude image generation fallback** — Claude doesn't generate images, need fallback to Gemini
3. **sessionStorage vs localStorage** — Should keys clear on tab close? UX vs security tradeoff

## Sources

### Primary (HIGH confidence)
- [JSZip Official Documentation](https://stuk.github.io/jszip/)
- [Vite Static Deploy Guide](https://vite.dev/guide/static-deploy)
- [OpenAI Error Codes](https://platform.openai.com/docs/guides/error-codes)
- [Anthropic Rate Limits](https://docs.anthropic.com/en/api/rate-limits)
- [MDN Blob API](https://developer.mozilla.org/en-US/docs/Web/API/Blob)

### Secondary (MEDIUM confidence)
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction)
- [Carbon Design System - API Key Patterns](https://carbondesignsystem.com/community/patterns/generate-an-api-key/)
- [Smashing Magazine - Disabled States UX](https://www.smashingmagazine.com/2024/05/hidden-vs-disabled-ux/)
- [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)

---
*Research completed: 2026-01-19*
*Ready for requirements: yes*
