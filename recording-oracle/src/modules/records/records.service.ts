import { EscrowClient, ChainId, UploadFile } from '@human-protocol/sdk';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { Web3TransactionStatus } from '../../common/enums/web3-transaction';
import { LiquidityScore } from '../../common/types/liquidity-score';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { Web3TransactionService } from '../web3-transaction/web3-transaction.service';

@Injectable()
export class RecordsService {
  private readonly logger = new Logger(RecordsService.name);

  constructor(
    @Inject(Web3Service) private readonly web3Service: Web3Service,
    @Inject(StorageService) private storageService: StorageService,
    @Inject(Web3TransactionService)
    private web3TransactionService: Web3TransactionService,
  ) {}

  async pushLiquidityScores(
    escrowAddress: string,
    chainId: ChainId,
    liquidityData: LiquidityScore[],
  ): Promise<UploadFile> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    this.logger.log(
      `Uploading liquidity scores for escrow ${escrowAddress} on chain ${chainId}`,
    );
    const file = await this.storageService.uploadEscrowResult(
      escrowAddress,
      chainId,
      liquidityData,
    );

    const gasPrice = await this.web3Service.calculateGasPrice(chainId);

    // save tx and keep its id
    const tx = await this.web3TransactionService.saveWeb3Transaction({
      chainId,
      contract: 'escrow',
      address: escrowAddress,
      method: 'storeResults',
      data: [
        file.url,
        file.hash,
        { gasPrice: gasPrice.toString() }, // stringify bigint for JSON column
      ],
      status: Web3TransactionStatus.PENDING,
    });

    try {
      await escrowClient.storeResults(escrowAddress, file.url, file.hash, {
        gasPrice,
      });

      await this.web3TransactionService.updateWeb3TransactionStatus(
        tx.id,
        Web3TransactionStatus.SUCCESS,
      );
    } catch (err) {
      this.logger.error(
        `Failed to store liquidity scores for escrow ${escrowAddress} on chain ${chainId}`,
        err,
      );
      await this.web3TransactionService.updateWeb3TransactionStatus(
        tx.id,
        Web3TransactionStatus.FAILED,
      );
    }

    return file;
  }
}
