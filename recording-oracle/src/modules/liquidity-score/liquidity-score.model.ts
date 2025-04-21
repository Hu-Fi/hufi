export class LiquidityScoreCalculation {
  constructor(
    private readonly tradeVolume: number,
    private readonly openOrderVolume: number,
    private readonly orderDuration: number,
    private readonly spread: number,
  ) {}

  calculate(): number {
    const safeSpread = Math.max(this.spread, 1);
    return (
      this.tradeVolume +
      (0.1 * this.openOrderVolume * this.orderDuration) / safeSpread
    );
  }
}
