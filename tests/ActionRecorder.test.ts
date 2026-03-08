import { describe, it, expect, beforeEach } from 'vitest';
import { ActionRecorder } from '../src/logic/ActionRecorder';
import { WaveActionType } from '../src/logic/WaveAction';
import { TowerType } from '../src/types';

describe('ActionRecorder', () => {
  let recorder: ActionRecorder;

  beforeEach(() => {
    recorder = new ActionRecorder();
  });

  it('starts with frame 0 and no actions', () => {
    expect(recorder.getFrame()).toBe(0);
    expect(recorder.getActions()).toEqual([]);
  });

  it('increments frame on tick', () => {
    recorder.tick();
    expect(recorder.getFrame()).toBe(1);
    recorder.tick();
    recorder.tick();
    expect(recorder.getFrame()).toBe(3);
  });

  it('resets frame and actions', () => {
    recorder.tick();
    recorder.tick();
    recorder.recordPlace(1, 2, TowerType.LADYBUG);
    recorder.reset();
    expect(recorder.getFrame()).toBe(0);
    expect(recorder.getActions()).toEqual([]);
  });

  it('records place action with current frame', () => {
    recorder.tick();
    recorder.tick();
    recorder.recordPlace(3, 4, TowerType.MANTIS);
    const actions = recorder.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0]).toEqual({
      type: WaveActionType.PLACE,
      frame: 2,
      col: 3,
      row: 4,
      towerType: TowerType.MANTIS,
    });
  });

  it('records sell action with current frame', () => {
    recorder.tick();
    recorder.recordSell(5, 6);
    const actions = recorder.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0]).toEqual({
      type: WaveActionType.SELL,
      frame: 1,
      col: 5,
      row: 6,
    });
  });

  it('records move action with current frame', () => {
    recorder.recordMove(1, 2, 3, 4);
    const actions = recorder.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0]).toEqual({
      type: WaveActionType.MOVE,
      frame: 0,
      fromCol: 1,
      fromRow: 2,
      toCol: 3,
      toRow: 4,
    });
  });

  it('records multiple actions in order', () => {
    recorder.recordPlace(0, 0, TowerType.LADYBUG);
    recorder.tick();
    recorder.recordSell(0, 0);
    recorder.tick();
    recorder.recordMove(1, 1, 2, 2);
    const actions = recorder.getActions();
    expect(actions).toHaveLength(3);
    expect(actions[0].frame).toBe(0);
    expect(actions[1].frame).toBe(1);
    expect(actions[2].frame).toBe(2);
  });

  it('returns a copy of actions (not the internal array)', () => {
    recorder.recordPlace(0, 0, TowerType.LADYBUG);
    const actions1 = recorder.getActions();
    const actions2 = recorder.getActions();
    expect(actions1).not.toBe(actions2);
    expect(actions1).toEqual(actions2);
  });
});
