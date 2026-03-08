import { Redis } from '@upstash/redis';
import { GRID_COLS, GRID_ROWS, TILE_SIZE, TOWER_CONFIGS } from '../../src/config';
import { TowerType } from '../../src/types';
import { GameMap } from '../../src/logic/GameMap';
import { BrowserSessionState } from '../../src/logic/BrowserSessionState';

export const config = { runtime: 'edge' };

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const VALID_TOWER_TYPES = new Set(Object.values(TowerType));

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

  let body: { sessionId?: string; col?: number; row?: number; type?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { sessionId, col, row, type } = body;
  if (!sessionId || typeof col !== 'number' || typeof row !== 'number' || typeof type !== 'string') {
    return Response.json({ error: 'sessionId, col, row, and type are required' }, { status: 400 });
  }

  if (!VALID_TOWER_TYPES.has(type as TowerType)) {
    return Response.json({ error: `Invalid tower type` }, { status: 400 });
  }

  const towerType = type as TowerType;
  const towerConfig = TOWER_CONFIGS[towerType];

  const data = await redis.get(`session:${sessionId}`) as string | null;
  if (!data) {
    return Response.json({ error: 'Invalid or expired session' }, { status: 403 });
  }

  const session: BrowserSessionState = typeof data === 'string' ? JSON.parse(data) : data;

  if (session.gameOver) {
    return Response.json({ error: 'Game is over' }, { status: 400 });
  }

  if (session.waveInProgress) {
    return Response.json({ error: 'Cannot place towers during a wave' }, { status: 400 });
  }

  if (session.money < towerConfig.cost) {
    return Response.json({ error: `Not enough money. Need ${towerConfig.cost}, have ${session.money}` }, { status: 400 });
  }

  const map = new GameMap(GRID_COLS, GRID_ROWS, TILE_SIZE, session.waypoints);
  for (const tower of session.towers) {
    map.placeTower(tower.col, tower.row);
  }

  if (!map.canPlaceTower(col, row)) {
    return Response.json({ error: 'Cannot place tower here' }, { status: 400 });
  }

  session.money -= towerConfig.cost;
  session.towers.push({ col, row, type: towerType });

  await redis.set(`session:${sessionId}`, JSON.stringify(session), { ex: 3600 });

  return Response.json({
    success: true,
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
