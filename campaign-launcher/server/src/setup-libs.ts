import { Logger as ValkeyLogger } from '@valkey/valkey-glide';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import Decimal from 'decimal.js';

/**
 * Max EVM token decimals is uint8: 255
 * Max ERC-20 value is uint256: 2^256 - 1 (~ 1.158 * 10^77)
 */
Decimal.set({
  toExpNeg: -256,
  toExpPos: 60,
});

dayjs.extend(duration);

ValkeyLogger.setLoggerConfig('off');
