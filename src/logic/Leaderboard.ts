import { LEADERBOARD_KEY, LEADERBOARD_MAX_ENTRIES } from '../config';

export interface LeaderboardEntry {
  initials: string;
  score: number;
}

export class Leaderboard {
  getEntries(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(LEADERBOARD_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (e: unknown): e is LeaderboardEntry =>
            typeof e === 'object' &&
            e !== null &&
            typeof (e as LeaderboardEntry).initials === 'string' &&
            typeof (e as LeaderboardEntry).score === 'number',
        )
        .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score)
        .slice(0, LEADERBOARD_MAX_ENTRIES);
    } catch {
      return [];
    }
  }

  addEntry(initials: string, score: number): number {
    const cleaned = initials.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3);
    if (cleaned.length !== 3) return -1;

    const entries = this.getEntries();
    entries.push({ initials: cleaned, score });
    entries.sort((a, b) => b.score - a.score);
    const trimmed = entries.slice(0, LEADERBOARD_MAX_ENTRIES);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));

    return trimmed.findIndex(e => e.initials === cleaned && e.score === score) + 1;
  }

  isHighScore(score: number): boolean {
    const entries = this.getEntries();
    if (entries.length < LEADERBOARD_MAX_ENTRIES) return true;
    return score > entries[entries.length - 1].score;
  }
}
