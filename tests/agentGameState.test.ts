import { describe, it, expect } from 'vitest';
import { AgentGameState } from '../src/logic/AgentGameState';
import { TowerType, CellType } from '../src/types';
import { GRID_COLS, GRID_ROWS, TILE_SIZE, STARTING_MONEY, STARTING_LIVES } from '../src/config';
import { GameEngine } from '../src/logic/GameEngine';
import { generateWave } from '../src/logic/WaveGenerator';
import { PATH_WAYPOINTS } from '../src/config';

describe('AgentGameState', () => {
  function makeState(overrides: Partial<AgentGameState> = {}): AgentGameState {
    return {
      seed: 20260307,
      initials: 'BOT',
      waypoints: PATH_WAYPOINTS,
      money: STARTING_MONEY,
      lives: STARTING_LIVES,
      score: 0,
      gameOver: false,
      currentWave: 0,
      towers: [],
      createdAt: Date.now(),
      submitted: false,
      ...overrides,
    };
  }

  it('round-trips through JSON serialization', () => {
    const state = makeState({
      towers: [
        { col: 3, row: 1, type: TowerType.LADYBUG },
        { col: 7, row: 4, type: TowerType.MANTIS },
      ],
      money: 50,
      score: 200,
      currentWave: 3,
    });

    const json = JSON.stringify(state);
    const restored: AgentGameState = JSON.parse(json);

    expect(restored.seed).toBe(state.seed);
    expect(restored.initials).toBe(state.initials);
    expect(restored.money).toBe(state.money);
    expect(restored.lives).toBe(state.lives);
    expect(restored.score).toBe(state.score);
    expect(restored.gameOver).toBe(state.gameOver);
    expect(restored.currentWave).toBe(state.currentWave);
    expect(restored.towers).toEqual(state.towers);
    expect(restored.waypoints).toEqual(state.waypoints);
    expect(restored.submitted).toBe(false);
  });

  it('can reconstruct a GameEngine from state', () => {
    const state = makeState({
      towers: [{ col: 3, row: 1, type: TowerType.LADYBUG }],
      money: 75,
      score: 100,
      currentWave: 2,
    });

    const engine = new GameEngine(
      GRID_COLS, GRID_ROWS, TILE_SIZE,
      state.waypoints, generateWave,
      state.money, state.lives,
    );
    engine.state.score = state.score;
    engine.waveManager.currentWave = state.currentWave;

    // Place towers with infinite money bypass
    for (const tower of state.towers) {
      const saved = engine.state.money;
      engine.state.money = Infinity;
      engine.placeTower(tower.col, tower.row, tower.type);
      engine.state.money = saved;
    }

    expect(engine.state.money).toBe(75);
    expect(engine.state.lives).toBe(STARTING_LIVES);
    expect(engine.state.score).toBe(100);
    expect(engine.waveManager.currentWave).toBe(2);
    expect(engine.towers.length).toBe(1);
    expect(engine.towers[0].col).toBe(3);
    expect(engine.towers[0].row).toBe(1);
    expect(engine.map.getCell(3, 1)).toBe(CellType.TOWER);
  });

  it('preserves all waypoints through reconstruction', () => {
    const customWaypoints = [
      { col: 0, row: 3 },
      { col: 6, row: 3 },
      { col: 6, row: 7 },
      { col: 15, row: 7 },
    ];
    const state = makeState({ waypoints: customWaypoints });

    const engine = new GameEngine(
      GRID_COLS, GRID_ROWS, TILE_SIZE,
      state.waypoints, generateWave,
      state.money, state.lives,
    );

    // Verify path cells are marked
    expect(engine.map.getCell(0, 3)).toBe(CellType.PATH);
    expect(engine.map.getCell(6, 3)).toBe(CellType.PATH);
    expect(engine.map.getCell(6, 7)).toBe(CellType.PATH);
    expect(engine.map.getCell(15, 7)).toBe(CellType.PATH);
  });
});
