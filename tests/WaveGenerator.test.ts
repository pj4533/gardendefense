import { describe, it, expect } from 'vitest';
import { generateWave } from '../src/logic/WaveGenerator';
import { ENEMY_CONFIGS } from '../src/config';

describe('WaveGenerator', () => {
  it('generates valid WaveConfig', () => {
    const wave = generateWave(1);
    expect(wave.enemies).toBeDefined();
    expect(wave.enemies.length).toBeGreaterThan(0);
    for (const group of wave.enemies) {
      expect(group.config.health).toBeGreaterThan(0);
      expect(group.config.speed).toBeGreaterThan(0);
      expect(group.config.reward).toBeGreaterThan(0);
      expect(group.count).toBeGreaterThan(0);
      expect(group.spawnInterval).toBeGreaterThan(0);
    }
  });

  describe('enemy type progression', () => {
    it('waves 1-3 have only aphids', () => {
      for (let w = 1; w <= 3; w++) {
        const wave = generateWave(w);
        expect(wave.enemies).toHaveLength(1);
        expect(wave.enemies[0].config.color).toBe(ENEMY_CONFIGS.aphid.color);
      }
    });

    it('waves 4-7 add ants', () => {
      for (let w = 4; w <= 7; w++) {
        const wave = generateWave(w);
        expect(wave.enemies).toHaveLength(2);
        expect(wave.enemies[0].config.color).toBe(ENEMY_CONFIGS.aphid.color);
        expect(wave.enemies[1].config.color).toBe(ENEMY_CONFIGS.ant.color);
      }
    });

    it('waves 8+ add beetles', () => {
      const wave = generateWave(8);
      expect(wave.enemies).toHaveLength(3);
      expect(wave.enemies[0].config.color).toBe(ENEMY_CONFIGS.aphid.color);
      expect(wave.enemies[1].config.color).toBe(ENEMY_CONFIGS.ant.color);
      expect(wave.enemies[2].config.color).toBe(ENEMY_CONFIGS.beetle.color);
    });
  });

  describe('scaling formulas', () => {
    it('health scales by 12% per wave', () => {
      const wave5 = generateWave(5);
      const expectedHealth = Math.round(ENEMY_CONFIGS.aphid.health * (1 + 0.12 * 5));
      expect(wave5.enemies[0].config.health).toBe(expectedHealth);
    });

    it('speed scales by 3% per wave, capped at 2x', () => {
      const wave10 = generateWave(10);
      const expectedSpeed = Math.min(
        ENEMY_CONFIGS.aphid.speed * (1 + 0.03 * 10),
        ENEMY_CONFIGS.aphid.speed * 2,
      );
      expect(wave10.enemies[0].config.speed).toBe(expectedSpeed);

      // Very high wave - should be capped
      const wave100 = generateWave(100);
      expect(wave100.enemies[0].config.speed).toBe(ENEMY_CONFIGS.aphid.speed * 2);
    });

    it('count scales with wave number', () => {
      const wave0 = generateWave(0);
      expect(wave0.enemies[0].count).toBe(5); // 5 + floor(0 * 1.5) = 5

      const wave10 = generateWave(10);
      expect(wave10.enemies[0].count).toBe(20); // 5 + floor(10 * 1.5) = 20
    });

    it('spawn interval decreases with wave, min 0.3', () => {
      const wave0 = generateWave(0);
      expect(wave0.enemies[0].spawnInterval).toBe(1.0); // max(0.3, 1.0 - 0) = 1.0

      const wave10 = generateWave(10);
      expect(wave10.enemies[0].spawnInterval).toBe(0.5); // max(0.3, 1.0 - 0.5) = 0.5

      const wave20 = generateWave(20);
      expect(wave20.enemies[0].spawnInterval).toBe(0.3); // capped at 0.3
    });

    it('reward scales slowly', () => {
      const wave10 = generateWave(10);
      const expectedReward = ENEMY_CONFIGS.aphid.reward + Math.floor(10 * 0.5);
      expect(wave10.enemies[0].config.reward).toBe(expectedReward);
    });
  });
});
