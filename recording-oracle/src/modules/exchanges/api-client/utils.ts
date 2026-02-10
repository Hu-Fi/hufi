import ms from 'ms';

import { ExchangeApiAccessError } from './errors';
import { ExchangePermission, RequiredAccessCheckResult } from './types';

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
  if (!Number.isFinite(timestamp)) {
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

export async function permissionCheckHandler(
  checkPromise: Promise<unknown>,
): Promise<boolean> {
  try {
    await checkPromise;
    return true;
  } catch (error) {
    if (error instanceof ExchangeApiAccessError) {
      return false;
    }

    throw error;
  }
}

export async function checkRequiredAccess(
  permissionsToCheck: Array<ExchangePermission>,
  permissionCheckHandlers: Record<ExchangePermission, () => Promise<boolean>>,
): Promise<RequiredAccessCheckResult> {
  const _permissionsToCheck = new Set(permissionsToCheck);
  if (_permissionsToCheck.size === 0) {
    throw new Error(
      'At least one exchange permission must be provided for check',
    );
  }

  const checkHandlersMap = new Map<
    ExchangePermission,
    ReturnType<typeof permissionCheckHandler>
  >();

  for (const permission of Object.values(ExchangePermission)) {
    if (_permissionsToCheck.has(permission)) {
      checkHandlersMap.set(permission, permissionCheckHandlers[permission]());
    }
  }

  await Promise.all(Array.from(checkHandlersMap.values()));

  const missingPermissions: Array<ExchangePermission> = [];
  for (const [permission, checkResultPromise] of checkHandlersMap) {
    const hasPermission = await checkResultPromise;
    if (!hasPermission) {
      missingPermissions.push(permission);
    }
  }

  if (missingPermissions.length === 0) {
    return {
      success: true,
    };
  }

  return {
    success: false,
    missing: missingPermissions,
  };
}
