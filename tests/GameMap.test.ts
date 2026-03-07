import { describe, it, expect } from 'vitest';
import { GameMap } from '../src/logic/GameMap';
import { CellType } from '../src/types';

const TILE = 48;
const simpleWaypoints = [
  { col: 0, row: 1 },
  { col: 3, row: 1 },
  { col: 3, row: 3 },
];

describe('GameMap', () => {
  it('initializes grid with correct dimensions', () => {
    const map = new GameMap(5, 5, TILE, simpleWaypoints);
    expect(map.cols).toBe(5);
    expect(map.rows).toBe(5);
    expect(map.tileSize).toBe(TILE);
  });

  it('marks path cells correctly', () => {
    const map = new GameMap(5, 5, TILE, simpleWaypoints);
    // Horizontal segment: (0,1) to (3,1)
    expect(map.getCell(0, 1)).toBe(CellType.PATH);
    expect(map.getCell(1, 1)).toBe(CellType.PATH);
    expect(map.getCell(2, 1)).toBe(CellType.PATH);
    expect(map.getCell(3, 1)).toBe(CellType.PATH);
    // Vertical segment: (3,1) to (3,3)
    expect(map.getCell(3, 2)).toBe(CellType.PATH);
    expect(map.getCell(3, 3)).toBe(CellType.PATH);
    // Non-path cells
    expect(map.getCell(0, 0)).toBe(CellType.EMPTY);
    expect(map.getCell(4, 4)).toBe(CellType.EMPTY);
  });

  describe('getCell', () => {
    it('returns PATH for out-of-bounds', () => {
      const map = new GameMap(5, 5, TILE, simpleWaypoints);
      expect(map.getCell(-1, 0)).toBe(CellType.PATH);
      expect(map.getCell(0, -1)).toBe(CellType.PATH);
      expect(map.getCell(5, 0)).toBe(CellType.PATH);
      expect(map.getCell(0, 5)).toBe(CellType.PATH);
    });
  });

  describe('canPlaceTower', () => {
    it('returns true for empty cells', () => {
      const map = new GameMap(5, 5, TILE, simpleWaypoints);
      expect(map.canPlaceTower(0, 0)).toBe(true);
      expect(map.canPlaceTower(4, 4)).toBe(true);
    });

    it('returns false for path cells', () => {
      const map = new GameMap(5, 5, TILE, simpleWaypoints);
      expect(map.canPlaceTower(0, 1)).toBe(false);
      expect(map.canPlaceTower(3, 2)).toBe(false);
    });

    it('returns false for out-of-bounds', () => {
      const map = new GameMap(5, 5, TILE, simpleWaypoints);
      expect(map.canPlaceTower(-1, 0)).toBe(false);
      expect(map.canPlaceTower(5, 0)).toBe(false);
      expect(map.canPlaceTower(0, -1)).toBe(false);
      expect(map.canPlaceTower(0, 5)).toBe(false);
    });
  });

  describe('placeTower', () => {
    it('places tower on empty cell', () => {
      const map = new GameMap(5, 5, TILE, simpleWaypoints);
      expect(map.placeTower(0, 0)).toBe(true);
      expect(map.getCell(0, 0)).toBe(CellType.TOWER);
    });

    it('cannot place tower on path', () => {
      const map = new GameMap(5, 5, TILE, simpleWaypoints);
      expect(map.placeTower(0, 1)).toBe(false);
    });

    it('cannot place tower on existing tower', () => {
      const map = new GameMap(5, 5, TILE, simpleWaypoints);
      map.placeTower(0, 0);
      expect(map.placeTower(0, 0)).toBe(false);
    });
  });

  describe('removeTower', () => {
    it('removes a placed tower', () => {
      const map = new GameMap(5, 5, TILE, simpleWaypoints);
      map.placeTower(0, 0);
      expect(map.removeTower(0, 0)).toBe(true);
      expect(map.getCell(0, 0)).toBe(CellType.EMPTY);
    });

    it('returns false if no tower at position', () => {
      const map = new GameMap(5, 5, TILE, simpleWaypoints);
      expect(map.removeTower(0, 0)).toBe(false);
    });

    it('returns false for out-of-bounds', () => {
      const map = new GameMap(5, 5, TILE, simpleWaypoints);
      expect(map.removeTower(-1, 0)).toBe(false);
      expect(map.removeTower(5, 0)).toBe(false);
    });
  });

  describe('getPathWorldPositions', () => {
    it('converts grid waypoints to pixel center positions', () => {
      const map = new GameMap(5, 5, TILE, simpleWaypoints);
      const positions = map.getPathWorldPositions();
      expect(positions).toHaveLength(3);
      expect(positions[0]).toEqual({ x: 0 * TILE + TILE / 2, y: 1 * TILE + TILE / 2 });
      expect(positions[1]).toEqual({ x: 3 * TILE + TILE / 2, y: 1 * TILE + TILE / 2 });
      expect(positions[2]).toEqual({ x: 3 * TILE + TILE / 2, y: 3 * TILE + TILE / 2 });
    });
  });

  describe('worldToGrid', () => {
    it('converts pixel coordinates to grid position', () => {
      const map = new GameMap(5, 5, TILE, simpleWaypoints);
      expect(map.worldToGrid(0, 0)).toEqual({ col: 0, row: 0 });
      expect(map.worldToGrid(TILE + 1, TILE * 2 + 1)).toEqual({ col: 1, row: 2 });
      expect(map.worldToGrid(TILE * 4.5, TILE * 4.5)).toEqual({ col: 4, row: 4 });
    });
  });
});
