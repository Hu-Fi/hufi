import { Controller, Get, Redirect } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Redirect('/docs', 302) // Redirect to the '/docs' route with a 302 status code (temporary redirect)
  redirectToDocs() {
    console.log('redirectToDocs');
  }
  @Get()
  getHello() {
    return this.appService.getHello();
  }
}
