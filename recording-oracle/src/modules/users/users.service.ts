import crypto from 'crypto';

import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

import { UserEntity } from './user.entity';
import { UsersRepository } from './users.repository';

import * as web3Utils from '@/utils/web3';

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
}
