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
  })
  nActiveCampaigns: number;

  @ApiProperty({
    name: 'rewards_pool_usd',
    description:
      'Total amount of funds available for rewards on active campaigns',
  })
  rewardsPoolUsd: number;

  @ApiProperty({
    name: 'n_completed_campaigns',
    description: 'Total number of completed campaigns',
  })
  nCompletedCampaigns: number | null;

  @ApiProperty({
    name: 'total_rewards_distributed',
    description:
      'Total amount of funds distrubited as rewards on completed campaigns',
  })
  paidRewardsUsd: number | null;
}
