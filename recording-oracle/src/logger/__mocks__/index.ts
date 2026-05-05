import type { Logger } from '@human-protocol/logger';
import { vi } from 'vitest';

const logger: Logger = {
  child: () => logger,
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

export default logger;
