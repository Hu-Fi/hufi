import { faker } from '@faker-js/faker';

import { EVM_SIGNATURE_REGEX } from '@/common/constants';
import { InvalidEvmAddressError } from '@/common/errors/web3';
import { isValidNonce } from '@/common/validators';
import {
  generateEthWallet,
  generateInvalidEvmAddress,
} from '~/test/fixtures/web3';

import * as web3Utils from './web3';

const PERMANENT_PRIVATE_KEY =
  'cb254fa8bde66d324fda07f6c00002ba73fc74f88edbea8006668c161590ba82';
const PERMANENT_ADDRESS = '0x208E32c5C40923C5d0095df74aF8CD0c3e0d0898';
const PERMANENT_MESSAGE = 'Permanent message to validate exact signature';
const PERMANENT_SIGNATURE =
  '0x40549411f0ac5e8af988657d632e41294a1fdfdc00fc1f7a4607376e867b7c38715c009245d0aa7b94277fad7eaf7f96aa45ea9dcbae7275bce5a88d7ea6a7151b';

describe('Web3 utilities', () => {
  let privateKey: string;
  let address: string;

  beforeEach(() => {
    ({ privateKey, address } = generateEthWallet());
  });

  describe('generateNonce', () => {
    it('should generate nonce exactly 32 hex characters length', () => {
      const nonce = web3Utils.generateNonce();
      expect(isValidNonce(nonce)).toBe(true);
    });
  });

  describe('assertValidEvmAddress', () => {
    it('should not throw for valid address', () => {
      expect(() => web3Utils.assertValidEvmAddress(address)).not.toThrow();
    });

    it('should throw for invalid address', () => {
      expect(() =>
        web3Utils.assertValidEvmAddress(generateInvalidEvmAddress()),
      ).toThrow(InvalidEvmAddressError);
    });
  });

  describe('signMessage', () => {
    it('should sign message when it is a string', async () => {
      const message = faker.lorem.words();

      const signature = await web3Utils.signMessage(message, privateKey);

      expect(signature).toMatch(EVM_SIGNATURE_REGEX);
    });

    it('should sign message when it is an object', async () => {
      const message = {
        [faker.string.sample()]: new Date(),
      };

      const signature = await web3Utils.signMessage(message, privateKey);

      expect(signature).toMatch(EVM_SIGNATURE_REGEX);
    });

    it('should return exact signature', async () => {
      const signature = await web3Utils.signMessage(
        PERMANENT_MESSAGE,
        PERMANENT_PRIVATE_KEY,
      );

      expect(signature).toBe(PERMANENT_SIGNATURE);
    });
  });

  describe('verifySignature', () => {
    it('should return true for valid exact signature', async () => {
      const result = web3Utils.verifySignature(
        PERMANENT_MESSAGE,
        PERMANENT_SIGNATURE,
        [PERMANENT_ADDRESS],
      );

      expect(result).toBe(true);
    });

    it('should return true for valid signature', async () => {
      const message = faker.lorem.words();

      const signature = await web3Utils.signMessage(message, privateKey);

      const result = web3Utils.verifySignature(message, signature, [address]);

      expect(result).toBe(true);
    });

    it('should return false if signature is not valid', async () => {
      const message = faker.lorem.words();
      const invalidSignature = '0xInvalidSignature';

      const result = web3Utils.verifySignature(message, invalidSignature, [
        address,
      ]);

      expect(result).toBe(false);
    });

    it('should return false when signature not verified', async () => {
      const message = faker.lorem.words();

      const signature = await web3Utils.signMessage(message, privateKey);

      const { address: anotherSignerAddress } = generateEthWallet();
      const result = web3Utils.verifySignature(message, signature, [
        anotherSignerAddress,
      ]);

      expect(result).toBe(false);
    });
  });

  describe('recoverSignerAddress', () => {
    it('should recover the exact signer', async () => {
      const result = web3Utils.recoverSignerAddress(
        PERMANENT_MESSAGE,
        PERMANENT_SIGNATURE,
      );

      expect(result).toBe(PERMANENT_ADDRESS);
    });

    it('should recover the correct signer', async () => {
      const message = faker.lorem.words();
      const signature = await web3Utils.signMessage(message, privateKey);

      const result = web3Utils.recoverSignerAddress(message, signature);

      expect(result).toBe(address);
    });

    it('should return null for invalid signature', () => {
      const message = faker.lorem.words();
      const invalidSignature = '0xInvalidSignature';

      const signer = web3Utils.recoverSignerAddress(message, invalidSignature);

      expect(signer).toBe(null);
    });

    it('should recover the correct signer if message is an object', async () => {
      const message = {
        [faker.string.sample()]: new Date(),
      };
      const signature = await web3Utils.signMessage(message, privateKey);

      const recoveredAddress = web3Utils.recoverSignerAddress(
        message,
        signature,
      );

      expect(recoveredAddress).toBe(address);
    });
  });
});
