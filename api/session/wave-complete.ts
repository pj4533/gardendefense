import { Redis } from '@upstash/redis';
import { maxScoreForWave } from '../../src/logic/WaveGenerator';

export const config = { runtime: 'edge' };

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const MIN_WAVE_INTERVAL_MS = 5000;

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { sessionId } = body;
  if (!sessionId) {
    return Response.json({ error: 'sessionId required' }, { status: 400 });
  }

  const sessionData = await redis.get(`session:${sessionId}`) as string | null;
  if (!sessionData) {
    return Response.json({ error: 'Invalid or expired session' }, { status: 403 });
  }

  const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;

  const now = Date.now();
  const elapsed = now - (session.lastWaveAt ?? session.createdAt);
  if (elapsed < MIN_WAVE_INTERVAL_MS) {
    return Response.json({ error: 'Too fast between waves' }, { status: 429 });
  }

  const waveNumber = session.wavesCompleted ?? 0;
  const waveMax = maxScoreForWave(waveNumber);

  session.wavesCompleted = waveNumber + 1;
  session.maxPossibleScore = (session.maxPossibleScore ?? 0) + waveMax;
  session.lastWaveAt = now;

  await redis.set(`session:${sessionId}`, JSON.stringify(session), { ex: 3600 });

  return Response.json({
    wavesCompleted: session.wavesCompleted,
    maxPossibleScore: session.maxPossibleScore,
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
