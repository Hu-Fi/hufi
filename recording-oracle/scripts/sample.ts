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
    console.log('Failed', error);
    process.exit(1);
  }
})();
