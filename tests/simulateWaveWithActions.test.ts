import { describe, it, expect } from 'vitest';
import { simulateWave } from '../src/logic/simulateWave';
import { simulateWaveWithActions } from '../src/logic/simulateWave';
import { BrowserSessionState } from '../src/logic/BrowserSessionState';
import { AgentGameState } from '../src/logic/AgentGameState';
import { WaveActionType } from '../src/logic/WaveAction';
import { TowerType } from '../src/types';
import { STARTING_MONEY, STARTING_LIVES, PATH_WAYPOINTS } from '../src/config';

function makeBrowserState(overrides?: Partial<BrowserSessionState>): BrowserSessionState {
  return {
    seed: 20260307,
    waypoints: PATH_WAYPOINTS,
    money: STARTING_MONEY,
    lives: STARTING_LIVES,
    score: 0,
    gameOver: false,
    currentWave: 0,
    towers: [],
    createdAt: Date.now(),
    submitted: false,
    waveInProgress: true,
    ...overrides,
  };
}

function makeAgentState(overrides?: Partial<AgentGameState>): AgentGameState {
  return {
    seed: 20260307,
    initials: 'TST',
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

describe('simulateWaveWithActions', () => {
  it('no-action baseline matches simulateWave', () => {
    const browserState = makeBrowserState();
    const agentState = makeAgentState();

    const withActions = simulateWaveWithActions(browserState, []);
    const withoutActions = simulateWave(agentState);

    expect(withActions.result.enemiesKilled).toBe(withoutActions.result.enemiesKilled);
    expect(withActions.result.enemiesLeaked).toBe(withoutActions.result.enemiesLeaked);
    expect(withActions.result.livesLost).toBe(withoutActions.result.livesLost);
    expect(withActions.state.score).toBe(withoutActions.state.score);
    expect(withActions.state.money).toBe(withoutActions.state.money);
    expect(withActions.state.lives).toBe(withoutActions.state.lives);
  });

  it('mid-wave tower placement increases kills vs no towers', () => {
    const stateWithMoney = makeBrowserState({ money: 500 });
    const stateNoTowers = makeBrowserState({ money: 500 });

    // Place a tower at frame 10 (early in the wave)
    const actions = [{
      type: WaveActionType.PLACE as const,
      frame: 10,
      col: 4,
      row: 2,
      towerType: TowerType.LADYBUG,
    }];

    const withTower = simulateWaveWithActions(stateWithMoney, actions);
    const withoutTower = simulateWaveWithActions(stateNoTowers, []);

    // With a tower, we should kill more enemies (or at least not fewer)
    expect(withTower.result.enemiesKilled).toBeGreaterThanOrEqual(withoutTower.result.enemiesKilled);
  });

  it('pre-placed towers work the same as simulateWave', () => {
    const towers = [{ col: 4, row: 1, type: TowerType.LADYBUG }];
    const browserState = makeBrowserState({ money: 500, towers });
    const agentState = makeAgentState({ money: 500, towers });

    const withActions = simulateWaveWithActions(browserState, []);
    const withoutActions = simulateWave(agentState);

    expect(withActions.result.enemiesKilled).toBe(withoutActions.result.enemiesKilled);
    expect(withActions.state.score).toBe(withoutActions.state.score);
  });

  it('sell action during wave removes tower from result', () => {
    const towers = [{ col: 4, row: 1, type: TowerType.LADYBUG }];
    const state = makeBrowserState({ money: 500, towers });

    // Sell the tower at frame 0
    const actions = [{
      type: WaveActionType.SELL as const,
      frame: 0,
      col: 4,
      row: 1,
    }];

    const result = simulateWaveWithActions(state, actions);
    expect(result.state.towers.find(t => t.col === 4 && t.row === 1)).toBeUndefined();
  });

  it('invalid placement (on path) is silently ignored', () => {
    const state = makeBrowserState({ money: 500 });

    // Try to place on a path cell (col 0, row 2 is a path waypoint)
    const actions = [{
      type: WaveActionType.PLACE as const,
      frame: 5,
      col: 0,
      row: 2,
      towerType: TowerType.LADYBUG,
    }];

    // Should not crash
    const result = simulateWaveWithActions(state, actions);
    expect(result.state.towers.find(t => t.col === 0 && t.row === 2)).toBeUndefined();
  });

  it('actions are sorted by frame internally', () => {
    const state = makeBrowserState({ money: 500 });

    // Send actions out of order
    const actions = [
      {
        type: WaveActionType.PLACE as const,
        frame: 100,
        col: 6,
        row: 0,
        towerType: TowerType.LADYBUG,
      },
      {
        type: WaveActionType.PLACE as const,
        frame: 10,
        col: 4,
        row: 0,
        towerType: TowerType.LADYBUG,
      },
    ];

    // Should not crash — actions get sorted internally
    const result = simulateWaveWithActions(state, actions);
    expect(result.state.towers.length).toBeGreaterThanOrEqual(2);
  });

  it('sets waveInProgress to false in result', () => {
    const state = makeBrowserState({ waveInProgress: true });
    const result = simulateWaveWithActions(state, []);
    expect(result.state.waveInProgress).toBe(false);
  });

  it('updates currentWave after completion', () => {
    const state = makeBrowserState({ currentWave: 0 });
    const result = simulateWaveWithActions(state, []);
    // After wave 0 completes, currentWave should advance
    expect(result.state.currentWave).toBeGreaterThanOrEqual(1);
  });
});
