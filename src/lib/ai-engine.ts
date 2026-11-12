import { AI_CONFIG, ModelTarget, PROMPT_CATEGORIES } from '../config/ai.config';

export interface EnhanceResult {
  enhancedPrompt: string;
  modelUsed: string;
  providerUsed: string;
  isFallback: boolean;
  chainLog: { target: string; status: 'success' | 'failed' | 'skipped'; reason?: string }[];
}

// Native fetch calls for each provider format
async function callGemini(model: string, apiKey: string, systemPrompt: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n---\nRAW USER PROMPT TO ENHANCE:\n"${prompt}"\n\nReturn the fully rewritten, structured, production-ready enhanced prompt.` }],
        },
      ],
      generationConfig: {
        temperature: AI_CONFIG.temperature || 0.7,
        maxOutputTokens: AI_CONFIG.maxTokens || 2500,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText.slice(0, 150)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned an empty response');
  return text;
}

async function callOpenAICompatible(
  model: string,
  apiKey: string,
  baseURL: string | undefined,
  systemPrompt: string,
  prompt: string
): Promise<string> {
  const url = `${baseURL ? baseURL.replace(/\/+$/, '') : 'https://api.openai.com/v1'}/chat/completions`;
  const requestBody: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `RAW USER PROMPT TO ENHANCE:\n"${prompt}"\n\nReturn the fully rewritten, structured, production-ready enhanced prompt.` },
    ],
    temperature: AI_CONFIG.temperature ?? 0.7,
  };

  if (AI_CONFIG.maxTokens) {
    requestBody.max_tokens = AI_CONFIG.maxTokens;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'PromptForge Agent',
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI-compatible error (${res.status}): ${errorText.slice(0, 150)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned an empty response');
  return text;
}

async function callAnthropic(model: string, apiKey: string, systemPrompt: string, prompt: string): Promise<string> {
  const url = 'https://api.anthropic.com/v1/messages';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `RAW USER PROMPT TO ENHANCE:\n"${prompt}"\n\nReturn the fully rewritten, structured, production-ready enhanced prompt.` },
      ],
      max_tokens: AI_CONFIG.maxTokens || 2500,
      temperature: AI_CONFIG.temperature || 0.7,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errorText.slice(0, 150)}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Anthropic returned an empty response');
  return text;
}

// Fallback heuristic enhancer when no API key is set yet
function generateHeuristicEnhancedPrompt(category: string, rawPrompt: string): string {
  const cleaned = rawPrompt.trim();

  if (category === 'app-planning') {
    return `# Architecture & Implementation Blueprint: ${cleaned.slice(0, 50)}...

## 1. Executive Summary & Problem Scope
You are a Principal Software Architect. Design an end-to-end, production-ready architecture for:
> "${cleaned}"

## 2. Technical Stack Specification
- **Frontend**: Next.js 15+ (App Router, React 19, TypeScript, Tailwind CSS)
- **Backend / API**: Next.js Server Actions / API Routes + Edge runtime where applicable
- **Database & Storage**: PostgreSQL (Prisma or Drizzle ORM) + Redis for caching/rate-limiting
- **Authentication**: Auth.js / Clerk / Supabase Auth (Role-based access control)
- **Deployment**: Vercel / Docker containerization with CI/CD GitHub Actions

## 3. Core Entities & Data Schema
Define TypeScript interfaces and database schemas for all core resources, including relationships, indexing, and cascade delete rules.

## 4. Key Workflows & API Endpoints
1. Detail user journey and state transitions.
2. Provide full OpenAPI / REST route contracts with input validation (Zod schemas) and HTTP error status codes.

## 5. Security & Edge Case Handling
- Rate limiting, CSRF protection, input sanitization, and secrets management.
- Offline behavior, network retry strategies, and idempotency keys.

## 6. Phased Implementation Roadmap
Provide an actionable 3-phase milestone breakdown with concrete acceptance criteria for each phase.`;
  }

  if (category === 'image-generation') {
    return `**Prompt (Midjourney v6 / Flux / DALL-E 3):**
A cinematic, ultra-detailed shot of ${cleaned}. Hyperrealistic atmosphere, dramatic lighting with subtle volumetric rays, 85mm portrait lens, f/1.8 aperture, soft cinematic bokeh background, rich color grading with contrasting shadows, fine textural details, rendered in Octane Unreal Engine 5 aesthetic, photorealistic --ar 16:9 --style raw --v 6.0

**Negative Prompt:**
blurry, low resolution, artifacts, distorted anatomy, extra limbs, oversaturated, watermarks, signature, grainy, low poly`;
  }

  if (category === 'audio-generation') {
    return `**Music & Audio Generation Specification:**

**Genre & Style:** Modern High-Production Soundscape / ${cleaned}
**Tempo (BPM):** 118 BPM, 4/4 Time Signature, Key of D Minor
**Instrumentation:** Warm analog synthesizers, dynamic punchy kick, sub-bass, textured percussion, ambient reverb tails
**Vocal Style:** Smooth, expressive, crystal-clear studio vocal processing with subtle delay
**Vibe & Emotion:** Atmospheric, immersive, emotionally resonant

**Arrangement Tags (Suno / Udio syntax):**
[Intro - Soft ambient synth pads building up]
[Verse 1 - Driving rhythmic groove enters]
[Pre-Chorus - Rising snare roll and frequency sweeps]
[Chorus - Full dynamic drop with wide stereo synths]
[Outro - Fading rhythm leaving atmospheric ambient drone]`;
  }

  if (category === 'recommendations') {
    return `# Strategic Advisory & Recommendation Matrix

**Target Challenge:**
> "${cleaned}"

### 1. Multi-Perspective Analysis
- **Perspective A (User Value & Usability):** Focus on simplicity, immediate feedback loops, and frictionless onboarding.
- **Perspective B (Scalability & Technical Feasibility):** Emphasize minimal dependencies, modular design, and low maintenance overhead.
- **Perspective C (Business Impact & Growth):** Optimize for measurable retention, clear ROI, and competitive differentiation.

### 2. Prioritized Action Matrix (Impact vs. Effort)
| Initiative | Expected Impact | Implementation Effort | Priority Rank |
|:---|:---:|:---:|:---:|
| Core Workflow Simplification | High | Low | P0 (Immediate Win) |
| Automated Feedback Loop | High | Medium | P1 (Next Sprint) |
| Advanced Customizations | Medium | High | P2 (Backlog) |

### 3. Critical Pitfalls to Avoid
- Avoid early premature optimization before user feedback is collected.
- Do not add features that increase operational cognitive load.`;
  }

  // General default
  return `### Role & Persona
You are a senior domain expert and technical specialist.

### Objective
Provide an exhaustive, high-precision solution for the following request:
> "${cleaned}"

### Requirements & Constraints
1. **Depth & Rigor**: Provide concrete, actionable, and mathematically or technically verified steps. Avoid generic platitudes.
2. **Structure**: Organize the output using clear markdown headings, bulleted lists, and step-by-step sequences.
3. **Edge Cases**: Proactively identify at least two potential failure modes or edge cases and supply mitigation strategies.
4. **Tone**: Direct, concise, professional, and objective.

### Expected Deliverable
Deliver the final response formatted with clear section headers, concise rationale for all choices made, and ready-to-execute next steps.`;
}

export async function enhancePrompt(
  rawPrompt: string,
  categoryId: string = 'general',
  userKeyOverride?: string
): Promise<EnhanceResult> {
  const category = PROMPT_CATEGORIES.find((c) => c.id === categoryId) || PROMPT_CATEGORIES[0];
  const targets: ModelTarget[] = [AI_CONFIG.primary, ...AI_CONFIG.fallbacks];
  const chainLog: EnhanceResult['chainLog'] = [];

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const apiKey = userKeyOverride || process.env[target.apiKeyEnv];

    if (!apiKey && target.provider !== 'custom') {
      chainLog.push({
        target: `${target.name} (${target.provider})`,
        status: 'skipped',
        reason: `Missing environment variable ${target.apiKeyEnv}`,
      });
      continue;
    }

    try {
      let resultText = '';
      if (target.provider === 'gemini') {
        resultText = await callGemini(target.id, apiKey || '', category.systemPrompt, rawPrompt);
      } else if (target.provider === 'openai' || target.provider === 'openrouter' || target.provider === 'custom') {
        resultText = await callOpenAICompatible(target.id, apiKey || 'ollama', target.baseURL, category.systemPrompt, rawPrompt);
      } else if (target.provider === 'anthropic') {
        resultText = await callAnthropic(target.id, apiKey || '', category.systemPrompt, rawPrompt);
      }

      chainLog.push({ target: `${target.name} (${target.provider})`, status: 'success' });

      return {
        enhancedPrompt: resultText,
        modelUsed: target.name,
        providerUsed: target.provider,
        isFallback: i > 0,
        chainLog,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      chainLog.push({
        target: `${target.name} (${target.provider})`,
        status: 'failed',
        reason: errorMsg,
      });
      // Continue to next fallback in loop
    }
  }

  // If all external providers were skipped or failed, fallback to heuristic prompt engineering engine
  const heuristicEnhanced = generateHeuristicEnhancedPrompt(categoryId, rawPrompt);
  return {
    enhancedPrompt: heuristicEnhanced,
    modelUsed: 'Heuristic Prompt Engineer (Offline Rules Engine)',
    providerUsed: 'local-heuristic',
    isFallback: true,
    chainLog,
  };
}
