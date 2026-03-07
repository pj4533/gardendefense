import { describe, it, expect } from 'vitest';
import { WaveManager } from '../src/logic/WaveManager';
import { WaveConfig, EnemyConfig } from '../src/types';

const enemyA: EnemyConfig = { health: 50, speed: 100, reward: 10, color: 0xff0000 };
const enemyB: EnemyConfig = { health: 100, speed: 50, reward: 20, color: 0x00ff00 };

const wave0: WaveConfig = { enemies: [{ config: enemyA, count: 3, spawnInterval: 1.0 }] };
const wave1: WaveConfig = {
  enemies: [
    { config: enemyA, count: 2, spawnInterval: 0.5 },
    { config: enemyB, count: 1, spawnInterval: 1.0 },
  ],
};

function testGenerator(n: number): WaveConfig {
  return n === 0 ? wave0 : wave1;
}

describe('WaveManager', () => {
  it('initializes correctly', () => {
    const wm = new WaveManager(testGenerator);
    expect(wm.currentWave).toBe(0);
    expect(wm.spawning).toBe(false);
  });

  describe('startWave', () => {
    it('starts the first wave', () => {
      const wm = new WaveManager(testGenerator);
      expect(wm.startWave()).toBe(true);
      expect(wm.spawning).toBe(true);
    });

    it('returns false if already spawning', () => {
      const wm = new WaveManager(testGenerator);
      wm.startWave();
      expect(wm.startWave()).toBe(false);
    });

    it('never refuses — waves continue indefinitely', () => {
      const wm = new WaveManager(testGenerator);
      // Complete wave 0
      wm.startWave();
      for (let i = 0; i < 200; i++) wm.update(0.1);
      // Complete wave 1
      wm.startWave();
      for (let i = 0; i < 200; i++) wm.update(0.1);
      // Wave 2 should still start
      expect(wm.startWave()).toBe(true);
    });
  });

  describe('update', () => {
    it('returns null when not spawning', () => {
      const wm = new WaveManager(testGenerator);
      expect(wm.update(0.016)).toBeNull();
    });

    it('spawns first enemy immediately', () => {
      const wm = new WaveManager(testGenerator);
      wm.startWave();
      const config = wm.update(0.016);
      expect(config).toBe(enemyA);
    });

    it('waits spawnInterval between enemies', () => {
      const wm = new WaveManager(testGenerator);
      wm.startWave();
      wm.update(0.016); // spawn 1st
      expect(wm.update(0.5)).toBeNull(); // only 0.5s passed, need 1.0
      expect(wm.update(0.5)).toBe(enemyA); // now at ~1.016s, spawn 2nd
    });

    it('spawns all enemies in a wave', () => {
      const wm = new WaveManager(testGenerator);
      wm.startWave();
      const spawned: EnemyConfig[] = [];
      for (let i = 0; i < 100; i++) {
        const config = wm.update(0.1);
        if (config) spawned.push(config);
      }
      expect(spawned).toHaveLength(3);
      expect(spawned.every(c => c === enemyA)).toBe(true);
    });

    it('stops spawning after wave completes', () => {
      const wm = new WaveManager(testGenerator);
      wm.startWave();
      for (let i = 0; i < 200; i++) {
        wm.update(0.1);
      }
      expect(wm.spawning).toBe(false);
      expect(wm.currentWave).toBe(1);
    });

    it('handles multiple enemy groups in a wave', () => {
      const wm = new WaveManager(testGenerator);
      // Complete wave 0
      wm.startWave();
      for (let i = 0; i < 200; i++) wm.update(0.1);

      // Start wave 1 (has 2 groups)
      wm.startWave();
      const spawned: EnemyConfig[] = [];
      for (let i = 0; i < 200; i++) {
        const config = wm.update(0.1);
        if (config) spawned.push(config);
      }
      // Wave 1: 2x enemyA + 1x enemyB = 3 total
      expect(spawned).toHaveLength(3);
      expect(spawned.filter(c => c === enemyA)).toHaveLength(2);
      expect(spawned.filter(c => c === enemyB)).toHaveLength(1);
    });
  });
});
