import { ChainId } from '@human-protocol/sdk';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { LeaderDataDto } from './leader.dto';
import { LeaderService } from './leader.service';

@ApiTags('leader')
@Controller('leader')
export class LeaderController {
  constructor(private leaderService: LeaderService) {}

  @Get('/:chainId/:address')
  @ApiOperation({
    summary: 'Get the leader data for the given chain Id and address',
  })
  @ApiParam({ name: 'chainId', required: true, enum: ChainId })
  @ApiParam({ name: 'address', required: true })
  @ApiResponse({
    status: 200,
    description: 'Leader data',
    type: LeaderDataDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getLeader(
    @Param('chainId') chainId: ChainId,
    @Param('address') address: string,
  ) {
    return this.leaderService.getLeader(chainId, address);
  }
}
