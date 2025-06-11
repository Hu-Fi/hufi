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
  JoinedCampaignDto,
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

  public async checkExchangeAPIKeyExists(
    address: string,
    exchangeName: string,
  ): Promise<boolean> {
    const user = await this.getByAddress(address);

    return !!(await this.exchangeAPIKeyRepository.findByUserAndExchange(
      user,
      exchangeName,
    ));
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
    newExchangeAPIKey.user = user;
    newExchangeAPIKey.exchangeName = exchangeAPIKeyData.exchangeName;
    newExchangeAPIKey.apiKey = encryptedApiKey;
    newExchangeAPIKey.secret = encryptedSecret;

    return await this.exchangeAPIKeyRepository.createUnique(newExchangeAPIKey);
  }

  public async registerToCampaign(
    user: UserEntity,
    data: CampaignRegisterRequestDto,
  ) {
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
        campaign.exchangeName,
      );

    if (isCenteralizedExchange(campaign.exchangeName) && !exchangeAPIKey) {
      throw new ControlledError(
        ErrorUser.ExchangeAPIKeyMissing,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.campaigns) {
      user.campaigns.push(campaign);
    } else {
      user.campaigns = [campaign];
    }
    await user.save();
  }

  public async checkCampaignRegistration(user: UserEntity, address: string) {
    return user.campaigns?.some(
      (c) => c.address.toLowerCase() === address.toLowerCase(),
    );
  }

  public async checkUserExists(address: string): Promise<boolean> {
    return !!(await this.userRepository.findOneByEvmAddress(address));
  }

  public async getUserJoinedCampaigns(
    user: UserEntity,
    chainId: number,
  ): Promise<JoinedCampaignDto[]> {
    if (!user || !user.campaigns) {
      return [];
    }

    return Promise.all(
      user.campaigns
        .filter((c) => c.chainId === chainId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .map(async (c) => ({
          id: c.id,
          chainId: c.chainId,
          address: c.address,
          exchangeName: c.exchangeName,
          token: c.token,
          tokenDecimals: await this.web3Service.getTokenDecimals(
            c.fundToken,
            c.chainId,
          ),
          tokenSymbol: await this.web3Service.getTokenSymbol(
            c.fundToken,
            c.chainId,
          ),
          startDate: c.startDate,
          endDate: c.endDate,
          fundToken: c.fundToken,
          fundAmount: c.fundAmount,
          lastSyncedAt: c.lastSyncedAt,
        })),
    );
  }
}
