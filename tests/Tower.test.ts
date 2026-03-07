import { describe, it, expect } from 'vitest';
import { Tower } from '../src/logic/Tower';
import { Enemy } from '../src/logic/Enemy';
import { TowerConfig, TowerType, EnemyConfig } from '../src/types';

const TILE = 48;

const basicTowerConfig: TowerConfig = {
  type: TowerType.BASIC,
  cost: 25,
  damage: 10,
  range: 2,
  fireRate: 2,
  color: 0x4488ff,
};

const enemyConfig: EnemyConfig = { health: 100, speed: 100, reward: 10, color: 0xff0000 };

describe('Tower', () => {
  it('initializes with correct values', () => {
    const tower = new Tower(3, 4, basicTowerConfig, TILE);
    expect(tower.col).toBe(3);
    expect(tower.row).toBe(4);
    expect(tower.x).toBe(3 * TILE + TILE / 2);
    expect(tower.y).toBe(4 * TILE + TILE / 2);
    expect(tower.damage).toBe(10);
    expect(tower.range).toBe(2 * TILE);
    expect(tower.fireRate).toBe(2);
    expect(tower.cooldown).toBe(0);
  });

  describe('update', () => {
    it('returns null when no enemies', () => {
      const tower = new Tower(3, 4, basicTowerConfig, TILE);
      const result = tower.update(0.016, []);
      expect(result).toBeNull();
    });

    it('returns null when enemies out of range', () => {
      const tower = new Tower(0, 0, basicTowerConfig, TILE);
      const enemy = new Enemy(enemyConfig, 500, 500);
      const result = tower.update(0.016, [enemy]);
      expect(result).toBeNull();
    });

    it('targets closest enemy in range', () => {
      const tower = new Tower(3, 3, basicTowerConfig, TILE);
      const farEnemy = new Enemy(enemyConfig, tower.x + TILE, tower.y);
      const closeEnemy = new Enemy(enemyConfig, tower.x + 10, tower.y);
      const result = tower.update(0.016, [farEnemy, closeEnemy]);
      expect(result).toBe(closeEnemy);
    });

    it('sets cooldown after firing', () => {
      const tower = new Tower(3, 3, basicTowerConfig, TILE);
      const enemy = new Enemy(enemyConfig, tower.x + 10, tower.y);
      tower.update(0.016, [enemy]);
      expect(tower.cooldown).toBeCloseTo(0.5); // 1 / fireRate(2)
    });

    it('does not fire during cooldown', () => {
      const tower = new Tower(3, 3, basicTowerConfig, TILE);
      const enemy = new Enemy(enemyConfig, tower.x + 10, tower.y);
      tower.update(0.016, [enemy]); // fires, sets cooldown
      const result = tower.update(0.016, [enemy]); // still on cooldown
      expect(result).toBeNull();
    });

    it('fires again after cooldown expires', () => {
      const tower = new Tower(3, 3, basicTowerConfig, TILE);
      const enemy = new Enemy(enemyConfig, tower.x + 10, tower.y);
      tower.update(0.016, [enemy]); // fires, cooldown = 0.5
      tower.update(0.4, [enemy]); // cooldown = 0.1, still waiting
      expect(tower.update(0.016, [enemy])).toBeNull(); // still on cooldown
      const result = tower.update(0.1, [enemy]); // cooldown expires, fires
      expect(result).toBe(enemy);
    });

    it('skips dead enemies', () => {
      const tower = new Tower(3, 3, basicTowerConfig, TILE);
      const enemy = new Enemy(enemyConfig, tower.x + 10, tower.y);
      enemy.alive = false;
      const result = tower.update(0.016, [enemy]);
      expect(result).toBeNull();
    });

    it('skips enemies that reached end', () => {
      const tower = new Tower(3, 3, basicTowerConfig, TILE);
      const enemy = new Enemy(enemyConfig, tower.x + 10, tower.y);
      enemy.reachedEnd = true;
      const result = tower.update(0.016, [enemy]);
      expect(result).toBeNull();
    });
  });

  describe('isInRange', () => {
    it('returns true for enemy within range', () => {
      const tower = new Tower(3, 3, basicTowerConfig, TILE);
      const enemy = new Enemy(enemyConfig, tower.x + 10, tower.y);
      expect(tower.isInRange(enemy)).toBe(true);
    });

    it('returns false for enemy outside range', () => {
      const tower = new Tower(0, 0, basicTowerConfig, TILE);
      const enemy = new Enemy(enemyConfig, 500, 500);
      expect(tower.isInRange(enemy)).toBe(false);
    });
  });
});
