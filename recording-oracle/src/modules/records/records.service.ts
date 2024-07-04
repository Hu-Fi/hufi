import { EscrowClient, ChainId, UploadFile } from '@human-protocol/sdk';
import { Inject, Injectable } from '@nestjs/common';

import { LiquidityScore } from '../../common/types/liquidity-score';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';

@Injectable()
export class RecordsService {
  constructor(
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    @Inject(StorageService)
    private storageService: StorageService,
  ) {}

  async pushLiquidityScores(
    escrowAddress: string,
    chainId: ChainId,
    liquidityData: LiquidityScore[],
  ): Promise<UploadFile> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const saveLiquidityResult = await this.storageService.uploadEscrowResult(
      escrowAddress,
      chainId,
      liquidityData,
    );

    await escrowClient.storeResults(
      escrowAddress,
      saveLiquidityResult.url,
      saveLiquidityResult.hash,
    );

    return saveLiquidityResult;
  }
}
