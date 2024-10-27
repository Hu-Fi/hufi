import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Web3ConfigService {
  constructor(private configService: ConfigService) {}
  get env(): string {
    return this.configService.get<string>('WEB3_ENV', 'localhost');
  }
  get subgraphAPIKey(): string {
    return this.configService.get<string>('SUBGRAPH_API_KEY', '');
  }
  get exchangeOracle(): string {
    return this.configService.get<string>('EXCHANGE_ORACLE', '');
  }
  get exchangeOracleFee(): number {
    return +this.configService.get<number>('EXCHANGE_ORACLE_FEE', 10);
  }
  get recordingOracle(): string {
    return this.configService.get<string>('RECORDING_ORACLE', '');
  }
  get recordingOracleFee(): number {
    return +this.configService.get<number>('RECORDING_ORACLE_FEE', 10);
  }
  get reputationOracle(): string {
    return this.configService.get<string>('REPUTATION_ORACLE', '');
  }
  get reputationOracleFee(): number {
    return +this.configService.get<number>('REPUTATION_ORACLE_FEE', 10);
  }
  get privateKey(): string {
    return this.configService.get<string>('WEB3_PRIVATE_KEY', '');
  }
  get gasPriceMultiplier(): number {
    return +this.configService.get<number>('GAS_PRICE_MULTIPLIER', 1);
  }
}
