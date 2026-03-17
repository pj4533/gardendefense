import { TowerType } from '../types';
import { GRID_COLS, GRID_ROWS, TILE_SIZE } from '../config';
import { GameEngine } from './GameEngine';
import { generateWave } from './WaveGenerator';
import { generateWaveSchedule } from './WaveSchedule';
import { AgentGameState } from './AgentGameState';
import { BrowserSessionState } from './BrowserSessionState';
import { WaveAction, WaveActionType } from './WaveAction';

export interface WaveResult {
  enemiesKilled: number;
  enemiesLeaked: number;
  livesLost: number;
  moneyEarned: number;
  waveClearBonus: number;
}

export function simulateWave(state: AgentGameState): { result: WaveResult; state: AgentGameState } {
  const schedule = generateWaveSchedule(state.seed);
  const waveGen = (n: number) => generateWave(n, schedule[n] ?? 'balanced');

  const engine = new GameEngine(
    GRID_COLS,
    GRID_ROWS,
    TILE_SIZE,
    state.waypoints,
    waveGen,
    state.money,
    state.lives,
  );

  // Restore score and wave number
  engine.state.score = state.score;
  engine.waveManager.currentWave = state.currentWave;

  // Replay tower placements — bypass cost check by temporarily giving infinite money
  for (const tower of state.towers) {
    const savedMoney = engine.state.money;
    engine.state.money = Infinity;
    engine.placeTower(tower.col, tower.row, tower.type);
    engine.state.money = savedMoney;
  }

  const livesBefore = engine.state.lives;
  const moneyBefore = engine.state.money;
  const scoreBefore = engine.state.score;

  // Count total spawns using the schedule-aware generator
  let totalSpawned = 0;
  const waveConfig = generateWave(state.currentWave, schedule[state.currentWave] ?? 'balanced');
  for (const group of waveConfig.enemies) {
    totalSpawned += group.count;
  }

  // Start the wave
  engine.startNextWave();

  // Run simulation at 60fps
  const dt = 1 / 60;
  const maxIterations = 60000;

  for (let i = 0; i < maxIterations; i++) {
    engine.update(dt);

    // Wave complete or game over
    if (!engine.waveManager.spawning && engine.enemies.length === 0) break;
    if (engine.state.gameOver) break;
  }

  const livesLost = livesBefore - engine.state.lives;
  const moneyEarned = engine.state.money - moneyBefore;
  const scoreGained = engine.state.score - scoreBefore;
  // Each leaked enemy costs 1 life
  const enemiesLeaked = livesLost;
  // Remaining alive enemies at end (game over case)
  const enemiesRemaining = engine.enemies.filter(e => e.alive).length;
  const enemiesKilled = totalSpawned - enemiesLeaked - enemiesRemaining;
  // Kill rewards add equally to money and score; wave clear bonus only adds to score
  const waveClearBonus = scoreGained - moneyEarned;

  const result: WaveResult = {
    enemiesKilled,
    enemiesLeaked,
    livesLost,
    moneyEarned,
    waveClearBonus,
  };

  const updatedTowers: { col: number; row: number; type: TowerType }[] = engine.towers.map(t => ({
    col: t.col,
    row: t.row,
    type: t.type,
  }));

  const updatedState: AgentGameState = {
    ...state,
    money: engine.state.money,
    lives: engine.state.lives,
    score: engine.state.score,
    gameOver: engine.state.gameOver,
    currentWave: engine.waveManager.currentWave,
    towers: updatedTowers,
  };

  return { result, state: updatedState };
}

export function simulateWaveWithActions(
  state: BrowserSessionState,
  actions: WaveAction[],
): { result: WaveResult; state: BrowserSessionState } {
  const schedule = generateWaveSchedule(state.seed);
  const waveGen = (n: number) => generateWave(n, schedule[n] ?? 'balanced');

  const engine = new GameEngine(
    GRID_COLS,
    GRID_ROWS,
    TILE_SIZE,
    state.waypoints,
    waveGen,
    state.money,
    state.lives,
  );

  // Restore score and wave number
  engine.state.score = state.score;
  engine.waveManager.currentWave = state.currentWave;

  // Replay tower placements — bypass cost check by temporarily giving infinite money
  for (const tower of state.towers) {
    const savedMoney = engine.state.money;
    engine.state.money = Infinity;
    engine.placeTower(tower.col, tower.row, tower.type);
    engine.state.money = savedMoney;
  }

  const livesBefore = engine.state.lives;
  const moneyBefore = engine.state.money;
  const scoreBefore = engine.state.score;

  // Count total spawns using the schedule-aware generator
  let totalSpawned = 0;
  const waveConfig = generateWave(state.currentWave, schedule[state.currentWave] ?? 'balanced');
  for (const group of waveConfig.enemies) {
    totalSpawned += group.count;
  }

  // Sort actions by frame for efficient lookup
  const sortedActions = [...actions].sort((a, b) => a.frame - b.frame);

  // Start the wave
  engine.startNextWave();

  // Run simulation at 60fps, injecting actions at matching frames
  const dt = 1 / 60;
  const maxIterations = 60000;

  let actionIndex = 0;

  for (let frame = 0; frame < maxIterations; frame++) {
    // Apply all actions at this frame BEFORE engine update
    while (actionIndex < sortedActions.length && sortedActions[actionIndex].frame === frame) {
      const action = sortedActions[actionIndex];
      switch (action.type) {
        case WaveActionType.PLACE:
          engine.placeTower(action.col, action.row, action.towerType);
          break;
        case WaveActionType.SELL:
          engine.removeTower(action.col, action.row);
          break;
        case WaveActionType.MOVE:
          engine.moveTower(action.fromCol, action.fromRow, action.toCol, action.toRow);
          break;
      }
      actionIndex++;
    }

    engine.update(dt);

    // Wave complete or game over
    if (!engine.waveManager.spawning && engine.enemies.length === 0) break;
    if (engine.state.gameOver) break;
  }

  const livesLost = livesBefore - engine.state.lives;
  const moneyEarned = engine.state.money - moneyBefore;
  const scoreGained = engine.state.score - scoreBefore;
  const enemiesLeaked = livesLost;
  const enemiesRemaining = engine.enemies.filter(e => e.alive).length;
  const enemiesKilled = totalSpawned - enemiesLeaked - enemiesRemaining;
  const waveClearBonus = scoreGained - moneyEarned;

  const result: WaveResult = {
    enemiesKilled,
    enemiesLeaked,
    livesLost,
    moneyEarned,
    waveClearBonus,
  };

  const updatedTowers: { col: number; row: number; type: TowerType }[] = engine.towers.map(t => ({
    col: t.col,
    row: t.row,
    type: t.type,
  }));

  const updatedState: BrowserSessionState = {
    ...state,
    money: engine.state.money,
    lives: engine.state.lives,
    score: engine.state.score,
    gameOver: engine.state.gameOver,
    currentWave: engine.waveManager.currentWave,
    towers: updatedTowers,
    waveInProgress: false,
  };

  return { result, state: updatedState };
}
