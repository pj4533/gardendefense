import { describe, it, expect } from 'vitest';
import { GameState } from '../src/logic/GameState';

describe('GameState', () => {
  it('initializes with correct values', () => {
    const state = new GameState(100, 5);
    expect(state.money).toBe(100);
    expect(state.lives).toBe(5);
    expect(state.score).toBe(0);
    expect(state.gameOver).toBe(false);
  });

  describe('canAfford', () => {
    it('returns true when enough money', () => {
      const state = new GameState(100, 5);
      expect(state.canAfford(50)).toBe(true);
      expect(state.canAfford(100)).toBe(true);
    });

    it('returns false when not enough money', () => {
      const state = new GameState(100, 5);
      expect(state.canAfford(101)).toBe(false);
    });
  });

  describe('spend', () => {
    it('deducts money and returns true', () => {
      const state = new GameState(100, 5);
      expect(state.spend(25)).toBe(true);
      expect(state.money).toBe(75);
    });

    it('returns false if cannot afford', () => {
      const state = new GameState(10, 5);
      expect(state.spend(50)).toBe(false);
      expect(state.money).toBe(10);
    });
  });

  describe('earn', () => {
    it('adds money', () => {
      const state = new GameState(100, 5);
      state.earn(50);
      expect(state.money).toBe(150);
    });
  });

  describe('addScore', () => {
    it('adds points to score', () => {
      const state = new GameState(100, 5);
      state.addScore(50);
      expect(state.score).toBe(50);
    });

    it('accumulates score', () => {
      const state = new GameState(100, 5);
      state.addScore(10);
      state.addScore(20);
      expect(state.score).toBe(30);
    });
  });

  describe('loseLife', () => {
    it('decrements lives', () => {
      const state = new GameState(100, 5);
      state.loseLife();
      expect(state.lives).toBe(4);
      expect(state.gameOver).toBe(false);
    });

    it('sets gameOver when lives reach 0', () => {
      const state = new GameState(100, 1);
      state.loseLife();
      expect(state.lives).toBe(0);
      expect(state.gameOver).toBe(true);
    });

    it('does not go below 0 lives', () => {
      const state = new GameState(100, 1);
      state.loseLife();
      state.loseLife();
      expect(state.lives).toBe(0);
    });

    it('does nothing if already game over', () => {
      const state = new GameState(100, 1);
      state.loseLife();
      expect(state.gameOver).toBe(true);
      state.loseLife();
      expect(state.lives).toBe(0);
    });
  });
});
