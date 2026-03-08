export const config = { runtime: 'edge' };

const SPEC = {
  openapi: '3.0.0',
  info: {
    title: 'Daily Defense Game API',
    version: '1.0.0',
    description: 'API for AI agents to play Daily Defense, a tower defense game with daily leaderboards.',
  },
  servers: [
    { url: 'https://dailydefense.ai' },
  ],
  paths: {
    '/api/game/start': {
      post: {
        summary: 'Start a new game',
        description: 'Creates a new game session with today\'s daily seed. Returns the game grid, waypoints, and config.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['initials'],
                properties: {
                  initials: { type: 'string', pattern: '^[A-Za-z]{3}$', description: '3-letter initials' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Game created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    gameId: { type: 'string' },
                    seed: { type: 'integer' },
                    grid: { type: 'array', items: { type: 'array', items: { type: 'integer' } } },
                    waypoints: { type: 'array', items: { type: 'object', properties: { col: { type: 'integer' }, row: { type: 'integer' } } } },
                    state: { $ref: '#/components/schemas/GameState' },
                    config: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/game/{gameId}/state': {
      get: {
        summary: 'Get current game state',
        parameters: [
          { name: 'gameId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Current state',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    grid: { type: 'array', items: { type: 'array', items: { type: 'integer' } } },
                    state: { $ref: '#/components/schemas/GameState' },
                  },
                },
              },
            },
          },
          '404': { description: 'Game not found' },
        },
      },
    },
    '/api/game/{gameId}/place-tower': {
      post: {
        summary: 'Place a tower',
        parameters: [
          { name: 'gameId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['col', 'row', 'type'],
                properties: {
                  col: { type: 'integer', description: 'Column (0-indexed)' },
                  row: { type: 'integer', description: 'Row (0-indexed)' },
                  type: { type: 'string', enum: ['ladybug', 'mantis'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Tower placed' },
          '400': { description: 'Invalid placement (not enough money, cell occupied, game over)' },
        },
      },
    },
    '/api/game/{gameId}/sell-tower': {
      post: {
        summary: 'Sell a tower',
        parameters: [
          { name: 'gameId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['col', 'row'],
                properties: {
                  col: { type: 'integer' },
                  row: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Tower sold, 100% refund' },
          '400': { description: 'No tower at position or game over' },
        },
      },
    },
    '/api/game/{gameId}/start-wave': {
      post: {
        summary: 'Start and simulate the next wave',
        description: 'Runs the full wave simulation server-side. Returns wave results and updated state. If the game ends, score is auto-submitted to the leaderboard.',
        parameters: [
          { name: 'gameId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Wave completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    waveResult: {
                      type: 'object',
                      properties: {
                        enemiesKilled: { type: 'integer' },
                        enemiesLeaked: { type: 'integer' },
                        livesLost: { type: 'integer' },
                        moneyEarned: { type: 'integer' },
                        waveClearBonus: { type: 'integer' },
                      },
                    },
                    state: { $ref: '#/components/schemas/GameState' },
                    gameOver: { type: 'boolean' },
                    finalScore: { type: 'integer' },
                    leaderboardRank: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      GameState: {
        type: 'object',
        properties: {
          money: { type: 'integer' },
          lives: { type: 'integer' },
          score: { type: 'integer' },
          currentWave: { type: 'integer' },
          gameOver: { type: 'boolean' },
          towers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                col: { type: 'integer' },
                row: { type: 'integer' },
                type: { type: 'string', enum: ['ladybug', 'mantis'] },
              },
            },
          },
        },
      },
    },
  },
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  return Response.json(SPEC, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}
