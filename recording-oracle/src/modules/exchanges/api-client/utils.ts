import ms from 'ms';

/**
 * Check if API client can accept since/until timestamp for history lookups
 * @param timestamp - timestamp in milliseconds to check
 * @param maxLookbackMs - default is 10 days
 */
export function isAcceptableTimestamp(
  timestamp: number,
  maxLookbackMs: number = ms('10 days'),
): boolean {
  /**
   * Safety-belt
   */
  if (typeof timestamp !== 'number') {
    return false;
  }

  const now = Date.now();
  /**
   * Do not allow to look into future
   */
  if (timestamp > now) {
    return false;
  }

  /**
   * Do not allow to look too far in the past
   */
  if (timestamp < now - maxLookbackMs) {
    return false;
  }

  return true;
}
