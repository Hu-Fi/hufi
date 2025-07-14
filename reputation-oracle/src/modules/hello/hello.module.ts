import { Module } from '@nestjs/common';

import { HelloService } from './hello.service';

@Module({
  imports: [],
  providers: [HelloService],
  exports: [HelloService],
})
export class HelloModule {}
