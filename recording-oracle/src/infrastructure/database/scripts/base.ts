import { Logger } from '@/logger';

export type DbScriptOptions = {
  dryRun: boolean;
};

export abstract class DbScript {
  constructor(protected readonly logger: Logger) {}

  async init(): Promise<void> {
    this.logger.info('No initialization step for this script');
  }

  abstract execute(options: DbScriptOptions): Promise<void>;

  abstract revert(options: DbScriptOptions): Promise<void>;
}
