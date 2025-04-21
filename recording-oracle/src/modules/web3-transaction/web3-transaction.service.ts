import { EscrowClient } from '@human-protocol/sdk';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { In } from 'typeorm';

import { ErrorWeb3Transaction } from '../../common/constants/errors';
import { Web3TransactionStatus } from '../../common/enums/web3-transaction';
import { ControlledError } from '../../common/errors/controlled';
import { Web3TransactionEntity } from '../../database/entities';
import { Web3Service } from '../web3/web3.service';

import { Web3TransactionDto } from './web3-transaction.dto';
import { Web3TransactionRepository } from './web3-transaction.repository';

@Injectable()
export class Web3TransactionService {
  private readonly logger = new Logger(Web3TransactionService.name);

  constructor(
    private readonly web3TransactionRepository: Web3TransactionRepository,
    private readonly web3Service: Web3Service,
  ) {}

  public async saveWeb3Transaction(
    payload: Web3TransactionDto,
  ): Promise<Web3TransactionEntity> {
    const tx = this.web3TransactionRepository.create({
      chainId: payload.chainId,
      contract: payload.contract.toLowerCase(),
      address: payload.address.toLowerCase(),
      method: payload.method,
      data: payload.data ?? [],
      status: payload.status ?? Web3TransactionStatus.PENDING,
    });

    this.logger.debug(
      `Creating tx ${tx.method} on ${tx.contract}:${tx.address} (chain ${tx.chainId})`,
    );

    return this.web3TransactionRepository.createUnique(tx);
  }

  public async updateWeb3TransactionStatus(
    id: string,
    status: Web3TransactionStatus,
  ): Promise<Web3TransactionEntity> {
    const tx = await this.web3TransactionRepository.findOne({ where: { id } });

    if (!tx) {
      throw new ControlledError(
        ErrorWeb3Transaction.NotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    tx.status = status;
    return this.web3TransactionRepository.save(tx);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedWeb3Transactions(): Promise<void> {
    this.logger.log('Retrying pending/failed web3 transactions');

    const candidates = await this.web3TransactionRepository.find({
      where: {
        status: In([
          Web3TransactionStatus.FAILED,
          Web3TransactionStatus.PENDING,
        ]),
      },
    });

    for (const tx of candidates) {
      try {
        // lock the tx so parallel workers don’t pick it up
        await this.updateWeb3TransactionStatus(
          tx.id,
          Web3TransactionStatus.PENDING,
        );

        const signer = this.web3Service.getSigner(tx.chainId);
        const escrowClient = await EscrowClient.build(signer);

        const args: unknown[] = Array.isArray(tx.data)
          ? tx.data
          : JSON.parse(String(tx.data));

        this.logger.log(
          `⟳  TX ${tx.id}: ${tx.contract}.${tx.method} → ${tx.address} (${tx.chainId})`,
        );

        if (tx.contract === 'escrow') {
          const fn = (escrowClient as any)[tx.method];
          if (typeof fn !== 'function') {
            throw new ControlledError(
              ErrorWeb3Transaction.InvalidContract,
              HttpStatus.BAD_REQUEST,
            );
          }
          await fn(tx.address, ...args);
        } else {
          throw new ControlledError(
            ErrorWeb3Transaction.InvalidContract,
            HttpStatus.BAD_REQUEST,
          );
        }

        await this.updateWeb3TransactionStatus(
          tx.id,
          Web3TransactionStatus.SUCCESS,
        );
      } catch (err: any) {
        await this.updateWeb3TransactionStatus(
          tx.id,
          Web3TransactionStatus.FAILED,
        );
        this.logger.error(
          `✘  TX ${tx.id} failed again: ${err?.message ?? err}`,
        );
      }
    }

    this.logger.log('Finished web3‑transaction retry pass');
  }
}
