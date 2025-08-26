import { KVStoreKeys, KVStoreUtils } from '@human-protocol/sdk';
import {
  Controller,
  Get,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';

import { Web3ConfigService } from '@/config';
import logger from '@/logger';

import { GetOracleFeesQueryDto } from './web3.dto';

@Controller('web3')
export class Web3Controller {
  private readonly logger = logger.child({ context: Web3Controller.name });

  constructor(private web3ConfigService: Web3ConfigService) {}

  @Get('/oracle-fees')
  async getOracleFees(@Query() { chainId }: GetOracleFeesQueryDto): Promise<{
    exchangeOracleFee: string;
    recordingOracleFee: string;
    reputationOracleFee: string;
  }> {
    let exchangeOracleFee: string;
    try {
      exchangeOracleFee = await KVStoreUtils.get(
        chainId as number,
        this.web3ConfigService.exchangeOracle,
        KVStoreKeys.fee,
      );
    } catch (error) {
      const message = 'Error while getting exchange oracle fee';
      this.logger.error(message, {
        chainId,
        oracleAddress: this.web3ConfigService.exchangeOracle,
        error,
      });

      throw new InternalServerErrorException(message);
    }

    let recordingOracleFee: string;
    try {
      recordingOracleFee = await KVStoreUtils.get(
        chainId as number,
        this.web3ConfigService.recordingOracle,
        KVStoreKeys.fee,
      );
    } catch (error) {
      const message = 'Error while getting recording oracle fee';
      this.logger.error(message, {
        chainId,
        oracleAddress: this.web3ConfigService.recordingOracle,
        error,
      });

      throw new InternalServerErrorException(message);
    }

    let reputationOracleFee: string;
    try {
      reputationOracleFee = await KVStoreUtils.get(
        chainId as number,
        this.web3ConfigService.reputationOracle,
        KVStoreKeys.fee,
      );
    } catch (error) {
      const message = 'Error while getting reputation oracle fee';
      this.logger.error(message, {
        chainId,
        oracleAddress: this.web3ConfigService.reputationOracle,
        error,
      });

      throw new InternalServerErrorException(message);
    }

    return {
      exchangeOracleFee,
      recordingOracleFee,
      reputationOracleFee,
    };
  }
}
