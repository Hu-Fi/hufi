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
  get recordingOracle(): string {
    return this.configService.get<string>('RECORDING_ORACLE', '');
  }
  get reputationOracle(): string {
    return this.configService.get<string>('REPUTATION_ORACLE', '');
  }
}
