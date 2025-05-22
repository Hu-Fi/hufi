import { EscrowClient } from '@human-protocol/sdk';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { In } from 'typeorm';

import { ErrorWeb3Transaction } from '../../common/constants/errors';
import { Web3TransactionStatus } from '../../common/enums/web3-transaction';
import { ControlledError } from '../../common/errors/controlled';
import { Web3TransactionEntity } from '../../database/entities';
import { PgLockService } from '../../database/pg-lock.service';
import { Web3Service } from '../web3/web3.service';

import { Web3TransactionDto } from './web3-transaction.dto';
import { Web3TransactionRepository } from './web3-transaction.repository';

@Injectable()
export class Web3TransactionService {
  private logger = new Logger(Web3TransactionService.name);

  constructor(
    private web3TransactionRepository: Web3TransactionRepository,
    private web3Service: Web3Service,
    private readonly pgLockService: PgLockService,
  ) {}

  public async saveWeb3Transaction(
    payload: Web3TransactionDto,
  ): Promise<Web3TransactionEntity> {
    const web3Transaction = this.web3TransactionRepository.create({
      chainId: payload.chainId,
      contract: payload.contract.toLowerCase(),
      address: payload.address.toLowerCase(),
      method: payload.method,
      data: payload.data ?? [],
      status: payload.status ?? Web3TransactionStatus.PENDING,
    });

    this.logger.debug(
      `Saving web3 transaction record for ${payload.contract} at ${payload.address} on chain ${payload.chainId}`,
    );

    return this.web3TransactionRepository.createUnique(web3Transaction);
  }

  public async updateWeb3TransactionStatus(
    id: string,
    status: Web3TransactionStatus,
  ): Promise<Web3TransactionEntity> {
    this.logger.debug(`Updating web3 transaction status ${id}`);
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
    await this.pgLockService.withLock(
      'cron:retryFailedWeb3Transactions',
      async () => {
        const candidates = await this.web3TransactionRepository.find({
          where: {
            status: In([Web3TransactionStatus.FAILED]),
          },
        });

        for (const transaction of candidates) {
          try {
            // lock the web3Transaction so parallel workers don’t pick it up
            await this.updateWeb3TransactionStatus(
              transaction.id,
              Web3TransactionStatus.PENDING,
            );

            const signer = this.web3Service.getSigner(transaction.chainId);
            const escrowClient = await EscrowClient.build(signer);

            const args: string[] = Array.isArray(transaction.data)
              ? transaction.data.map(String)
              : JSON.parse(String(transaction.data)).map(String);
            this.logger.error(`ARGS: ${args}`);

            this.logger.log(
              `Retrying transaction ${transaction.id} for ${transaction.contract} at ${transaction.address} on chain ${transaction.chainId}`,
            );

            if (transaction.contract === 'escrow') {
              await escrowClient.storeResults(
                transaction.address,
                args[0],
                args[1],
              );
            } else {
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
            await this.updateWeb3TransactionStatus(
              transaction.id,
              Web3TransactionStatus.FAILED,
            );
            this.logger.error(
              `Failed to retry transaction ${transaction.id}: ${error.message}`,
            );
          }
        }

        this.logger.log('Finished retrying failed web3 transactions');
      },
    );
  }
}
