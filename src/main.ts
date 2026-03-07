import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config';

new Phaser.Game({
  type: Phaser.AUTO,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: '#111111',
  scene: [GameScene],
});
