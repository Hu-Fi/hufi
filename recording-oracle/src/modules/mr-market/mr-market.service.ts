import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import { ErrorMrMarket, ErrorUser } from '../../common/constants/errors';
import { ControlledError } from '../../common/errors/controlled';
import { isCenteralizedExchange } from '../../common/utils/exchange';
import { UserEntity } from '../../database/entities';
import { CampaignService } from '../campaign/campaign.service';
import { UserService } from '../user/user.service';

import { CampaignRegisterRequestDto } from './mr-market.dto';

@Injectable()
export class MrMarketService {
  private readonly logger = new Logger(MrMarketService.name);

  constructor(
    private campaignService: CampaignService,
    private userService: UserService,
  ) {}

  public async createOrGetMrMarketUser(address: string): Promise<UserEntity> {
    const addr = address.toLowerCase();

    try {
      await this.userService.createWeb3User(addr);
    } catch (e: any) {
      if (
        !(e instanceof ControlledError) ||
        e.message !== ErrorUser.AlreadyExists
      ) {
        throw e;
      }
    }

    return this.userService.getByAddress(addr);
  }

  public async registerToCampaign(
    data: CampaignRegisterRequestDto,
  ): Promise<void> {
    const walletAddress = data.walletAddress.toLowerCase();

    const user = await this.createOrGetMrMarketUser(walletAddress);

    try {
      await this.userService.createExchangeAPIKey(user, {
        exchangeName: data.exchangeName.toLowerCase(),
        apiKey: data.apiKey,
        secret: data.secret,
      });
    } catch (e: any) {
      if (
        !(e instanceof ControlledError) ||
        e.message !== ErrorUser.ExchangeAPIKeyExists
      ) {
        throw e;
      }
    }

    try {
      const campaign =
        await this.campaignService.createCampaignIfNotExists(data);

      if (user.campaigns?.some((c) => c.id === campaign.id)) {
        throw new ControlledError(
          ErrorMrMarket.CampaignAlreadyRegistered,
          HttpStatus.CONFLICT,
        );
      }

      if (!isCenteralizedExchange(campaign.exchangeName)) {
        throw new ControlledError(
          ErrorMrMarket.InvalidCampaign,
          HttpStatus.BAD_REQUEST,
        );
      }

      user.campaigns = user.campaigns
        ? [...user.campaigns, campaign]
        : [campaign];
      await user.save();
    } catch (e: any) {
      if (
        !(e instanceof ControlledError) ||
        e.message !== ErrorMrMarket.CampaignAlreadyRegistered
      ) {
        throw e;
      }
    }
  }

  public async checkCampaignRegistration(
    chainId: number,
    walletAddress: string,
    address: string,
  ): Promise<boolean> {
    const user = await this.createOrGetMrMarketUser(
      walletAddress.toLowerCase(),
    );

    return (
      user.campaigns?.some(
        (c) =>
          c.address.toLowerCase() === address.toLowerCase() &&
          c.chainId === chainId,
      ) ?? false
    );
  }
}
