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
const LOG_PRETTY_OVERRIDE = process.env.LOG_PRETTY;

let logLevel = LogLevel.INFO;
if (isLogLevel(LOG_LEVEL_OVERRIDE)) {
  logLevel = LOG_LEVEL_OVERRIDE;
} else if (isDevelopment) {
  logLevel = LogLevel.DEBUG;
}

const defaultLogger = createLogger(
  {
    name: 'DefaultLogger',
    level: logLevel,
    pretty: isDevelopment || LOG_PRETTY_OVERRIDE === 'true',
    disabled: Environment.isTest(),
  },
  {
    environment: Environment.name,
    service: 'hufi-recording-oracle',
    version: Environment.version,
  },
);

export const nestLoggerOverride = new NestLogger(
  defaultLogger.child({ name: 'NestLogger' }),
);

export type { Logger };

export default defaultLogger;
