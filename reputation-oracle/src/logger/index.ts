import {
  createLogger,
  isLogLevel,
  LogLevel,
  NestLogger,
} from '@human-protocol/logger';
import type { Logger } from '@human-protocol/logger';

import Environment from '@/common/utils/environment';

const isDevelopment = Environment.isDevelopment();

const LOG_LEVEL_OVERRIDE = process.env.LOG_LEVEL;

let logLevel = LogLevel.INFO;
if (isLogLevel(LOG_LEVEL_OVERRIDE)) {
  logLevel = LOG_LEVEL_OVERRIDE;
} else if (isDevelopment) {
  logLevel = LogLevel.DEBUG;
}

const forcePretty = process.env.LOGGER_PRETTY === 'true';

const defaultLogger = createLogger(
  {
    name: 'DefaultLogger',
    level: logLevel,
    pretty: forcePretty || isDevelopment,
    disabled: Environment.isTest(),
  },
  {
    environment: Environment.name,
    service: 'hufi-reputation-oracle',
    version: Environment.version,
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
