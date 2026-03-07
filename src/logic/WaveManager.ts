import { EnemyConfig, WaveConfig } from '../types';

export class WaveManager {
  private waveGenerator: (n: number) => WaveConfig;
  private currentWaveConfig: WaveConfig | null = null;
  currentWave: number = 0;
  spawning: boolean = false;
  spawnTimer: number = 0;
  currentGroupIndex: number = 0;
  currentEnemyIndex: number = 0;

  constructor(waveGenerator: (n: number) => WaveConfig) {
    this.waveGenerator = waveGenerator;
  }

  startWave(): boolean {
    if (this.spawning) return false;
    this.currentWaveConfig = this.waveGenerator(this.currentWave);
    this.spawning = true;
    this.spawnTimer = 0;
    this.currentGroupIndex = 0;
    this.currentEnemyIndex = 0;
    return true;
  }

  update(dt: number): EnemyConfig | null {
    if (!this.spawning || !this.currentWaveConfig) return null;

    const wave = this.currentWaveConfig;
    if (this.currentGroupIndex >= wave.enemies.length) {
      this.spawning = false;
      this.currentWave++;
      return null;
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const group = wave.enemies[this.currentGroupIndex];
      this.spawnTimer = group.spawnInterval;
      this.currentEnemyIndex++;
      if (this.currentEnemyIndex >= group.count) {
        this.currentGroupIndex++;
        this.currentEnemyIndex = 0;
      }
      return group.config;
    }

    return null;
  }
}
