import Phaser from 'phaser';
import { GameEngine } from '../logic/GameEngine';
import { TowerType, CellType } from '../types';
import {
  TILE_SIZE, GRID_COLS, GRID_ROWS, GAME_HEIGHT,
  STARTING_MONEY, STARTING_LIVES,
  PATH_WAYPOINTS, WAVES, TOWER_CONFIGS,
} from '../config';

export class GameScene extends Phaser.Scene {
  private engine!: GameEngine;
  private selectedTowerType: TowerType = TowerType.BASIC;

  private gridGraphics!: Phaser.GameObjects.Graphics;
  private entityGraphics!: Phaser.GameObjects.Graphics;

  private moneyText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;

  private basicTowerBtn!: Phaser.GameObjects.Text;
  private sniperTowerBtn!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.engine = new GameEngine(
      GRID_COLS, GRID_ROWS, TILE_SIZE,
      PATH_WAYPOINTS, WAVES,
      STARTING_MONEY, STARTING_LIVES,
    );

    this.gridGraphics = this.add.graphics();
    this.entityGraphics = this.add.graphics();

    this.drawGrid();
    this.createUI();

    this.input.on('pointerdown', this.handleClick, this);
  }

  private drawGrid(): void {
    this.gridGraphics.clear();

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const cell = this.engine.map.getCell(col, row);
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        let fillColor: number;
        switch (cell) {
          case CellType.PATH:
            fillColor = 0x444444;
            break;
          case CellType.TOWER:
            fillColor = 0x333355;
            break;
          case CellType.EMPTY:
          default:
            fillColor = 0x222222;
            break;
        }

        this.gridGraphics.fillStyle(fillColor);
        this.gridGraphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        this.gridGraphics.lineStyle(1, 0x333333);
        this.gridGraphics.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  private createUI(): void {
    const uiY = GAME_HEIGHT + 8;
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    };

    this.moneyText = this.add.text(10, uiY, '', textStyle);
    this.livesText = this.add.text(160, uiY, '', textStyle);
    this.waveText = this.add.text(300, uiY, '', textStyle);

    const btnY = uiY + 30;

    this.basicTowerBtn = this.add.text(10, btnY,
      ` Basic ($${TOWER_CONFIGS[TowerType.BASIC].cost}) `,
      { fontSize: '13px', color: '#ffffff', fontFamily: 'monospace', backgroundColor: '#4488ff' },
    ).setInteractive({ useHandCursor: true });

    this.sniperTowerBtn = this.add.text(150, btnY,
      ` Sniper ($${TOWER_CONFIGS[TowerType.SNIPER].cost}) `,
      { fontSize: '13px', color: '#ffffff', fontFamily: 'monospace', backgroundColor: '#333333' },
    ).setInteractive({ useHandCursor: true });

    const startWaveBtn = this.add.text(310, btnY, ' Start Wave ', {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace', backgroundColor: '#228822',
    }).setInteractive({ useHandCursor: true });

    this.messageText = this.add.text(
      GRID_COLS * TILE_SIZE / 2,
      GAME_HEIGHT / 2,
      '',
      { fontSize: '32px', color: '#ffffff', fontFamily: 'monospace' },
    ).setOrigin(0.5);

    this.basicTowerBtn.on('pointerdown', () => {
      this.selectedTowerType = TowerType.BASIC;
      this.updateButtonHighlights();
    });

    this.sniperTowerBtn.on('pointerdown', () => {
      this.selectedTowerType = TowerType.SNIPER;
      this.updateButtonHighlights();
    });

    startWaveBtn.on('pointerdown', () => {
      this.engine.startNextWave();
    });

    this.updateButtonHighlights();
  }

  private updateButtonHighlights(): void {
    this.basicTowerBtn.setBackgroundColor(
      this.selectedTowerType === TowerType.BASIC ? '#4488ff' : '#333333'
    );
    this.sniperTowerBtn.setBackgroundColor(
      this.selectedTowerType === TowerType.SNIPER ? '#ff4444' : '#333333'
    );
  }

  private handleClick(pointer: Phaser.Input.Pointer): void {
    if (pointer.y >= GAME_HEIGHT) return;

    const col = Math.floor(pointer.x / TILE_SIZE);
    const row = Math.floor(pointer.y / TILE_SIZE);

    const placed = this.engine.placeTower(col, row, this.selectedTowerType);
    if (placed) {
      this.drawGrid();
    }
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.engine.update(dt);
    this.drawEntities();
    this.updateUI();
  }

  private drawEntities(): void {
    this.entityGraphics.clear();

    for (const tower of this.engine.towers) {
      this.entityGraphics.fillStyle(tower.color);
      const size = TILE_SIZE * 0.7;
      this.entityGraphics.fillRect(
        tower.x - size / 2, tower.y - size / 2,
        size, size,
      );
      this.entityGraphics.lineStyle(1, tower.color, 0.2);
      this.entityGraphics.strokeCircle(tower.x, tower.y, tower.range);
    }

    for (const enemy of this.engine.enemies) {
      const size = TILE_SIZE * 0.5;

      this.entityGraphics.fillStyle(enemy.color);
      this.entityGraphics.fillRect(
        enemy.x - size / 2, enemy.y - size / 2,
        size, size,
      );

      const barWidth = TILE_SIZE * 0.6;
      const barHeight = 4;
      const barY = enemy.y - size / 2 - 8;
      this.entityGraphics.fillStyle(0x333333);
      this.entityGraphics.fillRect(enemy.x - barWidth / 2, barY, barWidth, barHeight);

      const healthPct = enemy.health / enemy.maxHealth;
      const healthColor = healthPct > 0.5 ? 0x00ff00 : healthPct > 0.25 ? 0xffff00 : 0xff0000;
      this.entityGraphics.fillStyle(healthColor);
      this.entityGraphics.fillRect(enemy.x - barWidth / 2, barY, barWidth * healthPct, barHeight);
    }

    for (const proj of this.engine.projectiles) {
      this.entityGraphics.fillStyle(0xffffff);
      this.entityGraphics.fillCircle(proj.x, proj.y, 3);
    }
  }

  private updateUI(): void {
    this.moneyText.setText(`Money: $${this.engine.state.money}`);
    this.livesText.setText(`Lives: ${this.engine.state.lives}`);
    this.waveText.setText(
      `Wave: ${this.engine.waveManager.currentWave}/${this.engine.waveManager.totalWaves}`
    );

    if (this.engine.state.gameOver) {
      this.messageText.setText('GAME OVER');
      this.messageText.setColor('#ff0000');
    } else if (this.engine.state.victory) {
      this.messageText.setText('VICTORY!');
      this.messageText.setColor('#00ff00');
    }
  }
}
