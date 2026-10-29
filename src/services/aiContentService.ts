import type { GameContent } from '../types/content';
import type { GameId } from '../types/game';
import { validateLiveContent } from '../utils/validation';

export interface AiStatus {
  /** True only when the server confirms an AI provider key is configured. */
  configured: boolean;
  model: string | null;
  checked: boolean;
}

export const UNKNOWN_AI_STATUS: AiStatus = { configured: false, model: null, checked: false };

export class AiGenerationError extends Error {}

const GENERATE_TIMEOUT_MS = 30_000;

export async function fetchAiStatus(): Promise<AiStatus> {
  try {
    const response = await fetch('/api/ai/status', { headers: { Accept: 'application/json' } });
    if (!response.ok) return { configured: false, model: null, checked: true };
    const data = (await response.json()) as { configured?: unknown; model?: unknown };
    return {
      configured: data.configured === true,
      model: typeof data.model === 'string' ? data.model : null,
      checked: true,
    };
  } catch {
    // No server endpoint (e.g. static hosting or offline): prepared content only.
    return { configured: false, model: null, checked: true };
  }
}

/** Requests one new live AI item from the server and validates it before it can be used in play. */
export async function generateLiveContent(gameId: GameId, avoidTitles: string[]): Promise<GameContent> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);
  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ gameId, avoid: avoidTitles.slice(-30) }),
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as { item?: unknown; error?: unknown };
    if (!response.ok) {
      throw new AiGenerationError(typeof data.error === 'string' ? data.error : `Live AI request failed (${response.status}).`);
    }
    const result = validateLiveContent(gameId, data.item);
    if (!result.ok) throw new AiGenerationError(result.reason);
    return result.item;
  } catch (error) {
    if (error instanceof AiGenerationError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AiGenerationError('Live AI took too long to respond.');
    }
    throw new AiGenerationError('Could not reach the live AI service.');
  } finally {
    window.clearTimeout(timeout);
  }
}
