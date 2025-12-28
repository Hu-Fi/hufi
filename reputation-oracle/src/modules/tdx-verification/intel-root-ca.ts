/**
 * Intel SGX/TDX Root CA Certificates
 *
 * These certificates are the trust anchors for Intel's attestation infrastructure.
 * They are used to verify the certificate chain in TDX quotes.
 *
 * Source: https://api.portal.trustedservices.intel.com/content/documentation.html
 * Download: https://certificates.trustedservices.intel.com/Intel_SGX_Provisioning_Certification_RootCA.pem
 */

/**
 * Intel SGX Provisioning Certification Root CA Certificate (API v3/v4)
 *
 * Fingerprint: 8bd31eb1d63ce37382c0ffaa0d8200a3011ad6ff
 * Valid: 2018-05-21 to 2049-12-31
 * Subject: CN=Intel SGX Root CA, O=Intel Corporation, L=Santa Clara, ST=CA, C=US
 */
export const INTEL_SGX_ROOT_CA_PEM = `-----BEGIN CERTIFICATE-----
MIICjzCCAjSgAwIBAgIUImUM1lqdNInzg7SVUr9QGzknBqwwCgYIKoZIzj0EAwIw
aDEaMBgGA1UEAwwRSW50ZWwgU0dYIFJvb3QgQ0ExGjAYBgNVBAoMEUludGVsIENv
cnBvcmF0aW9uMRQwEgYDVQQHDAtTYW50YSBDbGFyYTELMAkGA1UECAwCQ0ExCzAJ
BgNVBAYTAlVTMB4XDTE4MDUyMTEwNDUxMFoXDTQ5MTIzMTIzNTk1OVowaDEaMBgG
A1UEAwwRSW50ZWwgU0dYIFJvb3QgQ0ExGjAYBgNVBAoMEUludGVsIENvcnBvcmF0
aW9uMRQwEgYDVQQHDAtTYW50YSBDbGFyYTELMAkGA1UECAwCQ0ExCzAJBgNVBAYT
AlVTMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEC6nEwMDIYZOj/iPWsCzaEKi7
1OiOSLRFhWGjbnBVJfVnkY4u3IjkDYYL0MxO4mqsyYjlBalTVYxFP2sJBK5zlKOB
uzCBuDAfBgNVHSMEGDAWgBQiZQzWWp00ifODtJVSv1AbOScGrDBSBgNVHR8ESzBJ
MEegRaBDhkFodHRwczovL2NlcnRpZmljYXRlcy50cnVzdGVkc2VydmljZXMuaW50
ZWwuY29tL0ludGVsU0dYUm9vdENBLmRlcjAdBgNVHQ4EFgQUImUM1lqdNInzg7SV
Ur9QGzknBqwwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwCgYI
KoZIzj0EAwIDSQAwRgIhAOW/5QkR+S9CiSDcNoowLuPRLsWGf/Yi7GSX94BgwTwg
AiEA4J0lrHoMs+Xo5o/sX6O9QWxHRAvZUGOdRQ7cvqRXaqI=
-----END CERTIFICATE-----`;

/**
 * Intel Provisioning Certification Service (PCS) API base URL
 * For production attestation verification
 */
export const INTEL_PCS_API_URL = 'https://api.trustedservices.intel.com/sgx/certification/v4';

/**
 * Intel Root CA fingerprint for validation
 */
export const INTEL_SGX_ROOT_CA_FINGERPRINT = '8bd31eb1d63ce37382c0ffaa0d8200a3011ad6ff';

/**
 * TDX Quote Header constants
 */
export const TDX_QUOTE_HEADER_SIZE = 48;
export const TDX_TD_REPORT_SIZE = 584;

/**
 * Quote signature data structure offsets
 * After Header + TD Report, the signature data begins
 */
export const QUOTE_SIGNATURE_DATA_OFFSET = TDX_QUOTE_HEADER_SIZE + TDX_TD_REPORT_SIZE;

/**
 * Certification data types
 */
export enum CertDataType {
  /** PPID in encrypted form, concatenated with the RSA-OAEP-3072 encrypted PPID */
  PPID_ENCRYPTED_RSA3072 = 1,
  /** PPID in encrypted form, concatenated with RSA-OAEP-2048 encrypted PPID */
  PPID_ENCRYPTED_RSA2048 = 2,
  /** Concatenated PCK Cert Chain (PEM encoded) */
  PCK_CERT_CHAIN = 5,
  /** Platform manifest obtained from BIOS during provisioning */
  PLATFORM_MANIFEST = 6,
  /** QE Report Certification Data */
  QE_REPORT_CERT_DATA = 7,
}
