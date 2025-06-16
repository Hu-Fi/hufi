import { EncryptionConfigService } from '@/config';
import { generateAesEncryptionKey } from '~/test/fixtures/crypto';

export const mockEncryptionConfigService: Omit<
  EncryptionConfigService,
  'configService'
> = {
  aesEncryptionKey: generateAesEncryptionKey(),
};
