import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import Decimal from 'decimal.js';

export function setupLibraries(): void {
  // Max EVM token decimals is uint8 - 255;
  Decimal.set({
    toExpNeg: -256,
    toExpPos: 256,
  });

  dayjs.extend(duration);
  dayjs.extend(isSameOrAfter);
}
