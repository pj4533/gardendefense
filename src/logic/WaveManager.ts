import { EnemyConfig, WaveConfig } from '../types';

export class WaveManager {
  readonly waves: WaveConfig[];
  currentWave: number = 0;
  spawning: boolean = false;
  spawnTimer: number = 0;
  currentGroupIndex: number = 0;
  currentEnemyIndex: number = 0;
  allWavesComplete: boolean = false;

  constructor(waves: WaveConfig[]) {
    this.waves = waves;
  }

  get totalWaves(): number {
    return this.waves.length;
  }

  startWave(): boolean {
    if (this.spawning) return false;
    if (this.currentWave >= this.waves.length) {
      this.allWavesComplete = true;
      return false;
    }
    this.spawning = true;
    this.spawnTimer = 0;
    this.currentGroupIndex = 0;
    this.currentEnemyIndex = 0;
    return true;
  }

  update(dt: number): EnemyConfig | null {
    if (!this.spawning) return null;

    const wave = this.waves[this.currentWave];
    if (this.currentGroupIndex >= wave.enemies.length) {
      this.spawning = false;
      this.currentWave++;
      if (this.currentWave >= this.waves.length) {
        this.allWavesComplete = true;
      }
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
