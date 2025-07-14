import { Injectable } from '@nestjs/common';

import logger from '@/logger';

@Injectable()
export class HelloService {
  private readonly logger = logger.child({ context: HelloService.name });

  sayHello(extras?: unknown): void {
    this.logger.info('Hello from reputation oracle standalone app', { extras });
  }
}
