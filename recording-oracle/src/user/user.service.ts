import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/user.entity';
import { Campaign } from '../common/entities/campaign.entity';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
  ) {}

  async signUp(
    userId: string,
    exchange:string,
    apiKey: string,
    secret: string,
    campaignAddress: string,
  ): Promise<User> {
    // Encrypt API keys
    const encryptedApiKey = EncryptionService.encrypt(apiKey);
    const encryptedSecret = EncryptionService.encrypt(secret);

    // Check if the campaign exists, create if not
    let campaign = await this.campaignRepository.findOneBy({
      address: campaignAddress,
    });
    if (!campaign) {
      campaign = this.campaignRepository.create({ address: campaignAddress });
      await this.campaignRepository.save(campaign);
    }

    // Check if the user exists
    let user = await this.userRepository.findOne({
      where: { userId },
      relations: ['campaigns'], // Load campaigns to check existing associations
    });

    if (user) {
      // Update API keys and campaigns
      user.apiKey = encryptedApiKey;
      user.secret = encryptedSecret;
      // Add campaign to user's campaigns if not already associated
      if (!user.campaigns.some((c) => c.address === campaignAddress)) {
        user.campaigns.push(campaign);
      }
    } else {
      // Create new user
      user = this.userRepository.create({
        userId,
        exchange,
        apiKey: encryptedApiKey,
        secret: encryptedSecret,
        campaigns: [campaign],
      });
    }

    await this.userRepository.save(user);
    return user;
  }

  // Additional methods (e.g., decrypt API keys, fetch user info, etc.)
}
