import { TowerConfig, TowerType } from '../types';
import { Enemy } from './Enemy';

export class Tower {
  col: number;
  row: number;
  x: number;
  y: number;
  type: TowerType;
  damage: number;
  range: number;
  fireRate: number;
  color: number;
  cooldown: number = 0;

  constructor(col: number, row: number, config: TowerConfig, tileSize: number) {
    this.col = col;
    this.row = row;
    this.x = col * tileSize + tileSize / 2;
    this.y = row * tileSize + tileSize / 2;
    this.type = config.type;
    this.damage = config.damage;
    this.range = config.range * tileSize;
    this.fireRate = config.fireRate;
    this.color = config.color;
  }

  update(dt: number, enemies: Enemy[]): Enemy | null {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.cooldown > 0) return null;

    let closestEnemy: Enemy | null = null;
    let closestDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.alive || enemy.reachedEnd) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= this.range && dist < closestDist) {
        closestDist = dist;
        closestEnemy = enemy;
      }
    }

    if (closestEnemy) {
      this.cooldown = 1 / this.fireRate;
      return closestEnemy;
    }

    return null;
  }

  isInRange(enemy: Enemy): boolean {
    const dx = enemy.x - this.x;
    const dy = enemy.y - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.range;
  }
}
