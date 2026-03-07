import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Leaderboard } from '../src/logic/Leaderboard';
import { LEADERBOARD_KEY } from '../src/config';

// Mock localStorage
const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => storage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete storage[key]; }),
  clear: vi.fn(() => { for (const k of Object.keys(storage)) delete storage[k]; }),
  get length() { return Object.keys(storage).length; },
  key: vi.fn((_: number) => null),
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('Leaderboard', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('returns empty array when no data', () => {
    const lb = new Leaderboard();
    expect(lb.getEntries()).toEqual([]);
  });

  it('adds and retrieves entries', () => {
    const lb = new Leaderboard();
    lb.addEntry('AAA', 100);
    lb.addEntry('BBB', 200);
    const entries = lb.getEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0].initials).toBe('BBB');
    expect(entries[0].score).toBe(200);
  });

  it('sorts by score descending', () => {
    const lb = new Leaderboard();
    lb.addEntry('LOW', 50);
    lb.addEntry('HIG', 500);
    lb.addEntry('MID', 200);
    const entries = lb.getEntries();
    expect(entries.map(e => e.score)).toEqual([500, 200, 50]);
  });

  it('caps at max entries', () => {
    const lb = new Leaderboard();
    for (let i = 0; i < 15; i++) {
      lb.addEntry('AAA', i * 100);
    }
    expect(lb.getEntries()).toHaveLength(10);
  });

  it('returns rank on addEntry', () => {
    const lb = new Leaderboard();
    lb.addEntry('AAA', 500);
    lb.addEntry('BBB', 300);
    const rank = lb.addEntry('CCC', 400);
    expect(rank).toBe(2); // 500, 400, 300 — CCC is rank 2
  });

  it('uppercases initials', () => {
    const lb = new Leaderboard();
    lb.addEntry('abc', 100);
    expect(lb.getEntries()[0].initials).toBe('ABC');
  });

  it('rejects invalid initials (not 3 alpha chars)', () => {
    const lb = new Leaderboard();
    expect(lb.addEntry('AB', 100)).toBe(-1);
    expect(lb.addEntry('A1B', 100)).toBe(-1);
    expect(lb.getEntries()).toHaveLength(0);
  });

  it('handles corrupt localStorage data', () => {
    storage[LEADERBOARD_KEY] = 'not-valid-json{{{';
    const lb = new Leaderboard();
    expect(lb.getEntries()).toEqual([]);
  });

  it('handles non-array localStorage data', () => {
    storage[LEADERBOARD_KEY] = JSON.stringify({ not: 'an array' });
    const lb = new Leaderboard();
    expect(lb.getEntries()).toEqual([]);
  });

  it('filters invalid entries from storage', () => {
    storage[LEADERBOARD_KEY] = JSON.stringify([
      { initials: 'AAA', score: 100 },
      { bad: 'entry' },
      { initials: 123, score: 'wrong' },
    ]);
    const lb = new Leaderboard();
    expect(lb.getEntries()).toHaveLength(1);
  });

  describe('isHighScore', () => {
    it('returns true when board is not full', () => {
      const lb = new Leaderboard();
      expect(lb.isHighScore(1)).toBe(true);
    });

    it('returns true when score beats lowest', () => {
      const lb = new Leaderboard();
      for (let i = 0; i < 10; i++) {
        lb.addEntry('AAA', (i + 1) * 100);
      }
      expect(lb.isHighScore(150)).toBe(true);
    });

    it('returns false when score is too low', () => {
      const lb = new Leaderboard();
      for (let i = 0; i < 10; i++) {
        lb.addEntry('AAA', (i + 1) * 100);
      }
      expect(lb.isHighScore(50)).toBe(false);
    });
  });
});
