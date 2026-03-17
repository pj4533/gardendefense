import { WaveConfig, EnemyConfig } from '../types';
import { ENEMY_CONFIGS, WAVE_CLEAR_BONUS } from '../config';
import { WaveProfileName, getWaveProfile } from './WaveSchedule';

export function generateWave(waveNumber: number, profile: WaveProfileName = 'balanced'): WaveConfig {
  const p = getWaveProfile(profile);
  const enemies: WaveConfig['enemies'] = [];

  const baseInterval = Math.max(0.15, 0.8 - waveNumber * 0.15);
  const spawnInterval = Math.max(0.15, baseInterval / p.speed_mult);
  const baseCount = 8 + Math.floor(waveNumber * 3.5);

  // Aphids always present
  const aphidCount = Math.floor(baseCount * p.aphid_ratio * p.count_mult);
  if (aphidCount > 0) {
    enemies.push({
      config: scaleEnemy(ENEMY_CONFIGS.aphid, waveNumber),
      count: aphidCount,
      spawnInterval,
    });
  }

  // Ants from wave 1+
  if (waveNumber >= 1) {
    const antCount = Math.floor(baseCount * 0.8 * p.ant_ratio * p.count_mult);
    if (antCount > 0) {
      enemies.push({
        config: scaleEnemy(ENEMY_CONFIGS.ant, waveNumber),
        count: antCount,
        spawnInterval,
      });
    }
  }

  // Beetles from wave 3+
  if (waveNumber >= 3) {
    const beetleCount = Math.floor(baseCount * 0.5 * p.beetle_ratio * p.count_mult);
    if (beetleCount > 0) {
      enemies.push({
        config: scaleEnemy(ENEMY_CONFIGS.beetle, waveNumber),
        count: beetleCount,
        spawnInterval,
      });
    }
  }

  return { enemies };
}

/** Compute the maximum possible score for a given wave (all enemies killed + wave clear bonus). */
export function maxScoreForWave(waveNumber: number, profile: WaveProfileName = 'balanced'): number {
  const wave = generateWave(waveNumber, profile);
  let killRewards = 0;
  for (const group of wave.enemies) {
    killRewards += group.count * group.config.reward;
  }
  // Wave clear bonus uses (waveNumber + 1) because WaveManager increments currentWave
  // before the clear check runs in GameEngine
  const waveClearBonus = (waveNumber + 1) * WAVE_CLEAR_BONUS;
  return killRewards + waveClearBonus;
}

function scaleEnemy(base: EnemyConfig, waveNumber: number): EnemyConfig {
  return {
    health: Math.round(base.health * (1 + 0.4 * waveNumber)),
    speed: Math.min(base.speed * (1 + 0.08 * waveNumber), base.speed * 2.5),
    reward: base.reward + Math.floor(waveNumber * 0.5),
    color: base.color,
  };
}
