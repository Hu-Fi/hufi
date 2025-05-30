export class LiquidityScoreCalculation {
  constructor(
    public readonly tradeVolume: number,
    public readonly openOrderVolume: number,
    public readonly orderDuration: number, // Duration in the order book in minutes
    public readonly spread: number,
  ) {}

  calculate(): number {
    const safeSpread = this.spread > 0 ? this.spread : 1;
    const orderBookValue =
      (this.openOrderVolume * this.orderDuration) / safeSpread;
    return this.tradeVolume + 0.1 * orderBookValue;
  }
}

export interface CalculatedScore {
  score: number;
  lastTradeId?: string;
}
