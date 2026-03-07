import { Redis } from '@upstash/redis';

export const config = { runtime: 'edge' };

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const MAX_SCORE = 100000;
const MIN_DURATION_MS = 30000;

async function computeHmac(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

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

  const body = await req.json();
  const { sessionId, seed, initials, score, signature } = body;

  if (!sessionId || typeof seed !== 'number' || typeof score !== 'number' || !signature || !initials) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const cleaned = String(initials).replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3);
  if (cleaned.length !== 3) {
    return Response.json({ error: 'Initials must be 3 letters' }, { status: 400 });
  }

  if (!Number.isInteger(score) || score <= 0 || score > MAX_SCORE) {
    return Response.json({ error: 'Invalid score' }, { status: 400 });
  }

  const sessionData = await redis.get(`session:${sessionId}`) as string | null;
  if (!sessionData) {
    return Response.json({ error: 'Invalid or expired session' }, { status: 403 });
  }

  const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;

  if (session.seed !== seed) {
    return Response.json({ error: 'Seed mismatch' }, { status: 403 });
  }

  const elapsed = Date.now() - session.createdAt;
  if (elapsed < MIN_DURATION_MS) {
    return Response.json({ error: 'Game too short' }, { status: 403 });
  }

  const expected = await computeHmac(session.secret, `${seed}:${score}:${sessionId}`);
  if (signature !== expected) {
    return Response.json({ error: 'Invalid signature' }, { status: 403 });
  }

  await redis.del(`session:${sessionId}`);

  const leaderboardKey = `leaderboard:${seed}`;
  const member = `${cleaned}:${sessionId}`;
  await redis.zadd(leaderboardKey, { score, member });
  await redis.zremrangebyrank(leaderboardKey, 0, -11);
  await redis.expire(leaderboardKey, 604800);

  const rank = await redis.zrevrank(leaderboardKey, member);

  return Response.json({
    valid: true,
    rank: rank !== null ? rank + 1 : -1,
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
