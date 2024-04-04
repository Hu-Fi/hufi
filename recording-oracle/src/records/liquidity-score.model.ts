export class LiquidityScoreCalculation {
  constructor(
    public readonly tradeVolume: number,
    public readonly openOrderVolume: number,
    public readonly orderDuration: number, // Duration in the order book in minutes
    public readonly spread: number,
  ) {}

  calculate(): number {
    return (
      this.tradeVolume +
      (0.1 * this.openOrderVolume * this.orderDuration) / this.spread
    );
  }
}
