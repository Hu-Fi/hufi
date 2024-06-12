import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PGPConfigService {
  constructor(private configService: ConfigService) {}
  get privateKey(): string {
    return this.configService.get<string>('PGP_PRIVATE_KEY', '');
  }
  get publicKey(): string {
    return this.configService.get<string>('PGP_PUBLIC_KEY', '');
  }
  get passphrase(): string {
    return this.configService.get<string>('PGP_PASSPHRASE', '');
  }
}
