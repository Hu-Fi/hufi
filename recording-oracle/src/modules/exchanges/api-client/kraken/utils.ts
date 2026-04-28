import { ApiPermissionErrorCode, ApiPermissionErrorCodes } from './constants';

export function isApiPermissionCode(
  errorCode: string,
): errorCode is ApiPermissionErrorCode {
  return ApiPermissionErrorCodes.includes(errorCode as ApiPermissionErrorCode);
}
