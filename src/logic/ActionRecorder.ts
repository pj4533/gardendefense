import { TowerType } from '../types';
import { WaveAction, WaveActionType } from './WaveAction';

export class ActionRecorder {
  private frame: number = 0;
  private actions: WaveAction[] = [];

  tick(): void {
    this.frame++;
  }

  reset(): void {
    this.frame = 0;
    this.actions = [];
  }

  getFrame(): number {
    return this.frame;
  }

  recordPlace(col: number, row: number, towerType: TowerType): void {
    this.actions.push({
      type: WaveActionType.PLACE,
      frame: this.frame,
      col,
      row,
      towerType,
    });
  }

  recordSell(col: number, row: number): void {
    this.actions.push({
      type: WaveActionType.SELL,
      frame: this.frame,
      col,
      row,
    });
  }

  recordMove(fromCol: number, fromRow: number, toCol: number, toRow: number): void {
    this.actions.push({
      type: WaveActionType.MOVE,
      frame: this.frame,
      fromCol,
      fromRow,
      toCol,
      toRow,
    });
  }

  getActions(): WaveAction[] {
    return [...this.actions];
  }
}
