import { CellType, GridPosition, Point } from '../types';

export class GameMap {
  readonly cols: number;
  readonly rows: number;
  readonly tileSize: number;
  readonly path: GridPosition[];
  private grid: CellType[][];

  constructor(cols: number, rows: number, tileSize: number, waypoints: GridPosition[]) {
    this.cols = cols;
    this.rows = rows;
    this.tileSize = tileSize;
    this.path = waypoints;

    this.grid = [];
    for (let row = 0; row < rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < cols; col++) {
        this.grid[row][col] = CellType.EMPTY;
      }
    }

    this.markPath(waypoints);
  }

  private markPath(waypoints: GridPosition[]): void {
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];

      const colStep = Math.sign(to.col - from.col);
      const rowStep = Math.sign(to.row - from.row);

      let col = from.col;
      let row = from.row;

      while (col !== to.col || row !== to.row) {
        this.grid[row][col] = CellType.PATH;
        if (col !== to.col) col += colStep;
        else if (row !== to.row) row += rowStep;
      }
      this.grid[to.row][to.col] = CellType.PATH;
    }
  }

  getCell(col: number, row: number): CellType {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return CellType.PATH;
    }
    return this.grid[row][col];
  }

  canPlaceTower(col: number, row: number): boolean {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    return this.grid[row][col] === CellType.EMPTY;
  }

  placeTower(col: number, row: number): boolean {
    if (!this.canPlaceTower(col, row)) return false;
    this.grid[row][col] = CellType.TOWER;
    return true;
  }

  removeTower(col: number, row: number): boolean {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    if (this.grid[row][col] !== CellType.TOWER) return false;
    this.grid[row][col] = CellType.EMPTY;
    return true;
  }

  getPathWorldPositions(): Point[] {
    return this.path.map(wp => ({
      x: wp.col * this.tileSize + this.tileSize / 2,
      y: wp.row * this.tileSize + this.tileSize / 2,
    }));
  }

  worldToGrid(x: number, y: number): GridPosition {
    return {
      col: Math.floor(x / this.tileSize),
      row: Math.floor(y / this.tileSize),
    };
  }
}
