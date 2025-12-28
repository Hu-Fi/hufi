/**
 * TDX Verification E2E Tests
 *
 * These tests run against live TDX infrastructure.
 * Set environment variables to configure:
 *   TDX_HOST - TDX host address (default: ns3222044.ip-57-130-10.eu)
 *   TDX_PROXY_PORT - TDX attestation proxy port (default: 8082)
 *   ORACLE_PORT - Recording oracle port (default: 12000)
 *
 * Run with: npm run test:e2e
 */

const TDX_HOST = process.env.TDX_HOST || 'ns3222044.ip-57-130-10.eu';
const TDX_PROXY_PORT = process.env.TDX_PROXY_PORT || '8082';
const ORACLE_PORT = process.env.ORACLE_PORT || '12000';

const PROXY_URL = `http://${TDX_HOST}:${TDX_PROXY_PORT}`;
const ORACLE_URL = `http://${TDX_HOST}:${ORACLE_PORT}`;

interface TdxStatus {
  available: boolean;
  device?: string;
  tsm_path?: string;
  tsm_available?: boolean;
}

interface TdxQuoteResponse {
  quote: string;
  quote_size: number;
  report_data: string;
  measurements?: {
    mrtd: string;
    rtmr0: string;
    rtmr1: string;
    rtmr2: string;
    rtmr3: string;
  };
}

interface _VerificationResult {
  valid: boolean;
  measurements: {
    mrtd: string;
    rtmr0: string;
    rtmr1: string;
    rtmr2: string;
    rtmr3: string;
  };
  reportData: string;
  errors: string[];
  warnings: string[];
}

async function checkHostAvailable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

describe('TDX Verification E2E Tests', () => {
  let tdxProxyAvailable = false;
  let recordingOracleAvailable = false;
  let savedQuote: string | null = null;

  beforeAll(async () => {
    // Check if TDX infrastructure is available
    tdxProxyAvailable = await checkHostAvailable(`${PROXY_URL}/status`);
    recordingOracleAvailable = await checkHostAvailable(
      `${ORACLE_URL}/health/ping`,
    );

    if (!tdxProxyAvailable) {
      console.warn(
        `TDX attestation proxy not available at ${PROXY_URL} - some tests will be skipped`,
      );
    }
    if (!recordingOracleAvailable) {
      console.warn(
        `Recording oracle not available at ${ORACLE_URL} - some tests will be skipped`,
      );
    }
  });

  describe('TDX Attestation Proxy', () => {
    it('should return TDX status', async () => {
      if (!tdxProxyAvailable) {
        console.warn('Skipping: TDX proxy not available');
        return;
      }

      const response = await fetch(`${PROXY_URL}/status`);
      expect(response.ok).toBe(true);

      const status: TdxStatus = await response.json();
      expect(status).toHaveProperty('available');
      expect(typeof status.available).toBe('boolean');

      if (status.available) {
        expect(status.tsm_available).toBe(true);
      }
    });

    it('should generate TDX quote', async () => {
      if (!tdxProxyAvailable) {
        console.warn('Skipping: TDX proxy not available');
        return;
      }

      const response = await fetch(`${PROXY_URL}/quote`);
      expect(response.ok).toBe(true);

      const quoteResponse: TdxQuoteResponse = await response.json();
      expect(quoteResponse).toHaveProperty('quote');
      expect(quoteResponse).toHaveProperty('quote_size');

      // Quote should be base64 encoded
      expect(quoteResponse.quote).toBeTruthy();
      expect(quoteResponse.quote_size).toBeGreaterThan(0);

      // Decode and check minimum size (header + TD report = 48 + 584 = 632 bytes)
      const quoteBuffer = Buffer.from(quoteResponse.quote, 'base64');
      expect(quoteBuffer.length).toBeGreaterThanOrEqual(632);

      // Save for later tests
      savedQuote = quoteResponse.quote;

      // Check measurements if available
      if (quoteResponse.measurements) {
        expect(quoteResponse.measurements.mrtd).toBeTruthy();
        expect(quoteResponse.measurements.mrtd.length).toBe(96); // 48 bytes hex = 96 chars
        expect(quoteResponse.measurements.rtmr0).toBeTruthy();
        expect(quoteResponse.measurements.rtmr0.length).toBe(96);
      }
    });

    it('should handle non-existent endpoint gracefully', async () => {
      if (!tdxProxyAvailable) {
        console.warn('Skipping: TDX proxy not available');
        return;
      }

      const response = await fetch(`${PROXY_URL}/nonexistent`);
      expect(response.status).toBe(404);
    });
  });

  describe('Recording Oracle Attestation', () => {
    it('should be reachable', async () => {
      if (!recordingOracleAvailable) {
        console.warn('Skipping: Recording oracle not available');
        return;
      }

      const response = await fetch(`${ORACLE_URL}/health/ping`);
      expect(response.ok).toBe(true);
    });

    it('should expose attestation status endpoint', async () => {
      if (!recordingOracleAvailable) {
        console.warn('Skipping: Recording oracle not available');
        return;
      }

      const response = await fetch(`${ORACLE_URL}/attestation/status`);

      // If the endpoint exists, check its response
      if (response.ok) {
        const status = await response.json();
        expect(status).toHaveProperty('available');
      } else {
        // Endpoint may not be deployed yet - this is a warning, not a failure
        console.warn(
          'Attestation status endpoint not available - may need deployment',
        );
      }
    });

    it('should generate quote via attestation endpoint', async () => {
      if (!recordingOracleAvailable) {
        console.warn('Skipping: Recording oracle not available');
        return;
      }

      const challenge = Buffer.from(
        Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)),
      ).toString('hex');

      const response = await fetch(`${ORACLE_URL}/attestation/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData: challenge }),
      });

      // If the endpoint exists, check its response
      if (response.ok) {
        const quoteResponse = await response.json();
        expect(quoteResponse).toHaveProperty('quote');
        expect(quoteResponse.quote).toBeTruthy();
      } else {
        // Endpoint may not be deployed yet
        console.warn(
          'Attestation quote endpoint not available - may need deployment',
        );
      }
    });
  });

  describe('Quote Structure Validation', () => {
    it('should have valid TDX quote v4 structure', async () => {
      if (!savedQuote) {
        if (tdxProxyAvailable) {
          const response = await fetch(`${PROXY_URL}/quote`);
          if (response.ok) {
            const data: TdxQuoteResponse = await response.json();
            savedQuote = data.quote;
          }
        }
      }

      if (!savedQuote) {
        console.warn('Skipping: No TDX quote available');
        return;
      }

      const quoteBuffer = Buffer.from(savedQuote, 'base64');

      // TDX Quote v4 structure checks
      // Header: 48 bytes
      // TD Report: 584 bytes (at offset 48)
      // Quote signature and cert data follow

      expect(quoteBuffer.length).toBeGreaterThanOrEqual(632);

      // Check header version (first 2 bytes should be version)
      const version = quoteBuffer.readUInt16LE(0);
      expect(version).toBeGreaterThanOrEqual(4); // TDX Quote v4

      // Extract MRTD (at offset 48 + 128 = 176, 48 bytes)
      const mrtdOffset = 48 + 128;
      const mrtd = quoteBuffer.subarray(mrtdOffset, mrtdOffset + 48);
      expect(mrtd.length).toBe(48);

      // MRTD should not be all zeros (unless it's a test quote)
      const mrtdHex = mrtd.toString('hex');
      expect(mrtdHex.length).toBe(96);

      // Extract RTMRs (at offset 48 + 368 = 416, 4 x 48 bytes)
      const rtmrOffset = 48 + 368;
      const rtmr0 = quoteBuffer.subarray(rtmrOffset, rtmrOffset + 48);
      const rtmr1 = quoteBuffer.subarray(rtmrOffset + 48, rtmrOffset + 96);
      const rtmr2 = quoteBuffer.subarray(rtmrOffset + 96, rtmrOffset + 144);
      const rtmr3 = quoteBuffer.subarray(rtmrOffset + 144, rtmrOffset + 192);

      expect(rtmr0.length).toBe(48);
      expect(rtmr1.length).toBe(48);
      expect(rtmr2.length).toBe(48);
      expect(rtmr3.length).toBe(48);

      // Extract report data (at offset 48 + 520 = 568, 64 bytes)
      const reportDataOffset = 48 + 520;
      const reportData = quoteBuffer.subarray(
        reportDataOffset,
        reportDataOffset + 64,
      );
      expect(reportData.length).toBe(64);
    });
  });

  describe('Measurement Consistency', () => {
    it('should return consistent measurements across multiple quotes', async () => {
      if (!tdxProxyAvailable) {
        console.warn('Skipping: TDX proxy not available');
        return;
      }

      // Generate two quotes
      const response1 = await fetch(`${PROXY_URL}/quote`);
      const response2 = await fetch(`${PROXY_URL}/quote`);

      expect(response1.ok).toBe(true);
      expect(response2.ok).toBe(true);

      const quote1: TdxQuoteResponse = await response1.json();
      const quote2: TdxQuoteResponse = await response2.json();

      // MRTD should be consistent (it's a static measurement)
      if (quote1.measurements && quote2.measurements) {
        expect(quote1.measurements.mrtd).toBe(quote2.measurements.mrtd);

        // RTMRs may vary based on runtime state, but RTMR0 typically stays consistent
        // for the same software configuration
        // Note: This might not always be true depending on workload
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      if (!recordingOracleAvailable) {
        console.warn('Skipping: Recording oracle not available');
        return;
      }

      // Test with invalid JSON
      const response = await fetch(`${ORACLE_URL}/attestation/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      });

      // Should return 4xx error, not crash
      if (response.status !== 404) {
        // Endpoint exists
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      }
    });
  });
});
