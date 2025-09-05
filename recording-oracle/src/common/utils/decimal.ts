import Decimal from 'decimal.js';

export function mul(a: number, b: number): number {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  const result = decimalA.times(decimalB);

  return result.toNumber();
}

export function div(a: number, b: number): number {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  if (decimalB.isZero()) {
    throw new Error('Division by zero is not allowed.');
  }

  const result = decimalA.dividedBy(decimalB);

  return result.toNumber();
}

export function add(a: number, b: number): number {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  const result = decimalA.plus(decimalB);

  return result.toNumber();
}

export function sub(a: number, b: number): number {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  const result = decimalA.minus(decimalB);

  return result.toNumber();
}

export function truncate(n: number, decimals: number): number {
  const valueDecimal = new Decimal(n);
  const result = valueDecimal.toFixed(decimals, Decimal.ROUND_DOWN);

  return Number(result);
}
