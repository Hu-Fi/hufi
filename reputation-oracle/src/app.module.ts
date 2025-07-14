import { Module } from '@nestjs/common';

import { HelloModule } from './modules/hello';

@Module({
  imports: [HelloModule],
})
export class AppModule {}
