import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';

import { ServerConfigService } from '../config/server-config.service';
import { ControlledError } from '../errors/controlled';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private serverConfigService: ServerConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new ControlledError('API key is missing.', HttpStatus.UNAUTHORIZED);
    }

    if (apiKey !== this.serverConfigService.apiKey) {
      throw new ControlledError('Invalid API key.', HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}
