# TDX Remote Attestation Implementation TODO

## Overview
Implement TDX (Intel Trust Domain Extensions) remote attestation for the HUFI recording oracle, enabling the reputation oracle to cryptographically verify the recording oracle's integrity.

## Phase 1: Reproducible Build Infrastructure ⏳

### Task 1.1: Create TDX Dockerfile for Recording Oracle
- [x] Create `recording-oracle/Dockerfile.tdx`
- [x] Pin all dependency versions for reproducibility
- [x] Include TDX quote generator binary
- [ ] Test build reproducibility

### Task 1.2: TDX Quote Generator
- [x] Create `tdx_quote_gen.c` source code
- [x] Add to `recording-oracle/tdx-tools/`
- [x] Document build and usage

## Phase 2: GitHub Actions for Measurement ⏳

### Task 2.1: Create Measurement Workflow
- [x] Create `.github/workflows/tdx-measure-recording-oracle.yml`
- [x] Build Docker image deterministically
- [x] Compute simulated measurements (MRTD, RTMRs)
- [x] Store measurements as workflow artifacts
- [ ] Test workflow execution

### Task 2.2: Measurement Publication
- [x] Publish measurements to GitHub releases
- [x] Create measurement manifest JSON
- [ ] Add signature verification (optional)

## Phase 3: TDX Deployment ✅

### Task 3.1: TDX Attestation Module for Recording Oracle
- [x] Create `tdx-attestation.service.ts`
- [x] Create `tdx-attestation.controller.ts`
- [x] Create `tdx-attestation.module.ts`
- [x] Integrate into `app.module.ts`
- [x] Test endpoints:
  - [x] GET `/attestation/status`
  - [x] GET `/attestation/quote`
  - [x] POST `/attestation/quote` (with custom report_data)

### Task 3.2: TDX Deployment Scripts
- [x] Create `scripts/tdx/deploy-recording-oracle.sh`
- [x] Document deployment process

## Phase 4: Reputation Oracle Verification ⏳

### Task 4.1: TDX Quote Verification Module
- [x] Create `tdx-verification.service.ts`
- [x] Create `tdx-verification.controller.ts`
- [x] Create DTOs for verification requests
- [x] Integrate into reputation oracle `app.module.ts`
- [ ] Test verification endpoints

### Task 4.2: Verification Features
- [x] Parse TDX quote structure
- [x] Extract measurements (MRTD, RTMRs)
- [x] Compare against expected measurements
- [x] Challenge-response verification
- [ ] Intel certificate chain validation (future)

### Task 4.3: Verification API Endpoints
- [x] POST `/tdx-verification/verify-quote`
- [x] POST `/tdx-verification/verify-oracle`
- [x] GET `/tdx-verification/expected-measurements`
- [x] POST `/tdx-verification/update-measurements`
- [x] POST `/tdx-verification/set-measurements`

## Phase 5: Integration & Testing 🔜

### Task 5.1: End-to-End Testing
- [ ] Test build → measure → deploy → verify flow
- [ ] Test measurement mismatch detection
- [ ] Test challenge-response freshness
- [ ] Test error handling

### Task 5.2: Documentation
- [x] Create `docs/TDX_ATTESTATION_PLAN.md`
- [ ] Add deployment guide
- [ ] Add verification guide
- [ ] Add troubleshooting guide

## Current Status

### Recording Oracle (TDX Guest)
- **Status**: ✅ Running
- **Host**: ns3222044.ip-57-130-10.eu
- **Guest IP**: 192.168.122.97
- **Port**: 12000
- **TDX Device**: /dev/tdx_guest available
- **Attestation**: Working - generates valid TDX quotes

### Endpoints Available
```
Recording Oracle:
  GET  http://192.168.122.97:12000/attestation/status
  GET  http://192.168.122.97:12000/attestation/quote
  POST http://192.168.122.97:12000/attestation/quote

Reputation Oracle (after deployment):
  POST /tdx-verification/verify-quote
  POST /tdx-verification/verify-oracle
  GET  /tdx-verification/expected-measurements
  POST /tdx-verification/update-measurements
  POST /tdx-verification/set-measurements
```

## Environment Variables

### Recording Oracle
```env
# No additional TDX-specific env vars needed
# TDX quote generation uses /dev/tdx_guest device
```

### Reputation Oracle
```env
# Expected TDX measurements (from GitHub Actions)
TDX_EXPECTED_MRTD=<sha384-hash>
TDX_EXPECTED_RTMR0=<sha384-hash>
TDX_EXPECTED_RTMR1=<sha384-hash>
TDX_EXPECTED_RTMR2=<sha384-hash>
TDX_EXPECTED_RTMR3=<sha384-hash>
```

## Files Created/Modified

### New Files
- `docs/TDX_ATTESTATION_PLAN.md`
- `TODO_TDX_ATTESTATION.md` (this file)
- `.github/workflows/tdx-measure-recording-oracle.yml`
- `recording-oracle/Dockerfile.tdx`
- `recording-oracle/tdx-tools/tdx_quote_gen.c`
- `recording-oracle/tdx-tools/README.md`
- `recording-oracle/src/modules/tdx-attestation-module/`
- `reputation-oracle/src/modules/tdx-verification/`
- `scripts/tdx/deploy-recording-oracle.sh`

### Modified Files
- `recording-oracle/src/app.module.ts` - Added TdxAttestationModule
- `reputation-oracle/src/app.module.ts` - Added TdxVerificationModule

## Next Steps

1. **Test GitHub Action**: Push to trigger the measurement workflow
2. **Deploy Reputation Oracle**: Test TDX verification endpoints
3. **Integration Test**: Verify recording oracle from reputation oracle
4. **Production Hardening**: Add certificate chain validation
