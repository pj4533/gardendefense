import { TowerType } from '../types';
import { GRID_COLS, GRID_ROWS, TILE_SIZE } from '../config';
import { GameEngine } from './GameEngine';
import { generateWave } from './WaveGenerator';
import { AgentGameState } from './AgentGameState';

export interface WaveResult {
  enemiesKilled: number;
  enemiesLeaked: number;
  livesLost: number;
  moneyEarned: number;
  waveClearBonus: number;
}

export function simulateWave(state: AgentGameState): { result: WaveResult; state: AgentGameState } {
  const engine = new GameEngine(
    GRID_COLS,
    GRID_ROWS,
    TILE_SIZE,
    state.waypoints,
    generateWave,
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

  // Count total spawns by wrapping the wave generator
  let totalSpawned = 0;
  const waveConfig = generateWave(state.currentWave);
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
