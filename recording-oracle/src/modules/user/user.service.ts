import { EncryptionUtils } from '@human-protocol/sdk';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import { PGPConfigService } from '../../common/config/pgp-config.service';
import { ErrorUser } from '../../common/constants/errors';
import { UserStatus } from '../../common/enums/user';
import { SignatureType } from '../../common/enums/web3';
import { ControlledError } from '../../common/errors/controlled';
import { generateNonce } from '../../common/utils/signature';
import { ExchangeAPIKeyEntity, UserEntity } from '../../database/entities';
import { Web3Service } from '../web3/web3.service';

import { ExchangeAPIKeyRepository } from './exchange-api-key.repository';
import { ExchangeAPIKeyCreateRequestDto, SignatureBodyDto } from './user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private userRepository: UserRepository,
    private exchangeAPIKeyRepository: ExchangeAPIKeyRepository,
    private web3Service: Web3Service,
    private pgpConfigService: PGPConfigService,
  ) {}

  public async createWeb3User(address: string): Promise<UserEntity> {
    const userEntity = await this.userRepository.findOneByEvmAddress(address);

    if (userEntity) {
      this.logger.log(ErrorUser.AlreadyExists, UserService.name);
      throw new ControlledError(ErrorUser.AlreadyExists, HttpStatus.CONFLICT);
    }

    const newUser = new UserEntity();
    newUser.evmAddress = address;
    newUser.nonce = generateNonce();
    newUser.status = UserStatus.ACTIVE;

    return await this.userRepository.createUnique(newUser);
  }

  public async getByAddress(address: string): Promise<UserEntity> {
    const userEntity = await this.userRepository.findOneByEvmAddress(address);

    if (!userEntity) {
      throw new ControlledError(ErrorUser.NotFound, HttpStatus.NOT_FOUND);
    }

    return userEntity;
  }

  public async prepareSignatureBody(
    type: SignatureType,
    address: string,
  ): Promise<SignatureBodyDto> {
    let content: string;
    let nonce: string | undefined;

    switch (type) {
      case SignatureType.SIGNUP:
        content = 'signup';
        break;
      case SignatureType.SIGNIN:
        content = 'signin';
        nonce = (await this.userRepository.findOneByEvmAddress(address))?.nonce;
        break;
      default:
        throw new ControlledError('Type not allowed', HttpStatus.BAD_REQUEST);
    }

    return {
      from: address,
      to: this.web3Service.getOperatorAddress(),
      contents: content,
      nonce: nonce ?? undefined,
    };
  }

  public async updateNonce(userEntity: UserEntity): Promise<UserEntity> {
    userEntity.nonce = generateNonce();
    return userEntity.save();
  }

  public async createExchangeAPIKey(
    user: UserEntity,
    exchangeAPIKeyData: ExchangeAPIKeyCreateRequestDto,
  ) {
    const exchangeAPIKey =
      await this.exchangeAPIKeyRepository.findByUserAndExchange(
        user,
        exchangeAPIKeyData.exchangeName,
      );

    if (exchangeAPIKey) {
      throw new ControlledError(
        ErrorUser.ExchangeAPIKeyExists,
        HttpStatus.CONFLICT,
      );
    }

    const encryptedApiKey = await EncryptionUtils.encrypt(
      exchangeAPIKeyData.apiKey,
      [this.pgpConfigService.publicKey],
    );
    const encryptedSecret = await EncryptionUtils.encrypt(
      exchangeAPIKeyData.secret,
      [this.pgpConfigService.publicKey],
    );

    const newExchangeAPIKey = new ExchangeAPIKeyEntity();
    newExchangeAPIKey.exchangeName = exchangeAPIKeyData.exchangeName;
    newExchangeAPIKey.apiKey = encryptedApiKey;
    newExchangeAPIKey.secret = encryptedSecret;

    return await this.exchangeAPIKeyRepository.createUnique(newExchangeAPIKey);
  }
}
