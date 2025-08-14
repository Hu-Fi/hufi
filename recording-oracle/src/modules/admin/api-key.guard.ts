import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

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
    if (providedApiKey !== adminApiKey) {
      throw new HttpException('Invalid API key', HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}
