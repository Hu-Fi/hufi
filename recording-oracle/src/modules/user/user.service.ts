import { EncryptionUtils } from '@human-protocol/sdk';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import { PGPConfigService } from '../../common/config/pgp-config.service';
import { ErrorUser } from '../../common/constants/errors';
import { UserStatus } from '../../common/enums/user';
import { SignatureType } from '../../common/enums/web3';
import { ControlledError } from '../../common/errors/controlled';
import { isCenteralizedExchange } from '../../common/utils/exchange';
import { generateNonce } from '../../common/utils/signature';
import { ExchangeAPIKeyEntity, UserEntity } from '../../database/entities';
import { CampaignService } from '../campaign/campaign.service';
import { Web3Service } from '../web3/web3.service';

import { ExchangeAPIKeyRepository } from './exchange-api-key.repository';
import {
  CampaignRegisterRequestDto,
  ExchangeAPIKeyCreateRequestDto,
  SignatureBodyDto,
} from './user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private userRepository: UserRepository,
    private exchangeAPIKeyRepository: ExchangeAPIKeyRepository,
    private web3Service: Web3Service,
    private pgpConfigService: PGPConfigService,
    private campaignService: CampaignService,
  ) {}

  public async createWeb3User(address: string): Promise<UserEntity> {
    const normalized = address.toLowerCase();
    if (await this.userRepository.findOneByEvmAddress(normalized)) {
      this.logger.log(ErrorUser.AlreadyExists, UserService.name);
      throw new ControlledError(ErrorUser.AlreadyExists, HttpStatus.CONFLICT);
    }

    const newUser = new UserEntity();
    newUser.evmAddress = normalized;
    newUser.nonce = generateNonce();
    newUser.status = UserStatus.ACTIVE;

    return this.userRepository.createUnique(newUser);
  }

  public async getByAddress(address: string): Promise<UserEntity> {
    const userEntity = await this.userRepository.findOneByEvmAddress(
      address.toLowerCase(),
    );
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
        nonce = (
          await this.userRepository.findOneByEvmAddress(address.toLowerCase())
        )?.nonce;
        break;
      default:
        throw new ControlledError('Type not allowed', HttpStatus.BAD_REQUEST);
    }

    return {
      from: address,
      to: this.web3Service.getOperatorAddress(),
      contents: content,
      nonce,
    };
  }

  public async updateNonce(userEntity: UserEntity): Promise<UserEntity> {
    userEntity.nonce = generateNonce();
    return userEntity.save();
  }

  public async checkExchangeAPIKeyExists(
    address: string,
    exchangeName: string,
  ): Promise<boolean> {
    const user = await this.getByAddress(address);
    return !!(await this.exchangeAPIKeyRepository.findByUserAndExchange(
      user,
      exchangeName.toLowerCase(),
    ));
  }

  public async createExchangeAPIKey(
    user: UserEntity,
    data: ExchangeAPIKeyCreateRequestDto,
  ): Promise<ExchangeAPIKeyEntity> {
    if (
      await this.exchangeAPIKeyRepository.findByUserAndExchange(
        user,
        data.exchangeName.toLowerCase(),
      )
    ) {
      throw new ControlledError(
        ErrorUser.ExchangeAPIKeyExists,
        HttpStatus.CONFLICT,
      );
    }

    const encryptedApiKey = await EncryptionUtils.encrypt(data.apiKey, [
      this.pgpConfigService.publicKey,
    ]);
    const encryptedSecret = await EncryptionUtils.encrypt(data.secret, [
      this.pgpConfigService.publicKey,
    ]);

    const key = new ExchangeAPIKeyEntity();
    key.user = user;
    key.exchangeName = data.exchangeName.toLowerCase();
    key.apiKey = encryptedApiKey;
    key.secret = encryptedSecret;

    return this.exchangeAPIKeyRepository.createUnique(key);
  }

  public async registerToCampaign(
    user: UserEntity,
    data: CampaignRegisterRequestDto,
  ): Promise<void> {
    const campaign = await this.campaignService.createCampaignIfNotExists(data);

    if (user.campaigns?.some((c) => c.id === campaign.id)) {
      throw new ControlledError(
        ErrorUser.CampaignAlreadyRegistered,
        HttpStatus.CONFLICT,
      );
    }

    const exchangeAPIKey =
      await this.exchangeAPIKeyRepository.findByUserAndExchange(
        user,
        campaign.exchangeName.toLowerCase(),
      );

    if (isCenteralizedExchange(campaign.exchangeName) && !exchangeAPIKey) {
      throw new ControlledError(
        ErrorUser.ExchangeAPIKeyMissing,
        HttpStatus.BAD_REQUEST,
      );
    }

    user.campaigns = user.campaigns
      ? [...user.campaigns, campaign]
      : [campaign];
    await user.save();
  }

  public async checkCampaignRegistration(
    user: UserEntity,
    address: string,
  ): Promise<boolean> {
    return user.campaigns?.some(
      (c) => c.address.toLowerCase() === address.toLowerCase(),
    );
  }

  public async checkUserExists(address: string): Promise<boolean> {
    return !!(await this.userRepository.findOneByEvmAddress(
      address.toLowerCase(),
    ));
  }
}
