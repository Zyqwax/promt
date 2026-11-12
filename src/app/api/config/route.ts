import { NextResponse } from 'next/server';
import { AI_CONFIG, PROMPT_CATEGORIES } from '@/config/ai.config';

export async function GET() {
  const isKeyPresent = (envVar: string) => Boolean(process.env[envVar]);

  return NextResponse.json({
    categories: PROMPT_CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      description: c.description,
      example: c.example,
      icon: c.icon,
    })),
    config: {
      primary: {
        name: AI_CONFIG.primary.name,
        provider: AI_CONFIG.primary.provider,
        id: AI_CONFIG.primary.id,
        isConfigured: isKeyPresent(AI_CONFIG.primary.apiKeyEnv),
      },
      fallbacks: AI_CONFIG.fallbacks.map((f) => ({
        name: f.name,
        provider: f.provider,
        id: f.id,
        isConfigured: f.provider === 'custom' ? true : isKeyPresent(f.apiKeyEnv),
      })),
    },
  });
}
