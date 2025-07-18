import { createLogger, LogLevel, NestLogger } from '@human-protocol/logger';
import type { Logger } from '@human-protocol/logger';

import Environment from '@/common/utils/environment';

const isDevelopment = Environment.isDevelopment();

const forcePretty = process.env.LOGGER_PRETTY === 'true';

const defaultLogger = createLogger(
  {
    name: 'DefaultLogger',
    level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
    pretty: forcePretty || isDevelopment,
    disabled: Environment.isTest(),
  },
  {
    environment: Environment.name,
    service: 'hufi-reputation-oracle',
    /**
     * This info not injected automatically
     * when sending logs from GitHub Action,
     * so adding it here explicitly for it.
     */
    hostname: process.env.HOSTNAME,
  },
);

export const nestLoggerOverride = new NestLogger(
  defaultLogger.child({ name: 'NestLogger' }),
);

export type { Logger };

export default defaultLogger;
