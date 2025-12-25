# TDX Remote Attestation Implementation Plan

This document outlines the plan to implement TDX (Intel Trust Domain Extensions) remote attestation for the HUFI recording oracle, enabling cryptographic verification of the oracle's integrity.

## Overview

The goal is to:
1. Create reproducible builds of the recording oracle that produce deterministic TDX measurements
2. Automate measurement computation via GitHub Actions using real TDX hardware
3. Enable the reputation oracle to verify TDX attestation quotes from the recording oracle

## GitHub Actions Setup

The GitHub Action workflow (`tdx-measure-recording-oracle.yml`) SSHs into a real TDX host to deploy and measure the recording oracle.

### Required Secrets

Configure these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Description |
|-------------|-------------|
| `TDX_HOST_SSH_KEY` | SSH private key for accessing the TDX host server (ubuntu@ns3222044.ip-57-130-10.eu) |
| `TDX_GUEST_PASSWORD` | Password for the TDX guest VM user (default: `123456`) |

### TDX Host Configuration

The workflow uses these environment variables (can be modified in the workflow file):

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `TDX_HOST` | `ns3222044.ip-57-130-10.eu` | TDX host server hostname |
| `TDX_GUEST_SSH_PORT` | `44451` | SSH port forwarded to TDX guest |
| `TDX_GUEST_USER` | `tdx` | Username in TDX guest VM |
| `RECORDING_ORACLE_PORT` | `12000` | Port the recording oracle listens on |

### Workflow Triggers

The workflow runs:
- On push to `main` branch (when recording-oracle files change)
- On pull requests to `main` branch
- Manually via workflow_dispatch with options:
  - `publish_release`: Create a GitHub release with measurements
  - `deploy_to_tdx`: Deploy and measure on TDX hardware (default: true)

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   GitHub Actions    │     │   TDX Host Server   │
│                     │     │                     │
│  ┌───────────────┐  │     │  ┌───────────────┐  │
│  │ Build Oracle  │  │     │  │   TDX Guest   │  │
│  │ Compute MRTD  │──┼────▶│  │               │  │
│  │ Publish Hash  │  │     │  │ Recording     │  │
│  └───────────────┘  │     │  │ Oracle        │  │
│                     │     │  │               │  │
└─────────────────────┘     │  │ /attestation  │  │
                            │  │   /quote      │  │
                            │  └───────┬───────┘  │
                            └──────────┼──────────┘
                                       │
                                       │ TDX Quote
                                       ▼
                            ┌─────────────────────┐
                            │  Reputation Oracle  │
                            │                     │
                            │  ┌───────────────┐  │
                            │  │ Verify Quote  │  │
                            │  │ Check MRTD    │  │
                            │  │ Validate Cert │  │
                            │  └───────────────┘  │
                            └─────────────────────┘
```

## Tasks

### Phase 1: Reproducible Build Infrastructure

- [ ] **Task 1.1**: Create Dockerfile for recording oracle
  - Pin all dependency versions
  - Use multi-stage build for minimal runtime image
  - Include TDX quote generator binary

- [ ] **Task 1.2**: Create build script for TDX VM image
  - Generate QCOW2 image with recording oracle
  - Compute expected MRTD (Measurement of TD) values
  - Output measurement manifest

### Phase 2: GitHub Actions for Measurement

- [ ] **Task 2.1**: Create measurement workflow
  - Build Docker image deterministically
  - Use QEMU/TDX simulation to compute measurements
  - Store measurements as workflow artifacts

- [ ] **Task 2.2**: Create measurement publication
  - Publish measurements to GitHub releases
  - Sign measurements with repository key
  - Create attestation bundle

### Phase 3: TDX Deployment

- [ ] **Task 3.1**: Create TDX VM launcher script
  - Launch recording oracle in TDX guest
  - Configure networking and ports
  - Health check and monitoring

- [ ] **Task 3.2**: Integrate attestation endpoint
  - Expose /attestation/quote endpoint
  - Expose /attestation/status endpoint
  - Include service metadata in report_data

### Phase 4: Reputation Oracle Verification

- [ ] **Task 4.1**: Add TDX quote verification module
  - Parse TDX quote structure
  - Verify Intel SGX/TDX certificate chain
  - Extract and validate measurements

- [ ] **Task 4.2**: Implement measurement policy
  - Load expected measurements from config/GitHub
  - Compare quote measurements against expected
  - Handle measurement updates/rotations

- [ ] **Task 4.3**: Add verification API
  - POST /verify-attestation endpoint
  - Automatic periodic verification
  - Alert on verification failures

### Phase 5: Integration & Testing

- [ ] **Task 5.1**: End-to-end testing
  - Test build → measure → deploy → verify flow
  - Test measurement mismatch detection
  - Test certificate chain validation

- [ ] **Task 5.2**: Documentation
  - Deployment guide
  - Verification guide
  - Troubleshooting guide

## TDX Measurement Details

### MRTD (Measurement of TD)
- Hash of initial TD memory contents
- Includes kernel, initrd, and command line
- Computed during TD creation

### RTMR (Runtime Measurement Registers)
- RTMR[0]: Firmware measurements
- RTMR[1]: OS/kernel measurements
- RTMR[2]: Application measurements
- RTMR[3]: Reserved for future use

### Quote Structure
```
TDX Quote v4:
├── Header (48 bytes)
├── TD Report (584 bytes)
│   ├── TEE_TCB_SVN
│   ├── MRSEAM
│   ├── MRSIGNERSEAM
│   ├── SEAM_ATTRIBUTES
│   ├── TD_ATTRIBUTES
│   ├── XFAM
│   ├── MRTD (48 bytes) ← Primary measurement
│   ├── MRCONFIGID
│   ├── MROWNER
│   ├── MROWNERCONFIG
│   ├── RTMR[0-3] (4 × 48 bytes)
│   └── REPORT_DATA (64 bytes) ← Custom data
├── Signature (varies)
└── Certification Data (varies)
```

## Security Considerations

1. **Measurement Integrity**: Measurements must be computed in a trusted environment (GitHub Actions with attestation)
2. **Certificate Validation**: Always validate the full Intel certificate chain
3. **Freshness**: Include timestamps or nonces in report_data to prevent replay attacks
4. **Key Management**: Secure storage of expected measurements and signing keys

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1 | 2-3 days | None |
| Phase 2 | 2-3 days | Phase 1 |
| Phase 3 | 1-2 days | Phase 1 |
| Phase 4 | 3-4 days | Phase 2, 3 |
| Phase 5 | 2-3 days | Phase 4 |

## References

- [Intel TDX Documentation](https://www.intel.com/content/www/us/en/developer/tools/trust-domain-extensions/documentation.html)
- [TDX Quote Verification](https://github.com/intel/SGXDataCenterAttestationPrimitives)
- [DCAP (Data Center Attestation Primitives)](https://github.com/intel/SGXDataCenterAttestationPrimitives)
