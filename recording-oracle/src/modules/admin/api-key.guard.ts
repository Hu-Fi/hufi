import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import * as cryptoUtils from '@/common/utils/crypto';
import { AuthConfigService } from '@/config';

export const ADMIN_API_KEY_HEADER = 'X-Admin-API-Key';

@Injectable()
export class AdminApiKeyAuthGuard implements CanActivate {
  constructor(private readonly authConfigService: AuthConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const adminApiKey = this.authConfigService.adminApiKey;
    if (!adminApiKey) {
      throw new HttpException(
        'Admin API key is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const request = context.switchToHttp().getRequest() as Request;

    const providedApiKey =
      request.headers[ADMIN_API_KEY_HEADER.toLowerCase()] || '';

    if (typeof providedApiKey !== 'string') {
      throw new UnauthorizedException();
    }

    if (!cryptoUtils.safeCompare(providedApiKey, adminApiKey)) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
