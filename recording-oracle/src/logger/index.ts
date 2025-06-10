import Environment from '@/utils/environment';

import NestLogger from './nest-logger';
import { createLogger } from './pino-logger';
import { LogLevel } from './types';

const isDevelopment = Environment.isDevelopment();

const defaultLogger = createLogger(
  {
    name: 'DefaultLogger',
    level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
    pretty: isDevelopment,
    disabled: Environment.isTest(),
  },
  {
    environment: Environment.name,
    service: 'hufi-recording-oracle',
  },
);

export const nestLoggerOverride = new NestLogger(
  defaultLogger.child({ name: 'NestLogger' }),
);

export type { Logger } from './types';

export default defaultLogger;
