import { Redis } from '@upstash/redis';
import { BrowserSessionState } from '../src/logic/BrowserSessionState';

export const config = { runtime: 'edge' };

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const MIN_DURATION_MS = 30000;

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

  let body: { sessionId?: string; initials?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { sessionId, initials } = body;

  if (!sessionId || !initials) {
    return Response.json({ error: 'sessionId and initials are required' }, { status: 400 });
  }

  const cleaned = String(initials).replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3);
  if (cleaned.length !== 3) {
    return Response.json({ error: 'Initials must be 3 letters' }, { status: 400 });
  }

  const data = await redis.get(`session:${sessionId}`) as string | null;
  if (!data) {
    return Response.json({ error: 'Invalid or expired session' }, { status: 403 });
  }

  const session: BrowserSessionState = typeof data === 'string' ? JSON.parse(data) : data;

  if (!session.gameOver) {
    return Response.json({ error: 'Game is not over' }, { status: 400 });
  }

  if (session.submitted) {
    return Response.json({ error: 'Score already submitted' }, { status: 400 });
  }

  const elapsed = Date.now() - session.createdAt;
  if (elapsed < MIN_DURATION_MS) {
    return Response.json({ error: 'Game too short' }, { status: 403 });
  }

  // Use the server-owned score
  const score = session.score;
  const seed = session.seed;

  // Mark submitted
  session.submitted = true;
  await redis.set(`session:${sessionId}`, JSON.stringify(session), { ex: 3600 });

  const leaderboardKey = `leaderboard:${seed}`;
  const member = `${cleaned}:h:${sessionId}`;
  await redis.zadd(leaderboardKey, { score, member });
  await redis.zremrangebyrank(leaderboardKey, 0, -11);
  await redis.expire(leaderboardKey, 604800);

  const rank = await redis.zrevrank(leaderboardKey, member);

  return Response.json({
    valid: true,
    rank: rank !== null ? rank + 1 : -1,
    score,
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
