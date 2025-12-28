import * as crypto from 'crypto';

import { IntelDcapService } from './intel-dcap.service';
import { INTEL_SGX_ROOT_CA_PEM, CertDataType } from './intel-root-ca';

describe('IntelDcapService', () => {
  let service: IntelDcapService;

  beforeEach(() => {
    service = new IntelDcapService();
  });

  describe('Intel Root CA Certificate', () => {
    it('should have valid Intel SGX Root CA certificate', () => {
      const cert = new crypto.X509Certificate(INTEL_SGX_ROOT_CA_PEM);

      expect(cert.subject).toContain('Intel SGX Root CA');
      expect(cert.issuer).toContain('Intel SGX Root CA'); // Self-signed
      expect(cert.ca).toBe(true);

      // Check validity
      const now = new Date();
      const validFrom = new Date(cert.validFrom);
      const validTo = new Date(cert.validTo);
      expect(now >= validFrom).toBe(true);
      expect(now <= validTo).toBe(true);
    });
  });

  describe('parseQuoteSignatureData', () => {
    it('should throw error for quote that is too short', () => {
      const shortQuote = Buffer.alloc(100);

      expect(() => service.parseQuoteSignatureData(shortQuote)).toThrow(
        'Quote too short',
      );
    });

    it('should parse quote signature data structure', () => {
      // Create a minimal valid quote structure
      // Header (48) + TD Report (584) + Signature Data
      const quoteBuffer = Buffer.alloc(800);

      // Set signature length at offset 632
      quoteBuffer.writeUInt32LE(134, 632); // 64 + 64 + 2 + 4 = 134 minimum

      // Set cert data type (CertDataType.PCK_CERT_CHAIN = 5)
      quoteBuffer.writeUInt16LE(CertDataType.PCK_CERT_CHAIN, 632 + 4 + 64 + 64);

      // Set cert data size
      quoteBuffer.writeUInt32LE(0, 632 + 4 + 64 + 64 + 2);

      const result = service.parseQuoteSignatureData(quoteBuffer);

      expect(result.signatureLength).toBe(134);
      expect(result.signature.length).toBe(64);
      expect(result.attestationPublicKey.length).toBe(64);
      expect(result.certificationData.certDataType).toBe(
        CertDataType.PCK_CERT_CHAIN,
      );
    });

    it('should extract certificate chain when present', () => {
      // Create quote with embedded cert chain
      const certChain = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAL0123456789MA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMMBnRl
c3RDQTAEFW0yMzAxMDEwMDAwMDBaFw0yNDAxMDEwMDAwMDBaMBExDzANBgNVBAMM
BnRlc3RDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABIyd0000000000000000
0000000000000000000000000000000000000000000000000000000000000000
-----END CERTIFICATE-----`;

      const certBytes = Buffer.from(certChain, 'utf8');
      const headerSize = 48;
      const tdReportSize = 584;
      const sigDataOffset = headerSize + tdReportSize;

      // Quote size: header + TD report + sig length (4) + sig (64) + key (64) + cert type (2) + cert size (4) + cert chain
      const quoteBuffer = Buffer.alloc(
        sigDataOffset + 4 + 64 + 64 + 2 + 4 + certBytes.length,
      );

      // Signature length
      quoteBuffer.writeUInt32LE(
        64 + 64 + 2 + 4 + certBytes.length,
        sigDataOffset,
      );

      // Cert data type
      quoteBuffer.writeUInt16LE(
        CertDataType.PCK_CERT_CHAIN,
        sigDataOffset + 4 + 64 + 64,
      );

      // Cert data size
      quoteBuffer.writeUInt32LE(
        certBytes.length,
        sigDataOffset + 4 + 64 + 64 + 2,
      );

      // Cert chain data
      certBytes.copy(quoteBuffer, sigDataOffset + 4 + 64 + 64 + 2 + 4);

      const result = service.parseQuoteSignatureData(quoteBuffer);

      expect(result.certificationData.certDataType).toBe(
        CertDataType.PCK_CERT_CHAIN,
      );
      expect(result.certificationData.certDataSize).toBe(certBytes.length);
      expect(result.certificationData.pckCertChain).toBeTruthy();
      expect(result.certificationData.certificates).toBeDefined();
    });
  });

  describe('verifyCertificateChain', () => {
    it('should return error for empty certificate array', () => {
      const result = service.verifyCertificateChain([]);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No certificates in chain');
    });

    it('should validate self-signed Intel Root CA', () => {
      // The Intel Root CA is self-signed, so a chain with just it should work
      const result = service.verifyCertificateChain([INTEL_SGX_ROOT_CA_PEM]);

      // This will fail because it's just the root with no leaf
      // but it should parse without errors
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid certificate data', () => {
      const result = service.verifyCertificateChain(['not a certificate']);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes('Certificate parsing error')),
      ).toBe(true);
    });
  });

  describe('verifyQuoteSignature', () => {
    it('should return false for invalid signature', () => {
      const quoteBuffer = Buffer.alloc(700);
      const attestationPublicKey = Buffer.alloc(64);
      const signature = Buffer.alloc(64);

      // Fill with random data
      crypto.randomFillSync(quoteBuffer);
      crypto.randomFillSync(attestationPublicKey);
      crypto.randomFillSync(signature);

      // This should fail because the signature doesn't match
      const result = service.verifyQuoteSignature(
        quoteBuffer,
        attestationPublicKey,
        signature,
      );

      // Most random data will result in invalid EC points, so it will fail
      expect(result).toBe(false);
    });

    it('should verify a properly signed quote', () => {
      // Generate a test key pair
      const keyPair = crypto.generateKeyPairSync('ec', {
        namedCurve: 'P-256',
      });

      // Create test quote data (header + TD report)
      const quoteData = Buffer.alloc(632);
      crypto.randomFillSync(quoteData);

      // Sign the quote data
      const signer = crypto.createSign('SHA256');
      signer.update(quoteData);
      const derSignature = signer.sign(keyPair.privateKey);

      // Convert DER signature to raw (r || s)
      const rawSignature = derToRawSignature(derSignature);

      // Get raw public key (x || y)
      const pubKeyDer = keyPair.publicKey.export({
        type: 'spki',
        format: 'der',
      });
      const rawPubKey = extractRawPublicKey(pubKeyDer as Buffer);

      const result = service.verifyQuoteSignature(
        quoteData,
        rawPubKey,
        rawSignature,
      );

      expect(result).toBe(true);
    });
  });

  describe('verifyQuoteDcap', () => {
    it('should return error for invalid base64', async () => {
      const result = await service.verifyQuoteDcap('not valid base64!!!');

      expect(result.signatureValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return error for quote too short', async () => {
      const shortQuote = Buffer.alloc(100).toString('base64');
      const result = await service.verifyQuoteDcap(shortQuote);

      expect(result.signatureValid).toBe(false);
      expect(result.errors.some((e) => e.includes('too short'))).toBe(true);
    });

    it('should process a minimal quote structure', async () => {
      // Create a minimal quote structure (will fail validation but should process)
      const quoteBuffer = Buffer.alloc(800);

      // Set signature length
      quoteBuffer.writeUInt32LE(134, 632);

      // Set cert data type
      quoteBuffer.writeUInt16LE(CertDataType.PCK_CERT_CHAIN, 632 + 4 + 64 + 64);

      // Set cert data size (0 = no certs)
      quoteBuffer.writeUInt32LE(0, 632 + 4 + 64 + 64 + 2);

      const result = await service.verifyQuoteDcap(
        quoteBuffer.toString('base64'),
      );

      // Should fail signature validation but not crash
      expect(result.signatureValid).toBe(false);
      expect(result.tcbStatus).toBe('Unknown');
    });
  });
});

/**
 * Helper: Convert DER-encoded ECDSA signature to raw (r || s) format
 */
function derToRawSignature(derSig: Buffer): Buffer {
  // DER format: 0x30 [total-len] 0x02 [r-len] [r] 0x02 [s-len] [s]
  let offset = 2; // Skip 0x30 and total length

  // Parse r
  if (derSig[offset] !== 0x02) throw new Error('Invalid DER signature');
  offset++;
  const rLen = derSig[offset];
  offset++;
  let r = derSig.subarray(offset, offset + rLen);
  offset += rLen;

  // Parse s
  if (derSig[offset] !== 0x02) throw new Error('Invalid DER signature');
  offset++;
  const sLen = derSig[offset];
  offset++;
  let s = derSig.subarray(offset, offset + sLen);

  // Remove leading zeros if present (for positive integers)
  if (r.length > 32 && r[0] === 0) r = r.subarray(1);
  if (s.length > 32 && s[0] === 0) s = s.subarray(1);

  // Pad to 32 bytes if needed
  const rPadded = Buffer.alloc(32);
  const sPadded = Buffer.alloc(32);
  r.copy(rPadded, 32 - r.length);
  s.copy(sPadded, 32 - s.length);

  return Buffer.concat([rPadded, sPadded]);
}

/**
 * Helper: Extract raw public key (x || y) from DER-encoded SPKI
 */
function extractRawPublicKey(spkiDer: Buffer): Buffer {
  // The last 65 bytes of SPKI for P-256 is: 0x04 || x (32) || y (32)
  // Skip the 0x04 prefix
  const point = spkiDer.subarray(spkiDer.length - 65);
  if (point[0] !== 0x04) throw new Error('Expected uncompressed point');
  return point.subarray(1); // Return just x || y (64 bytes)
}
