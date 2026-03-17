import { describe, it, expect } from 'vitest';
import { generateWaveSchedule, getWaveProfile, WAVE_PROFILES, WaveProfileName } from '../src/logic/WaveSchedule';

describe('WaveSchedule', () => {
  describe('generateWaveSchedule', () => {
    it('wave 0 is always Balanced', () => {
      expect(generateWaveSchedule(12345)[0]).toBe('balanced');
      expect(generateWaveSchedule(99999)[0]).toBe('balanced');
      expect(generateWaveSchedule(0)[0]).toBe('balanced');
    });

    it('no two consecutive identical profiles', () => {
      const schedule = generateWaveSchedule(42, 30);
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i]).not.toBe(schedule[i - 1]);
      }
    });

    it('at least one Balanced per every 4-wave span', () => {
      const schedule = generateWaveSchedule(42, 28);
      for (let span = 0; span < 7; span++) {
        const chunk = schedule.slice(span * 4, span * 4 + 4);
        expect(chunk).toContain('balanced');
      }
    });

    it('respects unlock schedule: siege/rush not in waves 0-2', () => {
      const schedule = generateWaveSchedule(42, 30);
      for (let i = 0; i < 3; i++) {
        expect(schedule[i]).not.toBe('siege');
        expect(schedule[i]).not.toBe('rush');
        expect(schedule[i]).not.toBe('horde');
      }
    });

    it('respects unlock schedule: horde not in waves 0-5', () => {
      const schedule = generateWaveSchedule(42, 30);
      for (let i = 0; i < 6; i++) {
        expect(schedule[i]).not.toBe('horde');
      }
    });

    it('horde can appear from wave 6 onward', () => {
      // Run many seeds until horde appears in wave 6+
      let found = false;
      for (let seed = 0; seed < 200; seed++) {
        const schedule = generateWaveSchedule(seed, 30);
        for (let i = 6; i < 30; i++) {
          if (schedule[i] === 'horde') { found = true; break; }
        }
        if (found) break;
      }
      expect(found).toBe(true);
    });

    it('is deterministic: same seed produces same schedule', () => {
      const a = generateWaveSchedule(20260317, 30);
      const b = generateWaveSchedule(20260317, 30);
      expect(a).toEqual(b);
    });

    it('different seeds produce different schedules', () => {
      const a = generateWaveSchedule(20260317, 30);
      const b = generateWaveSchedule(20260318, 30);
      expect(a).not.toEqual(b);
    });

    it('returns the requested count of waves', () => {
      expect(generateWaveSchedule(1, 10)).toHaveLength(10);
      expect(generateWaveSchedule(1, 30)).toHaveLength(30);
    });

    it('all returned profiles are valid names', () => {
      const valid = new Set(Object.keys(WAVE_PROFILES) as WaveProfileName[]);
      const schedule = generateWaveSchedule(42, 30);
      for (const p of schedule) {
        expect(valid.has(p)).toBe(true);
      }
    });
  });

  describe('getWaveProfile', () => {
    it('returns profile data matching the name', () => {
      const p = getWaveProfile('balanced');
      expect(p.name).toBe('balanced');
      expect(p.count_mult).toBe(1.0);
      expect(p.speed_mult).toBe(1.0);
    });

    it('horde has highest count multiplier', () => {
      const horde = getWaveProfile('horde');
      const balanced = getWaveProfile('balanced');
      expect(horde.count_mult).toBeGreaterThan(balanced.count_mult);
    });

    it('rush has zero beetle ratio', () => {
      expect(getWaveProfile('rush').beetle_ratio).toBe(0);
    });

    it('siege has highest beetle ratio', () => {
      const siege = getWaveProfile('siege');
      expect(siege.beetle_ratio).toBeGreaterThan(getWaveProfile('balanced').beetle_ratio);
    });
  });
});
