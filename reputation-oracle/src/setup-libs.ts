import Decimal from 'decimal.js';

// Max EVM token decimals is uint8 - 255;
Decimal.set({
  toExpNeg: -256,
  toExpPos: 256,
});
