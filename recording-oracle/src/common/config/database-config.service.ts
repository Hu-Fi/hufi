import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfigService {
  constructor(private configService: ConfigService) {}
  get host(): string {
    return this.configService.get<string>('POSTGRES_HOST', 'localhost');
  }
  get port(): number {
    return +this.configService.get<number>('POSTGRES_PORT', 5432);
  }
  get user(): string {
    return this.configService.get<string>('POSTGRES_USER', 'user');
  }
  get password(): string {
    return this.configService.get<string>('POSTGRES_PASSWORD', 'password');
  }
  get database(): string {
    return this.configService.get<string>(
      'POSTGRES_DATABASE',
      'recording-oracle',
    );
  }
  get ssl(): boolean {
    return this.configService.get<boolean>('POSTGRES_SSL', false);
  }
  get logging(): string {
    return this.configService.get<string>('POSTGRES_LOGGING', '');
  }
}
