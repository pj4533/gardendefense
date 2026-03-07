import { WaveConfig, EnemyConfig } from '../types';
import { ENEMY_CONFIGS } from '../config';

export function generateWave(waveNumber: number): WaveConfig {
  const enemies: WaveConfig['enemies'] = [];

  const spawnInterval = Math.max(0.3, 1.0 - waveNumber * 0.05);
  const count = 5 + Math.floor(waveNumber * 1.5);

  // Aphids always present
  enemies.push({
    config: scaleEnemy(ENEMY_CONFIGS.aphid, waveNumber),
    count: count,
    spawnInterval: spawnInterval,
  });

  // Ants from wave 4+
  if (waveNumber >= 4) {
    enemies.push({
      config: scaleEnemy(ENEMY_CONFIGS.ant, waveNumber),
      count: Math.floor(count * 0.6),
      spawnInterval: spawnInterval,
    });
  }

  // Beetles from wave 8+
  if (waveNumber >= 8) {
    enemies.push({
      config: scaleEnemy(ENEMY_CONFIGS.beetle, waveNumber),
      count: Math.floor(count * 0.3),
      spawnInterval: spawnInterval * 1.5,
    });
  }

  return { enemies };
}

function scaleEnemy(base: EnemyConfig, waveNumber: number): EnemyConfig {
  return {
    health: Math.round(base.health * (1 + 0.12 * waveNumber)),
    speed: Math.min(base.speed * (1 + 0.03 * waveNumber), base.speed * 2),
    reward: base.reward + Math.floor(waveNumber * 0.5),
    color: base.color,
  };
}
