import { TowerType, GridPosition } from '../types';

export interface AgentGameState {
  seed: number;
  initials: string;
  waypoints: GridPosition[];
  money: number;
  lives: number;
  score: number;
  gameOver: boolean;
  currentWave: number;
  towers: { col: number; row: number; type: TowerType }[];
  createdAt: number;
  submitted: boolean;
}
