import { Redis } from '@upstash/redis';
import { GRID_COLS, GRID_ROWS, TILE_SIZE } from '../../../src/config';
import { CellType } from '../../../src/types';
import { GameMap } from '../../../src/logic/GameMap';
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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const url = new URL(req.url);
  const gameId = url.pathname.split('/').at(-2);
  if (!gameId) {
    return Response.json({ error: 'Missing gameId' }, { status: 400 });
  }

  const data = await redis.get(`game:${gameId}`) as string | null;
  if (!data) {
    return Response.json({ error: 'Game not found or expired' }, { status: 404 });
  }

  const gameState: AgentGameState = typeof data === 'string' ? JSON.parse(data) : data;

  // Reconstruct grid
  const map = new GameMap(GRID_COLS, GRID_ROWS, TILE_SIZE, gameState.waypoints);
  for (const tower of gameState.towers) {
    map.placeTower(tower.col, tower.row);
  }

  const grid: CellType[][] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    grid[row] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      grid[row][col] = map.getCell(col, row);
    }
  }

  return Response.json({
    grid,
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
