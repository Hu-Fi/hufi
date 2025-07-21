import { createLogger, LogLevel, NestLogger } from '@human-protocol/logger';
import type { Logger } from '@human-protocol/logger';

import Environment from '@/common/utils/environment';

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
    service: 'hufi-campaign-launcher',
  },
);

export const nestLoggerOverride = new NestLogger(
  defaultLogger.child({ name: 'NestLogger' }),
);

export type { Logger };

export default defaultLogger;
