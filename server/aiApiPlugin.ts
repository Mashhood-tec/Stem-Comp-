import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

type Env = Record<string, string | undefined>;

const GAME_IDS = [
  'football',
  'heritageRiddleRelay',
  'desertExpedition',
  'emiratiCharades',
  'cultureSportsChallenge',
] as const;
type GameId = (typeof GAME_IDS)[number];

const SYSTEM_PROMPT = `You write content for "Family AI Game Day", a family party-game web app used in the United Arab Emirates by students in Grades 6-8 and their families.
Rules for every item:
- Family-friendly, kind, inclusive and culturally respectful. No violence, romance, politics, religion-specific rituals, gambling, brands, real private people, or stereotypes.
- Only use well-known, widely accepted facts about UAE culture, heritage, geography and sport. If you are unsure a fact is correct, pick a different topic.
- Short, clear sentences suitable for reading aloud.
- Reply with ONE JSON object only, no markdown, matching the requested shape exactly.`;

const GAME_PROMPTS: Record<GameId, string> = {
  football: `Create one football "match mission" card that two family teams try to complete during a casual garden football match. It must be safe (no heading the ball, no slide tackles) and checkable by a human host.
Shape: {"title": string (max 40 chars), "category": "Team Mission" | "Skill Challenge" | "Fair Play" | "Tactics" | "Celebration", "instruction": string (max 200 chars), "successCriteria": string (how the host decides it was completed, max 160 chars), "difficulty": "Easy" | "Medium" | "Hard"}`,
  heritageRiddleRelay: `Create one riddle about UAE heritage or culture (hospitality, crafts, traditional architecture, historical transport, landscapes, celebrations, food or customs). The answer must be a single well-known thing.
Shape: {"title": string (max 40 chars), "topic": string (max 30 chars), "riddle": string (written as "I am..." clues, max 260 chars), "hint": string (max 120 chars), "answer": string (max 40 chars), "explanation": string (one or two accurate sentences, max 240 chars), "difficulty": "Easy" | "Medium" | "Hard"}`,
  desertExpedition: `Create one fictional family desert-expedition story round for a team decision game. It is imaginative storytelling, not real survival training. Encourage teamwork, kindness, care for nature and reasoning.
Shape: {"title": string (max 40 chars), "scenario": string (story introduction, max 320 chars), "challenge": string (the question the team must decide, max 160 chars), "choices": string[] (exactly 3 or 4 short options, max 90 chars each), "suggestedChoice": number (0-based index of the most sensible choice), "hostGuidance": string (why that choice is sensible, max 260 chars), "scoringCriteria": string[] (2-3 things the host listens for, max 90 chars each), "followUp": string (optional quick bonus task, max 140 chars), "difficulty": "Easy" | "Medium" | "Hard"}`,
  emiratiCharades: `Create one charades prompt that a family member can act out silently. Themes: family activities, heritage objects and traditions, sports movements, everyday activities or UAE-inspired places and pastimes. Must be respectful and easy to mime.
Shape: {"title": string (same as prompt), "category": "Family Activities" | "Heritage & Traditions" | "Sports Moves" | "Everyday Life" | "UAE Themes", "prompt": string (2-5 words), "actingTip": string (max 120 chars), "difficulty": "Easy" | "Medium" | "Hard"}`,
  cultureSportsChallenge: `Create one quick-fire challenge for a 60-second round. It can be a short question with a clear answer, or a short creative task the host can judge.
Shape: {"title": string (max 40 chars), "category": "Sports" | "UAE Culture" | "Teamwork" | "Creative" | "General Knowledge", "kind": "question" | "task", "prompt": string (max 160 chars), "hint": string (optional, max 100 chars), "answer": string (expected answer, or what a good response looks like for tasks, max 140 chars), "difficulty": "Easy" | "Medium" | "Hard"}`,
};

const MAX_BODY_BYTES = 8 * 1024;
const REQUEST_TIMEOUT_MS = 25_000;

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && (GAME_IDS as readonly string[]).includes(value);
}

function createHandler(env: Env) {
  const apiKey = env.OPENAI_API_KEY?.trim();
  const model = env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  const baseUrl = (env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/+$/, '');

  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ?? '';
    if (!url.startsWith('/api/ai/')) return next();

    if (url.startsWith('/api/ai/status') && req.method === 'GET') {
      return sendJson(res, 200, { configured: Boolean(apiKey), model: apiKey ? model : null });
    }

    if (url.startsWith('/api/ai/generate') && req.method === 'POST') {
      if (!apiKey) {
        return sendJson(res, 503, { error: 'Live AI is not configured on this server.' });
      }
      let gameId: GameId;
      let avoid: string[] = [];
      try {
        const parsed = JSON.parse(await readBody(req)) as { gameId?: unknown; avoid?: unknown };
        if (!isGameId(parsed.gameId)) return sendJson(res, 400, { error: 'Unknown game.' });
        gameId = parsed.gameId;
        if (Array.isArray(parsed.avoid)) {
          avoid = parsed.avoid.filter((t): t is string => typeof t === 'string').slice(0, 40).map((t) => t.slice(0, 60));
        }
      } catch {
        return sendJson(res, 400, { error: 'Invalid request.' });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const avoidLine = avoid.length ? `\nDo not repeat any of these existing titles or answers: ${avoid.join('; ')}.` : '';
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            temperature: 0.9,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: GAME_PROMPTS[gameId] + avoidLine },
            ],
          }),
        });
        if (!response.ok) {
          return sendJson(res, 502, { error: `The AI provider returned an error (${response.status}).` });
        }
        const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
        const text = data.choices?.[0]?.message?.content;
        if (!text) return sendJson(res, 502, { error: 'The AI provider returned an empty response.' });
        let item: unknown;
        try {
          item = JSON.parse(text);
        } catch {
          return sendJson(res, 502, { error: 'The AI response was not valid JSON.' });
        }
        return sendJson(res, 200, { item, model });
      } catch (error) {
        const aborted = error instanceof Error && error.name === 'AbortError';
        return sendJson(res, 504, { error: aborted ? 'The AI provider took too long to respond.' : 'Could not reach the AI provider.' });
      } finally {
        clearTimeout(timeout);
      }
    }

    return sendJson(res, 404, { error: 'Not found.' });
  };
}

export function aiApiPlugin(env: Env): Plugin {
  const handler = createHandler(env);
  return {
    name: 'family-ai-game-day-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
