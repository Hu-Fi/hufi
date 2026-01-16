import { ApiProperty } from '@nestjs/swagger';

import { type ChainId, ChainIds } from '@/common/constants';
import { IsChainId } from '@/common/validators';

export class GetCampaignsStatsQueryDto {
  @ApiProperty({
    name: 'chain_id',
    enum: ChainIds,
  })
  @IsChainId()
  chainId: ChainId;
}

export class CampaignsStatsDto {
  @ApiProperty({
    name: 'n_active_campaigns',
    description: 'Total number of active campaigns',
    type: Number,
    nullable: true,
  })
  nActiveCampaigns: number | null;

  @ApiProperty({
    name: 'rewards_pool_usd',
    description:
      'Total amount of funds available for rewards on active campaigns',
    type: Number,
    nullable: true,
  })
  rewardsPoolUsd: number | null;

  @ApiProperty({
    name: 'n_finished_campaigns',
    description:
      'Total number of finished campaigns (i.e. discovered, then completed or cancelled)',
    type: Number,
    nullable: true,
  })
  nFinishedCampaigns: number | null;

  @ApiProperty({
    name: 'total_rewards_distributed',
    description:
      'Total amount of funds distrubited as rewards on completed campaigns',
    type: Number,
    nullable: true,
  })
  paidRewardsUsd: number | null;
}
