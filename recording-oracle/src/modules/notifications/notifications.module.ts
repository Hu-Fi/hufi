import { Module } from '@nestjs/common';

import { UsersModule } from '@/modules/users';

import { NotificationsService } from './notifications.service';

@Module({
  imports: [UsersModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
