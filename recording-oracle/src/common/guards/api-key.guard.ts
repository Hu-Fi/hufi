import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { ServerConfigService } from '../config/server-config.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private serverConfigService: ServerConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing.');
    }

    // call your env. var the name you want
    if (apiKey !== this.serverConfigService.apiKey) {
      throw new UnauthorizedException('Invalid API key.');
    }

    return true;
  }
}
