/**
 * TDX measurements baked in at build time.
 * These values are set via environment variables during the build process.
 */
export const TDX_MEASUREMENTS = {
  mrtd: process.env.TDX_EXPECTED_MRTD || '',
  rtmr0: process.env.TDX_EXPECTED_RTMR0 || '',
  rtmr1: process.env.TDX_EXPECTED_RTMR1 || '',
  rtmr2: process.env.TDX_EXPECTED_RTMR2 || '',
  rtmr3: process.env.TDX_EXPECTED_RTMR3 || '',
};

export const TDX_BUILD_INFO = {
  gitSha: process.env.TDX_BUILD_GIT_SHA || '',
  imageDigest: process.env.TDX_BUILD_IMAGE_DIGEST || '',
  timestamp: process.env.TDX_BUILD_TIMESTAMP || '',
};

export function hasMeasurements(): boolean {
  return !!TDX_MEASUREMENTS.mrtd;
}
