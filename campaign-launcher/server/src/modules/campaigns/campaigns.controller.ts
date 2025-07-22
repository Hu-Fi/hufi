import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CampaignsService } from './campaigns.service';

@ApiTags('Campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Get('/')
  async getCampaigns() {
    return this.campaignsService.getCampaigns();
  }
}
