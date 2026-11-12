export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'custom';

export interface ModelTarget {
  id: string;
  name: string;
  provider: AIProvider;
  apiKeyEnv: string;
  baseURL?: string; // Optional custom endpoint (e.g. Ollama http://localhost:11434/v1 or OpenRouter)
}

export interface AIConfig {
  // Primary model attempted first
  primary: ModelTarget;
  // Fallbacks attempted in sequence if previous fails or has no key
  fallbacks: ModelTarget[];
  temperature?: number;
  maxTokens?: number;
}

export interface CategoryDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
  systemPrompt: string;
  example: string;
}

export const AI_CONFIG: AIConfig = {
  // Only NVIDIA Nemotron 3.5 Free via OpenRouter (zero cost)
  primary: {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA Nemotron 3.5 Lightning (Free)',
    provider: 'openrouter',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    baseURL: 'https://openrouter.ai/api/v1',
  },
  // No paid backups or additional models
  fallbacks: [],
  temperature: 0.7,
};

export const PROMPT_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'general',
    label: 'General / No Category',
    description: 'Enhance clarity, structure, role persona, and output constraints.',
    icon: 'sparkles',
    example: 'Write an email asking for a meeting with my manager to discuss a raise.',
    systemPrompt: `You are an elite Prompt Engineer. Your task is to transform the user's raw prompt into a professional, high-performing AI prompt.
Follow these prompt engineering principles:
1. Assign a precise expert persona / role.
2. Provide clear context, objective, and step-by-step guidance.
3. Specify strict constraints (what to do, what to avoid).
4. Define concrete output format, tone, and examples if needed.
Structure your response in markdown format with clear sections. Also provide a 2-3 sentence "Enhancement Notes" at the bottom explaining what was improved.`,
  },
  {
    id: 'app-planning',
    label: 'Application Planning',
    description: 'Architectural blueprints, tech stack choice, modular tasks, and edge cases.',
    icon: 'layers',
    example: 'A marketplace for local dog walkers with booking and payments.',
    systemPrompt: `You are an expert Systems Architect and Prompt Engineer.
Enhance the user's prompt so that when passed to an AI coding assistant, it generates an exhaustive software specification and architectural blueprint.
Ensure the enhanced prompt asks for:
- Core business problem & target user personas
- Recommended modern tech stack (frontend, backend, database, auth) with rationale
- Complete entity data models and API contract design
- Component hierarchy and state management strategy
- Security, edge cases, error handling, and performance considerations
- Phased milestone roadmap with testable acceptance criteria
Format as an actionable, structured prompt for a senior architect AI.`,
  },
  {
    id: 'recommendations',
    label: 'Idea & Recommendations',
    description: 'Multi-perspective brainstorming, feasibility ranking, and actionable next steps.',
    icon: 'lightbulb',
    example: 'Ways to increase retention for our SaaS onboarding flow.',
    systemPrompt: `You are an expert Strategic Consultant and Creative Director.
Transform the user's prompt into an inquiry that forces the AI to provide deeply thoughtful, non-generic recommendations.
The enhanced prompt should instruct the AI to:
- Explore the request from 3 distinct viewpoints (e.g. User Experience, Business/Growth, Technical Simplicity)
- Include high-impact vs low-effort matrix categorization
- List critical risks, hidden pitfalls, and counter-intuitive ideas
- Provide a prioritized 1-2-3 action plan with quick wins and long-term bets
Maintain structured formatting and sharp clarity.`,
  },
  {
    id: 'image-generation',
    label: 'Image Generation',
    description: 'Optimized prompts for Midjourney, DALL-E 3, and Flux with style & camera details.',
    icon: 'image',
    example: 'A cyberpunk street vendor in Tokyo at night in the rain.',
    systemPrompt: `You are a master AI Visual Art Prompt Engineer specializing in Midjourney, DALL-E 3, and Flux.
Transform the user's raw visual idea into a rich, highly descriptive prompt:
- Subject: Core subject with precise physical traits, clothing, pose, and emotional expression
- Environment: Setting, weather, atmospheric conditions, background elements
- Lighting & Color: Key light, rim light, color grading, shadows, volumetric fog, contrast
- Camera & Optics: Shot type (e.g., medium close-up, wide-angle 35mm), lens characteristics, depth of field, aperture (e.g. f/1.8), shutter effect
- Style & Medium: Digital art, cinematic 35mm film still, oil painting, hyperrealistic photography, render engine (Octane/Unreal 5)
- Include recommended aspect ratio parameters (e.g. --ar 16:9) and negative prompt recommendations.`,
  },
  {
    id: 'audio-generation',
    label: 'Audio & Music',
    description: 'Structured audio prompts for Suno, Udio, and ElevenLabs voiceovers.',
    icon: 'music',
    example: 'An upbeat synthwave track for driving at sunset.',
    systemPrompt: `You are an elite Audio Producer and Prompt Engineer specializing in Suno, Udio, and ElevenLabs.
Transform the user's prompt into a sound generation prompt:
- For Music (Suno/Udio): Genre blend, tempo/BPM, key signature, instruments (analog synths, acoustic drums, 808s), mood/atmosphere, vocal style (male/female, dry, reverb-heavy), and structural tag outline ([Intro], [Verse], [Chorus], [Bridge], [Outro]).
- For Voice / Speech (ElevenLabs): Speaker persona, tone, pacing, vocal timbre, accents, emotional modulation, and audio acoustic space (e.g. studio mic, broadcast, phone filter).
Format cleanly with distinct sections for lyrics/script and style tags.`,
  },
];
