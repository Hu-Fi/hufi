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
    try {
      await this.userService.createWeb3User(address);
    } catch (e) {
      if (e.message !== ErrorUser.AlreadyExists) {
        throw e;
      }
    }
    return await this.userService.getByAddress(address);
  }

  public async registerToCampaign(data: CampaignRegisterRequestDto) {
    await this.createOrGetMrMarketUser(data.walletAddress);

    try {
      const user = await this.userService.getByAddress(data.walletAddress);
      await this.userService.createExchangeAPIKey(user, {
        exchangeName: data.exchangeName,
        apiKey: data.apiKey,
        secret: data.secret,
      });
    } catch (e) {
      if (e.message !== ErrorMrMarket.ExchangeAPIKeyExists) {
        throw e;
      }
    }

    try {
      const user = await this.userService.getByAddress(data.walletAddress);
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

      if (user.campaigns) {
        user.campaigns.push(campaign);
      } else {
        user.campaigns = [campaign];
      }
      await user.save();
    } catch (e) {
      if (e.message !== ErrorMrMarket.CampaignAlreadyRegistered) {
        throw e;
      }
    }
  }

  public async checkCampaignRegistration(
    chainId: number,
    walletAddress: string,
    address: string,
  ) {
    const user = await this.createOrGetMrMarketUser(walletAddress);

    return user.campaigns?.some(
      (c) =>
        c.address.toLowerCase() === address.toLowerCase() &&
        c.chainId === chainId,
    );
  }
}
