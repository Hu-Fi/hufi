import * as crypto from 'crypto';

import { Injectable, Logger } from '@nestjs/common';

import {
  CertDataType,
  INTEL_SGX_PCS_API_URL,
  INTEL_TDX_PCS_API_URL,
  INTEL_SGX_ROOT_CA_PEM,
  QUOTE_SIGNATURE_DATA_OFFSET,
  TDX_QUOTE_HEADER_SIZE,
  TDX_TD_REPORT_SIZE,
} from './intel-root-ca';

/**
 * Result of Intel DCAP verification
 */
export interface DcapVerificationResult {
  /** Whether the quote signature is valid */
  signatureValid: boolean;
  /** Whether the certificate chain validates to Intel Root CA */
  certificateChainValid: boolean;
  /** TCB status from Intel (UpToDate, SWHardeningNeeded, etc.) */
  tcbStatus: string;
  /** Security advisories that apply to this TCB level */
  advisoryIDs: string[];
  /** Verification errors */
  errors: string[];
  /** Verification warnings */
  warnings: string[];
  /** Raw certification data for debugging */
  certificationData?: CertificationData;
}

/**
 * Parsed certification data from TDX quote
 */
export interface CertificationData {
  certDataType: number;
  certDataSize: number;
  /** PEM-encoded certificate chain (if CertType=5) */
  pckCertChain?: string;
  /** Individual certificates parsed from chain */
  certificates?: string[];
  /** QE Report Certification Data (if CertType=6 or 7) */
  qeReportCertData?: QeReportCertificationData;
  /** Raw certification data for PCS fetch */
  rawCertData?: Buffer;
}

/**
 * QE Report Certification Data structure (Type 6/7)
 */
export interface QeReportCertificationData {
  /** QE Report (384 bytes) */
  qeReport: Buffer;
  /** QE Report Signature (64 bytes) */
  qeReportSignature: Buffer;
  /** QE Authentication Data */
  qeAuthData: Buffer;
  /** Nested certification data */
  nestedCertData: CertificationData;
}

/**
 * Platform info for Intel PCS API
 */
export interface PlatformCertInfo {
  /** CPU SVN (Security Version Number) - 16 bytes hex */
  cpusvn: string;
  /** PCE SVN - 2 bytes hex */
  pcesvn: string;
  /** PCE ID - 2 bytes hex */
  pceid: string;
  /** QE ID - 16 bytes hex */
  qeid: string;
  /** FMSPC - 6 bytes hex */
  fmspc?: string;
}

/**
 * Quote signature structure
 */
interface QuoteSignatureData {
  signatureLength: number;
  /** ECDSA signature (r || s), 64 bytes for P-256 */
  signature: Buffer;
  /** Attestation public key, 64 bytes for P-256 (x || y coordinates) */
  attestationPublicKey: Buffer;
  /** Certification data */
  certificationData: CertificationData;
}

/**
 * TCB Info from Intel PCS
 */
export interface TcbInfo {
  version: number;
  issueDate: string;
  nextUpdate: string;
  fmspc: string;
  tcbType: number;
  tcbEvaluationDataNumber: number;
  tcbLevels: TcbLevel[];
}

interface TcbLevel {
  tcb: {
    sgxtcbcomponents: Array<{ svn: number }>;
    pcesvn: number;
    tdxtcbcomponents?: Array<{ svn: number }>;
  };
  tcbDate: string;
  tcbStatus: string;
  advisoryIDs?: string[];
}

@Injectable()
export class IntelDcapService {
  private readonly logger = new Logger(IntelDcapService.name);

  /**
   * Parse quote signature data from TDX quote buffer
   */
  parseQuoteSignatureData(quoteBuffer: Buffer): QuoteSignatureData {
    // Signature data starts after header + TD report
    let offset = QUOTE_SIGNATURE_DATA_OFFSET;

    // Signature length (4 bytes)
    if (offset + 4 > quoteBuffer.length) {
      throw new Error('Quote too short for signature length');
    }
    const signatureLength = quoteBuffer.readUInt32LE(offset);
    offset += 4;

    if (offset + signatureLength > quoteBuffer.length) {
      throw new Error(
        `Quote too short for signature data (need ${signatureLength} bytes)`,
      );
    }

    // ECDSA signature (64 bytes for P-256: r || s)
    const signature = quoteBuffer.subarray(offset, offset + 64);
    offset += 64;

    // Attestation public key (64 bytes for P-256: x || y)
    const attestationPublicKey = quoteBuffer.subarray(offset, offset + 64);
    offset += 64;

    // Certification data type (2 bytes)
    const certDataType = quoteBuffer.readUInt16LE(offset);
    offset += 2;

    // Certification data size (4 bytes)
    const certDataSize = quoteBuffer.readUInt32LE(offset);
    offset += 4;

    // Certification data
    const certificationData: CertificationData = {
      certDataType,
      certDataSize,
    };

    if (certDataType === CertDataType.PCK_CERT_CHAIN && certDataSize > 0) {
      // Type 5: PCK certificate chain is PEM encoded
      const certChainBuffer = quoteBuffer.subarray(
        offset,
        offset + certDataSize,
      );
      certificationData.pckCertChain = certChainBuffer.toString('utf8');
      certificationData.certificates = this.parseCertChain(
        certificationData.pckCertChain,
      );
    } else if (
      (certDataType === CertDataType.PLATFORM_MANIFEST ||
        certDataType === CertDataType.QE_REPORT_CERT_DATA) &&
      certDataSize > 0
    ) {
      // Type 6/7: QE Report Certification Data structure
      const certDataBuffer = quoteBuffer.subarray(offset, offset + certDataSize);
      certificationData.rawCertData = certDataBuffer;
      certificationData.qeReportCertData =
        this.parseQeReportCertData(certDataBuffer);
    }

    return {
      signatureLength,
      signature,
      attestationPublicKey,
      certificationData,
    };
  }

  /**
   * Parse QE Report Certification Data structure (Type 6/7)
   */
  private parseQeReportCertData(buffer: Buffer): QeReportCertificationData {
    let offset = 0;

    // QE Report (384 bytes)
    const qeReport = buffer.subarray(offset, offset + 384);
    offset += 384;

    // QE Report Signature (64 bytes)
    const qeReportSignature = buffer.subarray(offset, offset + 64);
    offset += 64;

    // QE Auth Data Length (2 bytes)
    const qeAuthDataLength = buffer.readUInt16LE(offset);
    offset += 2;

    // QE Auth Data (variable)
    const qeAuthData = buffer.subarray(offset, offset + qeAuthDataLength);
    offset += qeAuthDataLength;

    // Nested Certification Data Type (2 bytes)
    const nestedCertDataType = buffer.readUInt16LE(offset);
    offset += 2;

    // Nested Certification Data Size (4 bytes)
    const nestedCertDataSize = buffer.readUInt32LE(offset);
    offset += 4;

    // Parse nested certification data
    const nestedCertData: CertificationData = {
      certDataType: nestedCertDataType,
      certDataSize: nestedCertDataSize,
    };

    if (nestedCertDataType === CertDataType.PCK_CERT_CHAIN && nestedCertDataSize > 0) {
      const nestedCertBuffer = buffer.subarray(offset, offset + nestedCertDataSize);
      nestedCertData.pckCertChain = nestedCertBuffer.toString('utf8');
      nestedCertData.certificates = this.parseCertChain(nestedCertData.pckCertChain);
    } else if (nestedCertDataSize > 0) {
      // Store raw data for potential PCS fetch
      nestedCertData.rawCertData = buffer.subarray(offset, offset + nestedCertDataSize);
    }

    return {
      qeReport,
      qeReportSignature,
      qeAuthData,
      nestedCertData,
    };
  }

  /**
   * Parse PEM certificate chain into individual certificates
   */
  private parseCertChain(pckCertChain: string): string[] {
    const certs: string[] = [];
    const regex = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
    let match;
    while ((match = regex.exec(pckCertChain)) !== null) {
      certs.push(match[0]);
    }
    return certs;
  }

  /**
   * Verify that the certificate chain is valid and roots to Intel Root CA
   */
  verifyCertificateChain(certificates: string[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!certificates || certificates.length === 0) {
      return { valid: false, errors: ['No certificates in chain'] };
    }

    try {
      // Parse each certificate
      const x509Certs = certificates.map((pem) =>
        new crypto.X509Certificate(pem),
      );

      // Check if the root is Intel's Root CA
      const rootCert = x509Certs[x509Certs.length - 1];
      const intelRootCert = new crypto.X509Certificate(INTEL_SGX_ROOT_CA_PEM);

      // Compare subject/issuer of root cert with Intel Root CA
      if (rootCert.issuer !== intelRootCert.subject) {
        // The chain might not include the actual root, check if last cert is signed by Intel Root
        if (!rootCert.verify(intelRootCert.publicKey)) {
          errors.push('Certificate chain does not root to Intel SGX Root CA');
        }
      }

      // Verify each certificate in the chain (from leaf to root)
      for (let i = 0; i < x509Certs.length - 1; i++) {
        const cert = x509Certs[i];
        const issuerCert = x509Certs[i + 1];

        // Verify signature
        if (!cert.verify(issuerCert.publicKey)) {
          errors.push(`Certificate ${i} signature verification failed`);
        }

        // Check validity period
        const now = new Date();
        const validFrom = new Date(cert.validFrom);
        const validTo = new Date(cert.validTo);
        if (now < validFrom || now > validTo) {
          errors.push(`Certificate ${i} is not within validity period`);
        }
      }

      // Verify the root/issuer cert against Intel Root CA
      const lastCert = x509Certs[x509Certs.length - 1];
      if (!lastCert.verify(intelRootCert.publicKey)) {
        // It might be the actual Intel Root CA cert
        if (lastCert.fingerprint !== intelRootCert.fingerprint) {
          errors.push('Root certificate not verified against Intel Root CA');
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { valid: false, errors: [`Certificate parsing error: ${message}`] };
    }
  }

  /**
   * Verify the quote signature using ECDSA
   * The signature is over Header + TD Report
   */
  verifyQuoteSignature(
    quoteBuffer: Buffer,
    attestationPublicKey: Buffer,
    signature: Buffer,
  ): boolean {
    try {
      // The signed data is Header + TD Report (first 632 bytes)
      const signedData = quoteBuffer.subarray(
        0,
        TDX_QUOTE_HEADER_SIZE + TDX_TD_REPORT_SIZE,
      );

      // Convert attestation public key to DER format for crypto.verify
      // The key is raw P-256 coordinates (x || y), 64 bytes
      const pubKeyDer = this.ecPointToDer(attestationPublicKey);

      // Create public key object
      const publicKey = crypto.createPublicKey({
        key: pubKeyDer,
        format: 'der',
        type: 'spki',
      });

      // The signature is raw (r || s), need to convert to DER for Node.js crypto
      const signatureDer = this.ecdsaRawToDer(signature);

      // Verify using SHA-256 (P-256 curve uses SHA-256)
      const verifier = crypto.createVerify('SHA256');
      verifier.update(signedData);
      return verifier.verify(publicKey, signatureDer);
    } catch (error) {
      this.logger.error(`Signature verification error: ${error}`);
      return false;
    }
  }

  /**
   * Convert raw EC point (x || y) to DER-encoded SubjectPublicKeyInfo
   */
  private ecPointToDer(rawPoint: Buffer): Buffer {
    // P-256 OID: 1.2.840.10045.3.1.7
    const oid = Buffer.from([
      0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,
    ]);
    // EC public key OID: 1.2.840.10045.2.1
    const ecOid = Buffer.from([
      0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    ]);

    // Uncompressed point: 0x04 || x || y
    const point = Buffer.concat([Buffer.from([0x04]), rawPoint]);

    // BIT STRING wrapper for the point
    const bitString = Buffer.concat([
      Buffer.from([0x03, point.length + 1, 0x00]),
      point,
    ]);

    // SEQUENCE of algorithm OIDs
    const algSeq = Buffer.concat([
      Buffer.from([0x30, ecOid.length + oid.length]),
      ecOid,
      oid,
    ]);

    // Outer SEQUENCE (SubjectPublicKeyInfo)
    const total = Buffer.concat([algSeq, bitString]);
    return Buffer.concat([Buffer.from([0x30, total.length]), total]);
  }

  /**
   * Convert raw ECDSA signature (r || s) to DER format
   */
  private ecdsaRawToDer(rawSig: Buffer): Buffer {
    const r = rawSig.subarray(0, 32);
    const s = rawSig.subarray(32, 64);

    // Encode each integer, adding leading zero if high bit is set
    const encodeInt = (int: Buffer): Buffer => {
      // Remove leading zeros
      let start = 0;
      while (start < int.length - 1 && int[start] === 0) start++;
      let trimmed = int.subarray(start);

      // Add leading zero if high bit is set (to keep it positive)
      if (trimmed[0] & 0x80) {
        trimmed = Buffer.concat([Buffer.from([0x00]), trimmed]);
      }

      return Buffer.concat([Buffer.from([0x02, trimmed.length]), trimmed]);
    };

    const rDer = encodeInt(r);
    const sDer = encodeInt(s);

    return Buffer.concat([
      Buffer.from([0x30, rDer.length + sDer.length]),
      rDer,
      sDer,
    ]);
  }

  /**
   * Extract platform info from QE Report for PCK cert fetch
   */
  extractPlatformInfoFromQeReport(qeReport: Buffer): PlatformCertInfo | null {
    try {
      // QE Report structure (384 bytes):
      // Offset 0-15: CPUSVN (16 bytes)
      // Offset 16-19: MISCSELECT (4 bytes)
      // Offset 20-47: Reserved (28 bytes)
      // Offset 48-63: Attributes (16 bytes)
      // Offset 64-95: MRENCLAVE (32 bytes)
      // Offset 96-127: Reserved (32 bytes)
      // Offset 128-159: MRSIGNER (32 bytes)
      // Offset 160-255: Reserved (96 bytes)
      // Offset 256-257: ISVPRODID (2 bytes)
      // Offset 258-259: ISVSVN (2 bytes)
      // Offset 260-319: Reserved (60 bytes)
      // Offset 320-383: REPORTDATA (64 bytes)

      const cpusvn = qeReport.subarray(0, 16).toString('hex');

      // For TDX, we also need PCEID and PCESVN which are in the certification data
      // PCESVN is part of the quote header at offset 10-11
      // We'll extract these from the nested cert data or use defaults

      return {
        cpusvn,
        pcesvn: '0000', // Will be updated from actual quote
        pceid: '0000',  // Will be updated from actual quote
        qeid: qeReport.subarray(320, 336).toString('hex'), // First 16 bytes of REPORTDATA as QE ID
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error extracting platform info: ${message}`);
      return null;
    }
  }

  /**
   * Extract PCESVN from quote header
   */
  extractPceSvnFromQuote(quoteBuffer: Buffer): string {
    // TDX Quote Header structure (48 bytes):
    // Offset 0-1: Version (2 bytes)
    // Offset 2-3: Attestation Key Type (2 bytes)
    // Offset 4-7: TEE Type (4 bytes)
    // Offset 8-9: Reserved (2 bytes)
    // Offset 10-11: QE SVN (2 bytes)
    // Offset 12-13: PCE SVN (2 bytes)
    // Offset 14-29: QE Vendor ID (16 bytes)
    // Offset 30-49: User Data (20 bytes)

    const pceSvn = quoteBuffer.readUInt16LE(12);
    return pceSvn.toString(16).padStart(4, '0');
  }

  /**
   * Fetch PCK certificate from Intel PCS API
   */
  async fetchPckCertFromPcs(
    platformInfo: PlatformCertInfo,
  ): Promise<{ pckCert: string; certChain: string[] } | null> {
    try {
      // Build the query URL with platform info
      const params = new URLSearchParams({
        cpusvn: platformInfo.cpusvn,
        pcesvn: platformInfo.pcesvn,
        pceid: platformInfo.pceid,
        qeid: platformInfo.qeid,
      });

      const url = `${INTEL_SGX_PCS_API_URL}/pckcert?${params.toString()}`;
      this.logger.log(`Fetching PCK cert from Intel PCS: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.warn(
          `Failed to fetch PCK cert from Intel PCS: HTTP ${response.status}`,
        );
        return null;
      }

      // Get PCK certificate from response body
      const pckCert = await response.text();

      // Get certificate chain from response header
      const certChainHeader = response.headers.get(
        'SGX-PCK-Certificate-Issuer-Chain',
      );
      let certChain: string[] = [pckCert];

      if (certChainHeader) {
        // Header is URL-encoded
        const decodedChain = decodeURIComponent(certChainHeader);
        const chainCerts = this.parseCertChain(decodedChain);
        certChain = [pckCert, ...chainCerts];
      }

      return { pckCert, certChain };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error fetching PCK cert from Intel PCS: ${message}`);
      return null;
    }
  }

  /**
   * Try to get certificates from certification data, fetching from PCS if needed
   */
  async getCertificatesFromCertData(
    certData: CertificationData,
    quoteBuffer: Buffer,
  ): Promise<string[] | null> {
    // Type 5: Direct embedded cert chain
    if (certData.certificates && certData.certificates.length > 0) {
      return certData.certificates;
    }

    // Type 6/7: QE Report Certification Data
    if (certData.qeReportCertData) {
      const nestedCertData = certData.qeReportCertData.nestedCertData;

      // Check if nested data has certs (type 5 inside type 6/7)
      if (nestedCertData.certificates && nestedCertData.certificates.length > 0) {
        return nestedCertData.certificates;
      }

      // Need to fetch from Intel PCS
      const platformInfo = this.extractPlatformInfoFromQeReport(
        certData.qeReportCertData.qeReport,
      );

      if (platformInfo) {
        // Update PCESVN from quote header
        platformInfo.pcesvn = this.extractPceSvnFromQuote(quoteBuffer);

        // Try to extract PCEID from nested cert data if available
        if (nestedCertData.rawCertData && nestedCertData.rawCertData.length >= 2) {
          platformInfo.pceid = nestedCertData.rawCertData
            .subarray(0, 2)
            .toString('hex');
        }

        this.logger.log(
          `Fetching PCK cert from Intel PCS with platformInfo: ${JSON.stringify(platformInfo)}`,
        );

        const pcsResult = await this.fetchPckCertFromPcs(platformInfo);
        if (pcsResult) {
          return pcsResult.certChain;
        }
      }
    }

    return null;
  }

  /**
   * Fetch TCB info from Intel PCS API (TDX endpoint)
   */
  async fetchTcbInfo(fmspc: string): Promise<TcbInfo | null> {
    try {
      // Use TDX endpoint for TDX quotes
      const url = `${INTEL_TDX_PCS_API_URL}/tcb?fmspc=${fmspc}`;
      this.logger.log(`Fetching TDX TCB info from: ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        this.logger.warn(`Failed to fetch TDX TCB info: HTTP ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.tcbInfo as TcbInfo;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error fetching TCB info: ${message}`);
      return null;
    }
  }

  /**
   * Extract FMSPC from PCK certificate
   */
  extractFmspcFromPckCert(pckCertPem: string): string | null {
    try {
      const cert = new crypto.X509Certificate(pckCertPem);
      this.logger.log(`PCK Certificate Subject: ${cert.subject}`);
      this.logger.log(`PCK Certificate Issuer: ${cert.issuer}`);

      // Convert to DER and search for FMSPC OID pattern
      const certDer = Buffer.from(
        pckCertPem
          .replace(/-----BEGIN CERTIFICATE-----/g, '')
          .replace(/-----END CERTIFICATE-----/g, '')
          .replace(/\s/g, ''),
        'base64',
      );

      // FMSPC OID: 1.2.840.113741.1.13.1.4
      // DER encoding: 06 0A 2A 86 48 86 F8 4D 01 0D 01 04
      // The OID length is 10 bytes (0x0A), not 9
      const fmspcOid = Buffer.from([
        0x06, 0x0a, 0x2a, 0x86, 0x48, 0x86, 0xf8, 0x4d, 0x01, 0x0d, 0x01, 0x04,
      ]);

      let oidIndex = certDer.indexOf(fmspcOid);

      // Try alternate OID encoding if not found
      if (oidIndex === -1) {
        const altFmspcOid = Buffer.from([
          0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf8, 0x4d, 0x01, 0x0d, 0x01, 0x04,
        ]);
        oidIndex = certDer.indexOf(altFmspcOid);
        if (oidIndex !== -1) {
          this.logger.log('Found FMSPC with alternate OID encoding');
        }
      }

      if (oidIndex === -1) {
        this.logger.warn('FMSPC OID not found in PCK certificate');
        // Try to find SGX Extensions OID as fallback
        // SGX Extensions OID: 1.2.840.113741.1.13.1
        const sgxExtOid = Buffer.from([
          0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf8, 0x4d, 0x01, 0x0d, 0x01,
        ]);
        const sgxExtIndex = certDer.indexOf(sgxExtOid);
        if (sgxExtIndex !== -1) {
          this.logger.log(`Found SGX Extensions at offset ${sgxExtIndex}, looking for FMSPC nearby`);
          // Search for FMSPC within the SGX extensions area
          const searchArea = certDer.subarray(sgxExtIndex, Math.min(sgxExtIndex + 200, certDer.length));
          this.logger.log(`Search area hex: ${searchArea.subarray(0, 50).toString('hex')}`);
        }
        return null;
      }

      // FMSPC structure: OID + OCTET STRING (04 06 XX XX XX XX XX XX)
      // Skip OID, find OCTET STRING tag (0x04), then length, then value
      let offset = oidIndex + fmspcOid.length;

      // Look for OCTET STRING tag (0x04)
      while (offset < certDer.length && certDer[offset] !== 0x04) {
        offset++;
      }

      if (offset >= certDer.length) {
        this.logger.warn('OCTET STRING not found after FMSPC OID');
        return null;
      }

      offset++; // Skip OCTET STRING tag
      const length = certDer[offset];
      offset++; // Skip length byte

      if (length !== 6) {
        this.logger.warn(`Unexpected FMSPC length: ${length}, expected 6`);
      }

      const fmspc = certDer.subarray(offset, offset + 6).toString('hex');
      this.logger.log(`Extracted FMSPC: ${fmspc}`);
      return fmspc;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error extracting FMSPC: ${message}`);
      return null;
    }
  }

  /**
   * Full DCAP verification workflow
   */
  async verifyQuoteDcap(quoteBase64: string): Promise<DcapVerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const quoteBuffer = Buffer.from(quoteBase64, 'base64');

      // Parse quote signature data
      let signatureData: QuoteSignatureData;
      try {
        signatureData = this.parseQuoteSignatureData(quoteBuffer);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          signatureValid: false,
          certificateChainValid: false,
          tcbStatus: 'Unknown',
          advisoryIDs: [],
          errors: [`Failed to parse quote signature data: ${message}`],
          warnings: [],
        };
      }

      // Get certificates (from embedded chain or Intel PCS)
      let certificates: string[] | null = null;
      let certificateChainValid = false;

      // First try embedded certificates
      if (signatureData.certificationData.certificates) {
        certificates = signatureData.certificationData.certificates;
        this.logger.log('Using embedded certificate chain (type 5)');
      } else {
        // Try to get certificates from nested data or Intel PCS
        this.logger.log(
          `Certification data type ${signatureData.certificationData.certDataType} - attempting to fetch certificates`,
        );
        certificates = await this.getCertificatesFromCertData(
          signatureData.certificationData,
          quoteBuffer,
        );

        if (certificates) {
          this.logger.log(
            `Fetched ${certificates.length} certificates from Intel PCS or nested data`,
          );
          // Store the fetched certificates back in certificationData
          signatureData.certificationData.certificates = certificates;
        } else {
          warnings.push(
            `Certification data type ${signatureData.certificationData.certDataType} - unable to fetch certificates`,
          );
        }
      }

      // Verify certificate chain if we have certificates
      if (certificates && certificates.length > 0) {
        const chainResult = this.verifyCertificateChain(certificates);
        certificateChainValid = chainResult.valid;
        errors.push(...chainResult.errors);
      }

      // Verify quote signature
      const signatureValid = this.verifyQuoteSignature(
        quoteBuffer,
        signatureData.attestationPublicKey,
        signatureData.signature,
      );

      if (!signatureValid) {
        errors.push('Quote signature verification failed');
      }

      // Try to get TCB info
      let tcbStatus = 'Unknown';
      const advisoryIDs: string[] = [];

      if (
        signatureData.certificationData.certificates &&
        signatureData.certificationData.certificates.length > 0
      ) {
        const fmspc = this.extractFmspcFromPckCert(
          signatureData.certificationData.certificates[0],
        );
        if (fmspc) {
          const tcbInfo = await this.fetchTcbInfo(fmspc);
          if (tcbInfo && tcbInfo.tcbLevels.length > 0) {
            // Use the first TCB level status (most recent)
            tcbStatus = tcbInfo.tcbLevels[0].tcbStatus;
            if (tcbInfo.tcbLevels[0].advisoryIDs) {
              advisoryIDs.push(...tcbInfo.tcbLevels[0].advisoryIDs);
            }
          }
        }
      }

      return {
        signatureValid,
        certificateChainValid,
        tcbStatus,
        advisoryIDs,
        errors,
        warnings,
        certificationData: signatureData.certificationData,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        signatureValid: false,
        certificateChainValid: false,
        tcbStatus: 'Unknown',
        advisoryIDs: [],
        errors: [`DCAP verification failed: ${message}`],
        warnings: [],
      };
    }
  }
}
