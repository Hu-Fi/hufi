import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiTags, ApiExcludeController } from '@nestjs/swagger';

@Controller('/')
@ApiExcludeController()
@ApiTags('Main')
export class AppController {
  @Get('/')
  @Redirect('/swagger', 301)
  public redirect(): void {}
}
