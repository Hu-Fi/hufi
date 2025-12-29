import assert from 'assert';

import _ from 'lodash';
import { createClient } from 'redis';

import { APP_NAME } from '@/common/constants';
import logger from '@/logger';

const ERROR_LOG_THROTTLE_MS = 5 * 1000;

export type RedisClient = ReturnType<typeof createClient>;

function redisFactory({
  name,
  endpoint,
}: {
  name: string;
  endpoint: string;
}): RedisClient {
  assert(name, 'Redis client name must be provided');

  const client = createClient({
    url: endpoint,
    name: `${APP_NAME}-${name}`,
  });

  client.on(
    'error',
    _.throttle((error) => {
      logger.error('Redis client error', {
        client: name,
        error,
      });
    }, ERROR_LOG_THROTTLE_MS),
  );

  return client;
}

export default redisFactory;
