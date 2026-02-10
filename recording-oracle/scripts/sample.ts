import '@/setup-libs';

import logger from '@/logger';

const run = async () => {
  logger.info('Here goes your playground code');
};

/**
 * yarn ts-node scripts/sample.ts
 */
void (async () => {
  try {
    await run();
    process.exit(0);
  } catch (error) {
    logger.error('Sample script failed', { error });
    process.exit(1);
  }
})();
