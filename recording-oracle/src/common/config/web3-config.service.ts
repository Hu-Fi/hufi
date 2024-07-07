import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Web3ConfigService {
  constructor(private configService: ConfigService) {}
  get env(): string {
    return this.configService.get<string>('WEB3_ENV', 'localhost');
  }
  get privateKey(): string {
    return this.configService.get<string>(
      'WEB3_PRIVATE_KEY',
      '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    );
  }
  get gasPriceMultiplier(): number {
    return +this.configService.get<number>('GAS_PRICE_MULTIPLIER', 1);
  }
  get subgraphAPIKey(): string {
    return this.configService.get<string>('SUBGRAPH_API_KEY', '');
  }
}
