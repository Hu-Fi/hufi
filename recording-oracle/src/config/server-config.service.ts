import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServerConfigService {
  constructor(private configService: ConfigService) {}

  get gitHash(): string {
    return this.configService.get('GIT_HASH', '');
  }

  /**
   * The hostname or IP address on which the server will run.
   * Default: '0.0.0.0'
   */
  get host(): string {
    return this.configService.get('HOST', '0.0.0.0');
  }

  /**
   * The port number on which the server will listen for incoming connections.
   * Default: 5101
   */
  get port(): number {
    return Number(this.configService.get('PORT')) || 5101;
  }
}
