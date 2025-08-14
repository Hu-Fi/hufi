import { Module } from '@nestjs/common';

import { CampaignsModule } from '@/modules/campaigns';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [CampaignsModule],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [],
})
export class AdminModule {}
