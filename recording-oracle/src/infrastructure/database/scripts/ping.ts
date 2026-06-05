import { setTimeout as delay } from 'timers/promises';

import { MethodNotImplementedError } from '@/common/errors/base';

import { DbScript } from './base';

export default class PingDbScript extends DbScript {
  async execute(): Promise<void> {
    this.logger.info('Ping!');
    await delay(2500);
    this.logger.info('Pong!');
  }

  async revert(): Promise<void> {
    throw new MethodNotImplementedError();
  }
}
