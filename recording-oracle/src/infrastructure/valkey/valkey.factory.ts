import assert from 'assert';

import { Decoder, GlideClient } from '@valkey/valkey-glide';

import { APP_NAME } from '@/common/constants';
import logger from '@/logger';

export type ValkeyClient = GlideClient & { readonly clientName: string };

async function valkeyFactory({
  name,
  host,
  port,
  dbNumber,
  useTls,
}: {
  name: string;
  host: string;
  port?: number;
  dbNumber: number;
  useTls?: boolean;
}): Promise<ValkeyClient> {
  assert(name, 'Valkey client name must be provided');
  assert(host, 'Valkey host is required');
  assert(
    Number.isInteger(dbNumber) && dbNumber >= 0,
    'dbNumber must be integer',
  );

  const clientName = `${APP_NAME}-${name}`;

  const client = await GlideClient.createClient({
    clientName,
    addresses: [{ host, port }],
    databaseId: dbNumber,
    useTLS: useTls === true,
    defaultDecoder: Decoder.String,
    lazyConnect: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).clientName = clientName;

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

  return client as ValkeyClient;
}

export default {
  create: valkeyFactory,
};
