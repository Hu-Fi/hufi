import crypto from 'crypto';

import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

import { DEFAULT_NONCE } from '@/common/constants';
import * as web3Utils from '@/utils/web3';

import { UserEntity } from './user.entity';
import { UserNotFoundError } from './users.errors';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(address: string): Promise<UserEntity> {
    web3Utils.assertValidEvmAddress(address);

    const newUser = new UserEntity();
    newUser.id = crypto.randomUUID();
    newUser.evmAddress = ethers.getAddress(address);
    newUser.nonce = web3Utils.generateNonce();
    newUser.createdAt = new Date();
    newUser.updatedAt = newUser.createdAt;

    await this.usersRepository.insert(newUser);

    return newUser;
  }

  async findOneByEvmAddress(address: string): Promise<UserEntity | null> {
    web3Utils.assertValidEvmAddress(address);

    const checksummedAddress = ethers.getAddress(address);

    return this.usersRepository.findOneByEvmAddress(checksummedAddress);
  }

  async getNonce(address: string): Promise<string> {
    const user = await this.findOneByEvmAddress(address);
    if (!user) {
      return DEFAULT_NONCE;
    }

    return user.nonce;
  }

  async assertUserExistsById(userId: string): Promise<void> {
    const userExists = await this.usersRepository.existsById(userId);
    if (!userExists) {
      throw new UserNotFoundError(userId);
    }
  }
}
