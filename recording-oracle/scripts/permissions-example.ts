import logger from '@/logger';
import { ExchangePermission } from '@/modules/exchanges';
import { CcxtExchangeClient } from '@/modules/exchanges/api-client/ccxt-exchange-client';

// Api key pair for exchange
const API_KEY = 'replace_me';
const SECRET_KEY = 'replace_me';
const EXTRA_CREDS = {
  // uid: 'replace_and_uncomment_if_needed',
} as const;

const EXCHANGE_NAME = 'replace_me';
const SANDBOX = false;

const run = async () => {
  const ccxtExchangeClient = new CcxtExchangeClient(EXCHANGE_NAME, {
    sandbox: SANDBOX,
    apiKey: API_KEY,
    secret: SECRET_KEY,
    extraCreds: EXTRA_CREDS,
    userId: 'scripts-permissions-example',
    loggingConfig: {
      logPermissionErrors: true,
    },
  });

  const hasRequiredCredentials = ccxtExchangeClient.checkRequiredCredentials();
  if (hasRequiredCredentials) {
    logger.info(`All required credentials provided for ${EXCHANGE_NAME}`);
  } else {
    logger.warn(`Not all required credentials provided for ${EXCHANGE_NAME}`);
    return;
  }

  const permissionsCheckResult = await ccxtExchangeClient.checkRequiredAccess(
    Object.values(ExchangePermission),
  );

  logger.info('Permission check result', {
    result: permissionsCheckResult,
  });
};

/**
 * yarn ts-node scripts/permissions-example.ts
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
