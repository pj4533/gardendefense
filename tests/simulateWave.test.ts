import { describe, it, expect } from 'vitest';
import { simulateWave, WaveResult } from '../src/logic/simulateWave';
import { AgentGameState } from '../src/logic/AgentGameState';
import { TowerType } from '../src/types';
import { STARTING_MONEY, STARTING_LIVES, PATH_WAYPOINTS } from '../src/config';

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

describe('simulateWave', () => {
  it('enemies leak through with no towers', () => {
    const state = makeState();
    const { result, state: updated } = simulateWave(state);

    expect(result.enemiesLeaked).toBeGreaterThan(0);
    expect(result.livesLost).toBeGreaterThan(0);
    expect(updated.lives).toBeLessThan(STARTING_LIVES);
    expect(updated.currentWave).toBeGreaterThanOrEqual(1);
  });

  it('towers kill enemies and earn money', () => {
    // Place several ladybug towers near the path to maximize kills
    const towers = [
      { col: 4, row: 1, type: TowerType.LADYBUG },
      { col: 4, row: 3, type: TowerType.LADYBUG },
      { col: 6, row: 4, type: TowerType.LADYBUG },
      { col: 6, row: 6, type: TowerType.LADYBUG },
      { col: 9, row: 4, type: TowerType.LADYBUG },
      { col: 9, row: 6, type: TowerType.LADYBUG },
      { col: 11, row: 1, type: TowerType.LADYBUG },
      { col: 11, row: 3, type: TowerType.LADYBUG },
    ];
    const state = makeState({
      towers,
      money: STARTING_MONEY - towers.length * 25,
    });
    const { result, state: updated } = simulateWave(state);

    expect(result.enemiesKilled).toBeGreaterThan(0);
    expect(result.moneyEarned).toBeGreaterThan(0);
    expect(updated.score).toBeGreaterThan(0);
  });

  it('detects game over when lives deplete', () => {
    const state = makeState({ lives: 1 });
    const { result, state: updated } = simulateWave(state);

    // With no towers and only 1 life, game should end
    expect(updated.gameOver).toBe(true);
    expect(updated.lives).toBe(0);
  });

  it('tracks score correctly across waves', () => {
    const state = makeState();
    const { state: after1 } = simulateWave(state);

    if (!after1.gameOver) {
      const { state: after2 } = simulateWave(after1);
      expect(after2.score).toBeGreaterThanOrEqual(after1.score);
      expect(after2.currentWave).toBeGreaterThan(after1.currentWave);
    }
  });

  it('preserves towers through simulation', () => {
    const towers = [
      { col: 4, row: 1, type: TowerType.LADYBUG },
      { col: 9, row: 4, type: TowerType.MANTIS },
    ];
    const state = makeState({ towers, money: 25 });
    const { state: updated } = simulateWave(state);

    expect(updated.towers).toEqual(towers);
  });

  it('does not modify the input state', () => {
    const state = makeState();
    const originalMoney = state.money;
    const originalLives = state.lives;
    const originalScore = state.score;

    simulateWave(state);

    expect(state.money).toBe(originalMoney);
    expect(state.lives).toBe(originalLives);
    expect(state.score).toBe(originalScore);
  });

  it('wave clear bonus is positive when wave is cleared', () => {
    // Many towers to ensure wave is cleared
    const towers: AgentGameState['towers'] = [];
    // Place towers along the path for maximum coverage
    for (let col = 1; col <= 14; col++) {
      if (PATH_WAYPOINTS.some(wp => wp.col === col && wp.row === 0)) continue;
      towers.push({ col, row: 0, type: TowerType.LADYBUG });
    }

    const state = makeState({ towers, money: 0 });
    const { result } = simulateWave(state);

    if (result.enemiesLeaked === 0) {
      expect(result.waveClearBonus).toBeGreaterThan(0);
    }
  });
});
