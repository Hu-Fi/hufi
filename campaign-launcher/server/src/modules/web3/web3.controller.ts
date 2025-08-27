import { KVStoreKeys, KVStoreUtils } from '@human-protocol/sdk';
import {
  Controller,
  Get,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { Web3ConfigService } from '@/config';
import logger from '@/logger';

import { GetOracleFeesQueryDto } from './web3.dto';

@ApiExcludeController()
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
    const { exchangeOracle, recordingOracle, reputationOracle } =
      this.web3ConfigService;

    let exchangeOracleFee: string | undefined;
    try {
      exchangeOracleFee = await KVStoreUtils.get(
        chainId as number,
        exchangeOracle,
        KVStoreKeys.fee,
      );
    } catch (error) {
      this.logger.warn('Error while getting exchange oracle fee', {
        chainId,
        oracleAddress: exchangeOracle,
        error,
      });
    }

    let recordingOracleFee: string | undefined;
    try {
      recordingOracleFee = await KVStoreUtils.get(
        chainId as number,
        recordingOracle,
        KVStoreKeys.fee,
      );
    } catch (error) {
      this.logger.warn('Error while getting recording oracle fee', {
        chainId,
        oracleAddress: recordingOracle,
        error,
      });
    }

    let reputationOracleFee: string | undefined;
    try {
      reputationOracleFee = await KVStoreUtils.get(
        chainId as number,
        reputationOracle,
        KVStoreKeys.fee,
      );
    } catch (error) {
      this.logger.warn('Error while getting reputation oracle fee', {
        chainId,
        oracleAddress: reputationOracle,
        error,
      });
    }

    if (!exchangeOracleFee || !recordingOracleFee || !reputationOracleFee) {
      throw new InternalServerErrorException('Some of oracle fees are missing');
    }

    return {
      exchangeOracleFee,
      recordingOracleFee,
      reputationOracleFee,
    };
  }
}
