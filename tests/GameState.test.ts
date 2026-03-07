import { describe, it, expect } from 'vitest';
import { GameState } from '../src/logic/GameState';

describe('GameState', () => {
  it('initializes with correct values', () => {
    const state = new GameState(100, 20);
    expect(state.money).toBe(100);
    expect(state.lives).toBe(20);
    expect(state.gameOver).toBe(false);
    expect(state.victory).toBe(false);
  });

  describe('canAfford', () => {
    it('returns true when enough money', () => {
      const state = new GameState(100, 20);
      expect(state.canAfford(50)).toBe(true);
      expect(state.canAfford(100)).toBe(true);
    });

    it('returns false when not enough money', () => {
      const state = new GameState(100, 20);
      expect(state.canAfford(101)).toBe(false);
    });
  });

  describe('spend', () => {
    it('deducts money and returns true', () => {
      const state = new GameState(100, 20);
      expect(state.spend(25)).toBe(true);
      expect(state.money).toBe(75);
    });

    it('returns false if cannot afford', () => {
      const state = new GameState(10, 20);
      expect(state.spend(50)).toBe(false);
      expect(state.money).toBe(10);
    });
  });

  describe('earn', () => {
    it('adds money', () => {
      const state = new GameState(100, 20);
      state.earn(50);
      expect(state.money).toBe(150);
    });
  });

  describe('loseLife', () => {
    it('decrements lives', () => {
      const state = new GameState(100, 20);
      state.loseLife();
      expect(state.lives).toBe(19);
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

  describe('win', () => {
    it('sets victory to true', () => {
      const state = new GameState(100, 20);
      state.win();
      expect(state.victory).toBe(true);
    });

    it('does not set victory if game is over', () => {
      const state = new GameState(100, 1);
      state.loseLife();
      state.win();
      expect(state.victory).toBe(false);
    });
  });
});
