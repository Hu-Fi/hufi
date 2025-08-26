import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * The URL for connecting to the PostgreSQL database.
   */
  get url(): string | undefined {
    return this.configService.get('POSTGRES_URL');
  }

  /**
   * The hostname or IP address of the PostgreSQL database server.
   * Default: '127.0.0.1'
   */
  get host(): string {
    return this.configService.get('POSTGRES_HOST', '127.0.0.1');
  }

  /**
   * The port number on which the PostgreSQL database server is listening.
   * Default: 5432
   */
  get port(): number {
    return Number(this.configService.get('POSTGRES_PORT')) || 5432;
  }

  /**
   * The username for authenticating with the PostgreSQL database.
   * Default: 'default'
   */
  get user(): string {
    return this.configService.get('POSTGRES_USER', 'default');
  }

  /**
   * The password for authenticating with the PostgreSQL database.
   * Default: 'qwerty'
   */
  get password(): string {
    return this.configService.get('POSTGRES_PASSWORD', 'qwerty');
  }

  /**
   * The name of the PostgreSQL database to connect to.
   * Default: 'recording-oracle'
   */
  get database(): string {
    return this.configService.get('POSTGRES_DATABASE', 'recording-oracle');
  }

  /**
   * Indicates whether to use SSL for connections to the PostgreSQL database.
   * Default: false
   */
  get ssl(): boolean {
    return this.configService.get('POSTGRES_SSL', 'false') === 'true';
  }

  /**
   * The logging levels for TypeORM PostgreSQL operations.
   * Available values are: "query" | "schema" | "error" | "warn" | "info" | "log"
   * Default: ''
   */
  get logLevels(): string[] {
    const levelsString = this.configService.get('POSTGRES_LOGGING', '');
    if (!levelsString) {
      return [];
    }
    return levelsString.split(',');
  }
}
