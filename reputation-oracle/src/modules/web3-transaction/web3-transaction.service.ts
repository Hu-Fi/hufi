import { EscrowClient } from '@human-protocol/sdk';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ErrorWeb3Transaction } from '../../common/constants/errors';
import { Web3TransactionStatus } from '../../common/enums/web3-transaction';
import { ControlledError } from '../../common/errors/controlled';
import { Web3Service } from '../web3/web3.service';

import { Web3TransactionDto } from './web3-transaction.dto';
import { Web3TransactionEntity } from './web3-transaction.entity';
import { Web3TransactionRepository } from './web3-transaction.repository';

@Injectable()
export class Web3TransactionService {
  private logger: Logger = new Logger(Web3TransactionService.name);

  constructor(
    private web3TransactionRepository: Web3TransactionRepository,
    private web3Service: Web3Service,
  ) {}

  public async saveWeb3Transaction(
    payload: Web3TransactionDto,
  ): Promise<Web3TransactionEntity> {
    this.logger.debug(
      `Saving web3 transaction for ${payload.contract} at ${payload.address} on chain ${payload.chainId}`,
    );

    const web3Transaction = new Web3TransactionEntity();
    web3Transaction.chainId = payload.chainId;
    web3Transaction.contract = payload.contract;
    web3Transaction.address = payload.address;
    web3Transaction.method = payload.method;
    web3Transaction.data = payload.data;
    web3Transaction.status = Web3TransactionStatus.PENDING;

    await this.web3TransactionRepository.createUnique(web3Transaction);
    return web3Transaction;
  }

  public async updateWeb3TransactionStatus(
    id: number,
    status: Web3TransactionStatus,
  ): Promise<Web3TransactionEntity> {
    this.logger.debug(`Updating web3 transaction status for id: ${id}`);

    const web3Transaction = await this.web3TransactionRepository.findOne({
      where: { id },
    });

    if (!web3Transaction) {
      throw new ControlledError(
        ErrorWeb3Transaction.NotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    web3Transaction.status = status;
    return this.web3TransactionRepository.save(web3Transaction);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedWeb3Transactions(): Promise<void> {
    this.logger.log('Retrying failed web3 transactions');

    const failedTransactions = await this.web3TransactionRepository.find({
      where: { status: Web3TransactionStatus.FAILED },
    });

    for (const transaction of failedTransactions) {
      try {
        const signer = this.web3Service.getSigner(transaction.chainId);
        const escrowClient = await EscrowClient.build(signer);

        this.logger.log(
          `Retrying transaction ${transaction.id} for ${transaction.contract} at ${transaction.address}`,
        );

        switch (transaction.contract) {
          case 'escrow':
            await escrowClient[transaction.method](
              transaction.address,
              ...transaction.data,
            );
            break;
          default:
            throw new ControlledError(
              ErrorWeb3Transaction.InvalidContract,
              HttpStatus.BAD_REQUEST,
            );
        }

        await this.updateWeb3TransactionStatus(
          transaction.id,
          Web3TransactionStatus.SUCCESS,
        );
      } catch (error) {
        this.logger.error(
          `Failed to retry transaction ${transaction.id}: ${error.message}`,
        );
      }
    }

    this.logger.log('Finished retrying failed web3 transactions');
  }
}
