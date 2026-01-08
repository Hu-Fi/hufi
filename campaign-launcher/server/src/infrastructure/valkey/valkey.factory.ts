import assert from 'assert';

import { Decoder, GlideClient } from '@valkey/valkey-glide';

import { APP_NAME } from '@/common/constants';
import logger from '@/logger';

export type ValkeyClient = GlideClient;

async function valkeyFactory({
  name,
  host,
  port,
  dbNumber,
}: {
  name: string;
  host: string;
  port?: number;
  dbNumber: number;
}): Promise<ValkeyClient> {
  assert(name, 'Valkey client name must be provided');
  assert(host, 'Valkey host is required');
  assert(
    Number.isInteger(dbNumber) && dbNumber >= 0,
    'dbNumber must be integer',
  );

  const client = await GlideClient.createClient({
    clientName: `${APP_NAME}-${name}`,
    addresses: [{ host, port }],
    databaseId: dbNumber,
    useTLS: false,
    defaultDecoder: Decoder.String,
    lazyConnect: true,
  });

  try {
    await client.ping();
  } catch (error) {
    const errorMessage = 'Failed to connect valkey cluster';
    logger.error(errorMessage, {
      client: name,
      error,
    });
    throw new Error(errorMessage);
  }

  return client;
}

export default {
  create: valkeyFactory,
};
