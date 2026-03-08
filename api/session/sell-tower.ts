import { Redis } from '@upstash/redis';
import { TOWER_CONFIGS, SELL_REFUND_RATE } from '../../src/config';
import { BrowserSessionState } from '../../src/logic/BrowserSessionState';

export const config = { runtime: 'edge' };

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

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

  let body: { sessionId?: string; col?: number; row?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { sessionId, col, row } = body;
  if (!sessionId || typeof col !== 'number' || typeof row !== 'number') {
    return Response.json({ error: 'sessionId, col, and row are required' }, { status: 400 });
  }

  const data = await redis.get(`session:${sessionId}`) as string | null;
  if (!data) {
    return Response.json({ error: 'Invalid or expired session' }, { status: 403 });
  }

  const session: BrowserSessionState = typeof data === 'string' ? JSON.parse(data) : data;

  if (session.gameOver) {
    return Response.json({ error: 'Game is over' }, { status: 400 });
  }

  if (session.waveInProgress) {
    return Response.json({ error: 'Cannot sell towers during a wave' }, { status: 400 });
  }

  const towerIndex = session.towers.findIndex(t => t.col === col && t.row === row);
  if (towerIndex === -1) {
    return Response.json({ error: 'No tower at that position' }, { status: 400 });
  }

  const tower = session.towers[towerIndex];
  const refund = Math.floor(TOWER_CONFIGS[tower.type].cost * SELL_REFUND_RATE);

  session.towers.splice(towerIndex, 1);
  session.money += refund;

  await redis.set(`session:${sessionId}`, JSON.stringify(session), { ex: 3600 });

  return Response.json({
    success: true,
    refund,
    state: {
      money: session.money,
      lives: session.lives,
      score: session.score,
      currentWave: session.currentWave,
      gameOver: session.gameOver,
      towers: session.towers,
    },
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
