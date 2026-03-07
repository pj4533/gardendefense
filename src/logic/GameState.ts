export class GameState {
  money: number;
  lives: number;
  gameOver: boolean = false;
  victory: boolean = false;

  constructor(money: number, lives: number) {
    this.money = money;
    this.lives = lives;
  }

  canAfford(cost: number): boolean {
    return this.money >= cost;
  }

  spend(cost: number): boolean {
    if (!this.canAfford(cost)) return false;
    this.money -= cost;
    return true;
  }

  earn(amount: number): void {
    this.money += amount;
  }

  loseLife(): void {
    if (this.gameOver) return;
    this.lives--;
    if (this.lives <= 0) {
      this.lives = 0;
      this.gameOver = true;
    }
  }

  win(): void {
    if (!this.gameOver) {
      this.victory = true;
    }
  }
}
