import { mulberry32 } from './seedRng';

export type WaveProfileName = 'balanced' | 'swarm' | 'siege' | 'rush' | 'horde';

export interface WaveProfile {
  name: WaveProfileName;
  symbol: string;
  count_mult: number;
  speed_mult: number;
  ant_ratio: number;
  beetle_ratio: number;
  aphid_ratio: number;
}

export const WAVE_PROFILES: Record<WaveProfileName, WaveProfile> = {
  balanced: { name: 'balanced', symbol: '⚔️',  count_mult: 1.0, speed_mult: 1.0, ant_ratio: 1.0, beetle_ratio: 1.0, aphid_ratio: 1.0 },
  swarm:    { name: 'swarm',    symbol: '🐜',  count_mult: 1.2, speed_mult: 1.2, ant_ratio: 1.8, beetle_ratio: 0.2, aphid_ratio: 1.0 },
  siege:    { name: 'siege',    symbol: '🪲',  count_mult: 0.8, speed_mult: 0.8, ant_ratio: 0.3, beetle_ratio: 2.0, aphid_ratio: 0.5 },
  rush:     { name: 'rush',     symbol: '💨',  count_mult: 0.6, speed_mult: 1.5, ant_ratio: 2.0, beetle_ratio: 0.0, aphid_ratio: 0.5 },
  horde:    { name: 'horde',    symbol: '🌊',  count_mult: 2.5, speed_mult: 1.0, ant_ratio: 1.0, beetle_ratio: 0.5, aphid_ratio: 1.5 },
};

export function getWaveProfile(name: WaveProfileName): WaveProfile {
  return WAVE_PROFILES[name];
}

function getAvailableProfiles(waveNumber: number): WaveProfileName[] {
  const pool: WaveProfileName[] = ['balanced', 'swarm'];
  if (waveNumber >= 3) pool.push('siege', 'rush');
  if (waveNumber >= 6) pool.push('horde');
  return pool;
}

/**
 * Generate a deterministic wave schedule for `count` waves.
 * Internally uses mulberry32(seed + 1) to avoid correlation with path generation.
 *
 * Constraints:
 *   - Wave 0 is always Balanced
 *   - No two consecutive identical profiles
 *   - At least one Balanced per every 4-wave span (waves 0-3, 4-7, 8-11, ...)
 *   - Unlock schedule: waves 0-2: balanced/swarm; waves 3-5: +siege/rush; waves 6+: +horde
 */
export function generateWaveSchedule(seed: number, count: number = 30): WaveProfileName[] {
  const rng = mulberry32(seed + 1);
  const schedule: WaveProfileName[] = [];

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      schedule.push('balanced');
      continue;
    }

    const available = getAvailableProfiles(i);
    const prev = schedule[i - 1];

    // Enforce: at least one Balanced per 4-wave span
    const spanStart = Math.floor(i / 4) * 4;
    const spanSoFar = schedule.slice(spanStart, i);
    const isLastInSpan = i === spanStart + 3;
    const spanHasBalanced = spanSoFar.includes('balanced');
    if (isLastInSpan && !spanHasBalanced) {
      schedule.push('balanced');
      continue;
    }

    // No-repeat constraint
    let candidates = available.filter(p => p !== prev);
    if (candidates.length === 0) candidates = available;

    const idx = Math.floor(rng() * candidates.length);
    schedule.push(candidates[idx]);
  }

  return schedule;
}
