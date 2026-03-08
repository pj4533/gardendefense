import { Redis } from '@upstash/redis';
import { GRID_COLS, GRID_ROWS, TILE_SIZE, TOWER_CONFIGS } from '../../../src/config';
import { TowerType } from '../../../src/types';
import { GameMap } from '../../../src/logic/GameMap';
import { AgentGameState } from '../../../src/logic/AgentGameState';

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

  const url = new URL(req.url);
  const gameId = url.pathname.split('/').at(-2);
  if (!gameId) {
    return Response.json({ error: 'Missing gameId' }, { status: 400 });
  }

  let body: { col?: number; row?: number; type?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { col, row, type } = body;
  if (typeof col !== 'number' || typeof row !== 'number' || typeof type !== 'string') {
    return Response.json({ error: 'col (number), row (number), and type (string) are required' }, { status: 400 });
  }

  if (!VALID_TOWER_TYPES.has(type as TowerType)) {
    return Response.json({ error: `Invalid tower type. Valid types: ${[...VALID_TOWER_TYPES].join(', ')}` }, { status: 400 });
  }

  const towerType = type as TowerType;
  const towerConfig = TOWER_CONFIGS[towerType];

  const data = await redis.get(`game:${gameId}`) as string | null;
  if (!data) {
    return Response.json({ error: 'Game not found or expired' }, { status: 404 });
  }

  const gameState: AgentGameState = typeof data === 'string' ? JSON.parse(data) : data;

  if (gameState.gameOver) {
    return Response.json({ error: 'Game is over' }, { status: 400 });
  }

  if (gameState.money < towerConfig.cost) {
    return Response.json({ error: `Not enough money. Need ${towerConfig.cost}, have ${gameState.money}` }, { status: 400 });
  }

  // Reconstruct grid to check placement validity
  const map = new GameMap(GRID_COLS, GRID_ROWS, TILE_SIZE, gameState.waypoints);
  for (const tower of gameState.towers) {
    map.placeTower(tower.col, tower.row);
  }

  if (!map.canPlaceTower(col, row)) {
    return Response.json({ error: 'Cannot place tower here (cell is not empty)' }, { status: 400 });
  }

  // Update state
  gameState.money -= towerConfig.cost;
  gameState.towers.push({ col, row, type: towerType });

  await redis.set(`game:${gameId}`, JSON.stringify(gameState), { ex: 3600 });

  return Response.json({
    success: true,
    tower: { col, row, type: towerType, cost: towerConfig.cost },
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
