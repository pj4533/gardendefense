import { Redis } from '@upstash/redis';
import { GRID_COLS, GRID_ROWS, TILE_SIZE } from '../../src/config';
import { GameMap } from '../../src/logic/GameMap';
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

  let body: { sessionId?: string; fromCol?: number; fromRow?: number; toCol?: number; toRow?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { sessionId, fromCol, fromRow, toCol, toRow } = body;
  if (!sessionId || typeof fromCol !== 'number' || typeof fromRow !== 'number' ||
      typeof toCol !== 'number' || typeof toRow !== 'number') {
    return Response.json({ error: 'sessionId, fromCol, fromRow, toCol, and toRow are required' }, { status: 400 });
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
    return Response.json({ error: 'Cannot move towers during a wave' }, { status: 400 });
  }

  const towerIndex = session.towers.findIndex(t => t.col === fromCol && t.row === fromRow);
  if (towerIndex === -1) {
    return Response.json({ error: 'No tower at source position' }, { status: 400 });
  }

  if (fromCol === toCol && fromRow === toRow) {
    return Response.json({ error: 'Source and destination are the same' }, { status: 400 });
  }

  const map = new GameMap(GRID_COLS, GRID_ROWS, TILE_SIZE, session.waypoints);
  for (const tower of session.towers) {
    if (tower.col !== fromCol || tower.row !== fromRow) {
      map.placeTower(tower.col, tower.row);
    }
  }

  if (!map.canPlaceTower(toCol, toRow)) {
    return Response.json({ error: 'Cannot move tower to that position' }, { status: 400 });
  }

  session.towers[towerIndex].col = toCol;
  session.towers[towerIndex].row = toRow;

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
