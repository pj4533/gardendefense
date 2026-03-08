import { Redis } from '@upstash/redis';
import { TOWER_CONFIGS, SELL_REFUND_RATE } from '../../../src/config';
import { AgentGameState } from '../../../src/logic/AgentGameState';

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

  const url = new URL(req.url);
  const gameId = url.pathname.split('/').at(-2);
  if (!gameId) {
    return Response.json({ error: 'Missing gameId' }, { status: 400 });
  }

  let body: { col?: number; row?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { col, row } = body;
  if (typeof col !== 'number' || typeof row !== 'number') {
    return Response.json({ error: 'col (number) and row (number) are required' }, { status: 400 });
  }

  const data = await redis.get(`game:${gameId}`) as string | null;
  if (!data) {
    return Response.json({ error: 'Game not found or expired' }, { status: 404 });
  }

  const gameState: AgentGameState = typeof data === 'string' ? JSON.parse(data) : data;

  if (gameState.gameOver) {
    return Response.json({ error: 'Game is over' }, { status: 400 });
  }

  const towerIndex = gameState.towers.findIndex(t => t.col === col && t.row === row);
  if (towerIndex === -1) {
    return Response.json({ error: 'No tower at that position' }, { status: 400 });
  }

  const tower = gameState.towers[towerIndex];
  const refund = Math.floor(TOWER_CONFIGS[tower.type].cost * SELL_REFUND_RATE);

  gameState.towers.splice(towerIndex, 1);
  gameState.money += refund;

  await redis.set(`game:${gameId}`, JSON.stringify(gameState), { ex: 3600 });

  return Response.json({
    success: true,
    refund,
    state: {
      money: gameState.money,
      lives: gameState.lives,
      score: gameState.score,
      currentWave: gameState.currentWave,
      gameOver: gameState.gameOver,
      towers: gameState.towers,
    },
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
