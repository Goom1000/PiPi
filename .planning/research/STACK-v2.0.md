# Stack Research: v2.0 Shareable Presentations

**Project:** PiPi - Educational Presentation Tool
**Researched:** 2026-01-19
**Milestone:** v2.0 Shareable Presentations
**Overall Confidence:** HIGH

## Executive Summary

PiPi v2.0 requires four capabilities: file save/load (.pipi format), multi-provider AI (Gemini/Claude/OpenAI), GitHub Pages deployment, and secure API key storage. All four can be achieved client-side with zero additional backend infrastructure. File operations use native browser APIs (Blob + anchor download). Multi-provider AI is achievable via direct SDK usage with provider-specific CORS/browser flags. GitHub Pages deployment requires only a `base` path config and a GitHub Actions workflow. API key security should use localStorage with optional encryption via Web Crypto API.

---

## Recommended Stack

### 1. File Save/Load System

**Approach:** Native Browser APIs (no additional dependencies)

The `.pipi` file format should be a JSON file containing presentation metadata plus base64-encoded PDF data. No external libraries are needed.

| Component | Technology | Why |
|-----------|------------|-----|
| File Creation | `Blob` API | Native, zero dependencies, works in all browsers |
| Download Trigger | Anchor element + `URL.createObjectURL()` | Standard pattern, no library needed |
| File Loading | `<input type="file">` + `FileReader` | Native file picker, async reading |
| PDF Storage | Base64 encoding | JSON-safe, portable, ~33% size overhead acceptable |

**Code Pattern - Save:**
```typescript
interface PiPiFile {
  version: string;
  createdAt: string;
  lessonTitle: string;
  slides: Slide[];
  resources: LessonResource[];
  pdfData?: string; // base64-encoded original PDF
}

function savePiPiFile(data: PiPiFile, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename}.pipi`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url); // Important: prevent memory leaks
}
```

**Code Pattern - Load:**
```typescript
function loadPiPiFile(file: File): Promise<PiPiFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid .pipi file format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
```

**PDF to Base64 Encoding:**
```typescript
function pdfToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file); // Returns data:application/pdf;base64,...
  });
}
```

**Why NOT use file-saver:**
- `file-saver` (npm) adds 4KB for functionality achievable in ~10 lines
- Only beneficial for Safari edge cases (rare in education settings)
- Native approach works for Chrome, Firefox, Edge, Safari modern versions

---

### 2. Multi-Provider AI Integration

**Approach:** Unified abstraction layer over official SDKs

All three providers support client-side usage with explicit opt-in flags.

| Provider | SDK | Browser Flag | CORS |
|----------|-----|--------------|------|
| Google Gemini | `@google/genai` (already installed) | N/A (native support) | Enabled |
| Anthropic Claude | `@anthropic-ai/sdk` | `dangerouslyAllowBrowser: true` | Requires header |
| OpenAI | `openai` | `dangerouslyAllowBrowser: true` | Enabled |

**Installation:**
```bash
npm install openai @anthropic-ai/sdk
# @google/genai already installed (v1.30.0)
```

**Provider Abstraction Pattern:**
```typescript
// types/ai.ts
export type AIProvider = 'gemini' | 'claude' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export interface GenerateRequest {
  systemPrompt: string;
  userPrompt: string;
  images?: string[]; // base64 data URLs
  responseFormat?: 'json' | 'text';
}

export interface GenerateResponse {
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
}
```

```typescript
// services/aiService.ts
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export function createAIClient(config: AIConfig) {
  switch (config.provider) {
    case 'gemini':
      return new GeminiAdapter(config.apiKey, config.model);
    case 'claude':
      return new ClaudeAdapter(config.apiKey, config.model);
    case 'openai':
      return new OpenAIAdapter(config.apiKey, config.model);
  }
}

class GeminiAdapter {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model = 'gemini-2.0-flash') {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const parts: any[] = [{ text: request.userPrompt }];
    request.images?.forEach(img => {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: img.split(',')[1]
        }
      });
    });

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: { parts },
      config: {
        systemInstruction: request.systemPrompt,
        responseMimeType: request.responseFormat === 'json'
          ? 'application/json'
          : 'text/plain'
      }
    });

    return { text: response.text || '' };
  }
}

class ClaudeAdapter {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = 'claude-sonnet-4-20250514') {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true // Required for client-side
    });
    this.model = model;
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

    request.images?.forEach(img => {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: img.split(',')[1]
        }
      });
    });
    content.push({ type: 'text', text: request.userPrompt });

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: request.systemPrompt,
      messages: [{ role: 'user', content }]
    });

    const textBlock = response.content.find(b => b.type === 'text');
    return {
      text: textBlock?.text || '',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    };
  }
}

class OpenAIAdapter {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = 'gpt-4o') {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Required for client-side
    });
    this.model = model;
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const content: OpenAI.ChatCompletionContentPart[] = [];

    request.images?.forEach(img => {
      content.push({
        type: 'image_url',
        image_url: { url: img }
      });
    });
    content.push({ type: 'text', text: request.userPrompt });

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content }
      ],
      response_format: request.responseFormat === 'json'
        ? { type: 'json_object' }
        : undefined
    });

    return {
      text: response.choices[0]?.message?.content || '',
      usage: response.usage ? {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens
      } : undefined
    };
  }
}
```

**Default Model Recommendations:**

| Provider | Text Model | Image Gen Model | Notes |
|----------|------------|-----------------|-------|
| Gemini | `gemini-2.0-flash` | `imagen-3.0-generate-002` | Fastest, cheapest |
| Claude | `claude-sonnet-4-20250514` | N/A (no image gen) | Best for structured output |
| OpenAI | `gpt-4o` | `dall-e-3` | Most features |

**Image Generation Note:** Only Gemini and OpenAI support image generation. Claude does not. The abstraction layer should handle this gracefully by falling back to Gemini for image generation regardless of text model choice.

---

### 3. GitHub Pages Deployment

**Configuration changes required in `vite.config.ts`:**

```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // ADD THIS: Set base path for GitHub Pages
    // Use repo name for project pages, or '/' for user pages
    base: process.env.GITHUB_ACTIONS ? '/DEV---PiPi/' : '/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    // REMOVE: These environment variables won't work on GitHub Pages
    // API keys must be entered at runtime by users
    // define: {
    //   'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    //   'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    // },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
```

**GitHub Actions Workflow (`.github/workflows/deploy.yml`):**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Repository Settings Required:**
1. Go to `Settings > Pages`
2. Set Source to "GitHub Actions"
3. Do NOT use the legacy "Deploy from branch" option

**Important Notes:**
- The `base` path must match the repository name exactly (case-sensitive)
- For user/org pages (`username.github.io`), use `base: '/'`
- Remove env variables from build - API keys must be entered at runtime by users

---

### 4. Secure API Key Storage

**Approach:** localStorage with optional Web Crypto API encryption

For an education tool where users provide their own API keys, the threat model is:
1. Protect against casual snooping (kids looking at DevTools)
2. Persist keys across sessions for convenience
3. Accept that determined users can always extract their own keys

**Recommended Pattern - Basic (Sufficient for most cases):**
```typescript
// services/keyStorage.ts
const STORAGE_KEY = 'pipi_api_keys';

export interface StoredKeys {
  gemini?: string;
  claude?: string;
  openai?: string;
  activeProvider: AIProvider;
}

export function saveApiKeys(keys: StoredKeys): void {
  // Simple obfuscation - not cryptographically secure but deters casual inspection
  const encoded = btoa(JSON.stringify(keys));
  localStorage.setItem(STORAGE_KEY, encoded);
}

export function loadApiKeys(): StoredKeys | null {
  const encoded = localStorage.getItem(STORAGE_KEY);
  if (!encoded) return null;
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

export function clearApiKeys(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

**Enhanced Pattern - Web Crypto API Encryption:**
```typescript
// services/secureKeyStorage.ts
const STORAGE_KEY = 'pipi_api_keys_encrypted';
const SALT_KEY = 'pipi_salt';

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptAndStore(
  keys: StoredKeys,
  password: string
): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(keys))
  );

  // Store salt, iv, and encrypted data
  const combined = new Uint8Array([
    ...salt,
    ...iv,
    ...new Uint8Array(encrypted)
  ]);

  localStorage.setItem(SALT_KEY, Array.from(salt).join(','));
  localStorage.setItem(STORAGE_KEY, btoa(String.fromCharCode(...combined)));
}

export async function decryptAndLoad(password: string): Promise<StoredKeys | null> {
  const stored = localStorage.getItem(STORAGE_KEY);
  const saltStr = localStorage.getItem(SALT_KEY);
  if (!stored || !saltStr) return null;

  try {
    const salt = new Uint8Array(saltStr.split(',').map(Number));
    const combined = new Uint8Array(
      atob(stored).split('').map(c => c.charCodeAt(0))
    );

    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  } catch {
    return null;
  }
}
```

**Recommendation:** Use the basic pattern (base64 obfuscation) unless there's a specific requirement for stronger protection. The Web Crypto pattern requires users to remember a password, which adds friction.

**Why NOT use crypto-js:**
- Web Crypto API is native, zero dependencies
- crypto-js adds ~400KB to bundle
- crypto-js older versions had security issues with `Math.random()`
- Web Crypto uses hardware acceleration where available

---

## Complete Package Updates

```json
{
  "dependencies": {
    "@google/genai": "^1.30.0",
    "@anthropic-ai/sdk": "^0.39.0",
    "openai": "^4.77.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-rnd": "^10.5.2"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

**Installation command:**
```bash
npm install openai@^4.77.0 @anthropic-ai/sdk@^0.39.0
```

---

## What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| `file-saver` npm package | Overkill for simple downloads; native Blob API sufficient |
| `crypto-js` | Use native Web Crypto API instead; crypto-js is large and had security issues |
| `LiteLLM` (npm) | Server-side only; doesn't work in browser |
| `vercel/ai` SDK | Designed for server components; adds complexity for client-side |
| `langchain.js` | Heavy abstraction; overkill for simple multi-provider switching |
| Environment variables for API keys | Won't work in static GitHub Pages deployment; must be runtime |
| Backend proxy pattern | Adds infrastructure; conflicts with "client-side only" requirement |

---

## Migration Notes from Current Architecture

**Current:** `geminiService.ts` uses `process.env.API_KEY` injected at build time.

**Required Changes:**
1. Remove `process.env.API_KEY` from Vite config (won't work on GitHub Pages)
2. Add settings UI for users to enter their own API keys
3. Store keys in localStorage (using patterns above)
4. Pass API key at runtime to AI service instead of build time
5. Refactor `geminiService.ts` into unified `aiService.ts`

---

## Sources

### File Save/Load
- [Blob - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
- [Programmatically downloading files in browser - LogRocket](https://blog.logrocket.com/programmatically-downloading-files-browser/)
- [Mastering JavaScript BLOBs - Medium](https://mahabub-r.medium.com/mastering-javascript-blobs-from-basics-to-real-world-applications-8adb328d092e)
- [FileSaver.js GitHub](https://github.com/eligrey/FileSaver.js) (evaluated, not recommended)

### Multi-Provider AI
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
- [Claude CORS Support Announcement](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/)
- [LiteLLM Multi-Provider](https://medium.com/@richardhightower/multi-provider-chat-app-litellm-streamlit-ollama-gemini-claude-perplexity-and-modern-llm-afd5218c7eab) (server-side only)

### GitHub Pages Deployment
- [Vite Static Deployment Docs](https://vite.dev/guide/static-deploy)
- [Vite GitHub Pages Guide - Medium](https://medium.com/@aishwaryaparab1/deploying-vite-deploying-vite-app-to-github-pages-166fff40ffd3)
- [Vite Deploy Demo - GitHub](https://github.com/sitek94/vite-deploy-demo)

### API Key Security
- [Web Crypto API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [AES-GCM Encryption Utilities for React](https://urchymanny.medium.com/aes-gcm-encryption-utilities-for-react-application-f0ad82944484)
- [Securing Web Storage Best Practices - DEV](https://dev.to/rigalpatel001/securing-web-storage-localstorage-and-sessionstorage-best-practices-f00)
- [API Key Management Best Practices 2025 - MultitaskAI](https://multitaskai.com/blog/api-key-management-best-practices/)

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| File Save/Load | HIGH | Native browser APIs, well-documented patterns |
| Multi-Provider AI | HIGH | Official SDKs with documented browser support |
| GitHub Pages | HIGH | Official Vite documentation verified |
| API Key Security | MEDIUM | Tradeoff between security and UX; basic pattern sufficient for use case |
