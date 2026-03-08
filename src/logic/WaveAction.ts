import { TowerType } from '../types';

export enum WaveActionType {
  PLACE = 'place',
  SELL = 'sell',
  MOVE = 'move',
}

export interface PlaceAction {
  type: WaveActionType.PLACE;
  frame: number;
  col: number;
  row: number;
  towerType: TowerType;
}

export interface SellAction {
  type: WaveActionType.SELL;
  frame: number;
  col: number;
  row: number;
}

export interface MoveAction {
  type: WaveActionType.MOVE;
  frame: number;
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
}

export type WaveAction = PlaceAction | SellAction | MoveAction;
