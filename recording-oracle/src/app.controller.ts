import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

import { Public } from '@/common/decorators';

@Controller()
export class AppController {
  @Public()
  @Get('/')
  @Redirect('/swagger', 301)
  @ApiExcludeEndpoint()
  public swagger(): void {}
}
