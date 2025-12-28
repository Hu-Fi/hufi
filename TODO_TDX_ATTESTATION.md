# TDX Remote Attestation Implementation TODO

## Overview
Implement TDX (Intel Trust Domain Extensions) remote attestation for the HUFI recording oracle, enabling the reputation oracle to cryptographically verify the recording oracle's integrity.

## Phase 1: Reproducible Build Infrastructure ✅

### Task 1.1: Create TDX Dockerfile for Recording Oracle
- [x] Create `recording-oracle/Dockerfile`
- [x] Pin all dependency versions for reproducibility
- [x] Test build reproducibility via GitHub Actions

### Task 1.2: Docker Image Registry
- [x] Push images to ghcr.io/posix4e/hufi/recording-oracle
- [x] Tag with git SHA for reproducibility

## Phase 2: GitHub Actions for Measurement ✅

### Task 2.1: Create Measurement Workflow
- [x] Create `.github/workflows/tdx-measure-recording-oracle.yml`
- [x] Build Docker image deterministically
- [x] Deploy to real TDX hardware via Ansible
- [x] Extract measurements from TDX attestation proxy
- [x] Store measurements as workflow artifacts

### Task 2.2: Measurement Publication
- [x] Publish measurements to GitHub releases
- [x] Create measurement manifest JSON with git SHA and image tag
- [x] Add GitHub Artifact Attestations for Docker image and measurements.json

## Phase 3: TDX Deployment ✅

### Task 3.1: Ansible Deployment Infrastructure
- [x] Create `recording-oracle/ansible/` structure
- [x] Create playbooks:
  - [x] `playbooks/deploy.yml` - Full deployment
  - [x] `playbooks/destroy.yml` - Cleanup
  - [x] `playbooks/measure.yml` - Get TDX measurements
  - [x] `playbooks/status.yml` - Check status
  - [x] `playbooks/build-tdx-image.yml` - Build TDX guest image
- [x] Create roles:
  - [x] `roles/tdx_vm/` - TDX VM provisioning
  - [x] `roles/tdx_attestation/` - TDX measurement extraction

### Task 3.2: TDX VM Configuration
- [x] Cloud-init template with:
  - [x] TDX attestation proxy (Python, runs natively on port 8081)
  - [x] Docker-compose stack (postgres, minio, recording-oracle)
  - [x] Systemd services for auto-start
- [x] QEMU/KVM with TDX launchSecurity
- [x] SLIRP networking with port forwarding

### Task 3.3: TDX Attestation Proxy
- [x] HTTP proxy on port 8081 (runs natively in VM, not containerized)
- [x] Uses TSM configfs interface for full TDX Quote generation (5006 bytes)
- [x] Endpoints:
  - [x] GET `/status` - TDX availability and device info
  - [x] GET `/quote` - Generate full TDX quote with measurements
  - [x] POST `/quote` - Generate quote with custom reportData

### Task 3.4: QGS Integration
- [x] Configure libvirt VM with quoteGenerationService (unix socket)
- [x] Fix AppArmor to allow QEMU access to QGS socket
- [x] Disable AppArmor security label for TDX VMs (`seclabel type='none'`)
- [x] Ensure QGS permissions: `/var/run/tdx-qgs/` accessible to libvirt

## Phase 4: Reputation Oracle Verification ✅

### Task 4.1: TDX Quote Verification Module
- [x] Create `tdx-verification.service.ts`
- [x] Create `tdx-verification.controller.ts`
- [x] Create DTOs for verification requests
- [x] Integrate into reputation oracle `app.module.ts`
- [x] Test verification endpoints
- [x] Create E2E tests (`reputation-oracle/test/tdx-verification.e2e-spec.ts`)
- [x] Create manual test script (`scripts/tdx/test-tdx-verification.sh`)

### Task 4.2: Verification Features
- [x] Parse TDX quote structure
- [x] Extract measurements (MRTD, RTMRs)
- [x] Compare against expected measurements
- [x] Challenge-response verification
- [x] Intel certificate chain validation (`intel-dcap.service.ts`)
  - [x] Parse quote signature and certification data
  - [x] Verify certificate chain against Intel Root CA
  - [x] Verify quote signature (ECDSA P-256)
  - [x] Fetch TCB info from Intel PCS API
  - [x] New endpoints: POST `/verify-quote-dcap`, POST `/verify-oracle-dcap`

### Task 4.3: Verification API Endpoints
- [x] POST `/tdx-verification/verify-quote`
- [x] POST `/tdx-verification/verify-oracle`
- [x] GET `/tdx-verification/expected-measurements`
- [x] POST `/tdx-verification/update-measurements`
- [x] POST `/tdx-verification/set-measurements`

## Phase 5: Integration & Testing ✅

### Task 5.1: End-to-End Testing
- [x] Test build → measure → deploy → verify flow
- [x] Test measurement mismatch detection
- [x] Test challenge-response freshness
- [x] Test error handling
- [x] E2E test file: `reputation-oracle/test/tdx-verification.e2e-spec.ts`

### Task 5.2: Documentation
- [x] Create `docs/TDX_ATTESTATION_PLAN.md`
- [x] Create `recording-oracle/ansible/README.md`
- [x] Add verification test script with usage guide

### Task 5.3: Recording Oracle Attestation Endpoint
- [x] Create attestation module (`recording-oracle/src/modules/attestation/`)
- [x] POST `/attestation/quote` - Generate TDX quote with challenge data
- [x] GET `/attestation/status` - TDX availability status

## Current Status

### Architecture
```
GitHub Actions                    TDX Host (ns3222044.ip-57-130-10.eu)
┌─────────────────┐              ┌─────────────────────────────────────┐
│ Build & Push    │              │  TDX VM (QEMU/KVM with launchSecurity)
│ Docker Image    │──Ansible────▶│  ┌─────────────────────────────────┐│
│                 │              │  │ TDX Attestation Proxy (native)  ││
│ Deploy via      │              │  │ Port 8082: /status, /quote      ││
│ Ansible         │              │  │ Access to /dev/tdx_guest        ││
│                 │              │  ├─────────────────────────────────┤│
│ Get Measurements│◀─────────────│  │ Docker Compose Stack            ││
│ from port 8082  │              │  │ - postgres:5432                 ││
└─────────────────┘              │  │ - minio:9000                    ││
                                 │  │ - recording-oracle:12000        ││
                                 │  └─────────────────────────────────┘│
                                 │  Port forwards: 2222→22, 12000, 8082→8081│
                                 └─────────────────────────────────────┘
```

### Key Files
```
recording-oracle/ansible/
├── playbooks/
│   ├── deploy.yml          # Full deployment
│   ├── destroy.yml         # Cleanup VM
│   ├── measure.yml         # Get TDX measurements
│   ├── status.yml          # Check status
│   └── build-tdx-image.yml # Build TDX guest image
├── roles/
│   ├── tdx_vm/
│   │   ├── tasks/
│   │   │   ├── main.yml
│   │   │   ├── provision.yml
│   │   │   ├── find_base_image.yml
│   │   │   ├── wait.yml
│   │   │   └── destroy.yml
│   │   └── templates/
│   │       ├── user-data.yml.j2  # Cloud-init (TDX proxy + docker-compose)
│   │       ├── meta-data.yml.j2
│   │       ├── network-config.yml.j2
│   │       └── vm.xml.j2         # Libvirt XML with TDX launchSecurity
│   └── tdx_attestation/
│       └── tasks/
│           ├── main.yml
│           ├── status.yml
│           └── measure.yml
└── group_vars/all.yml
```

### Endpoints
```
TDX Attestation Proxy (port 8082 on host, 8081 in VM):
  GET  http://127.0.0.1:8082/status  - TDX availability
  GET  http://127.0.0.1:8082/quote   - Generate TDX quote

Recording Oracle (port 12000, in docker):
  GET  http://127.0.0.1:12000/       - API (redirects to /swagger)
  GET  /attestation/status           - TDX attestation status
  POST /attestation/quote            - Generate TDX quote with challenge

Reputation Oracle (after deployment):
  POST /tdx-verification/verify-quote       - Verify TDX quote (measurements only)
  POST /tdx-verification/verify-oracle      - Verify recording oracle
  GET  /tdx-verification/expected-measurements
  GET  /tdx-verification/build-info
  POST /tdx-verification/verify-quote-dcap  - Verify with Intel DCAP cert chain
  POST /tdx-verification/verify-oracle-dcap - Verify oracle with Intel DCAP
```

## Environment Variables

### Recording Oracle (in docker-compose via .env)
```env
JWT_PRIVATE_KEY=<EC private key>
JWT_PUBLIC_KEY=<EC public key>
AES_ENCRYPTION_KEY=<32-char key>
WEB3_PRIVATE_KEY=<ethereum private key>
RPC_URL_POLYGON_AMOY=<RPC URL>
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

## Completed

All phases are now complete:

1. ✅ **Phase 1**: Reproducible Build Infrastructure
2. ✅ **Phase 2**: GitHub Actions for Measurement
3. ✅ **Phase 3**: TDX Deployment
4. ✅ **Phase 4**: Reputation Oracle Verification
5. ✅ **Phase 5**: Integration & Testing

## Recent Additions

- **Recording Oracle Attestation Endpoint**: `POST /attestation/quote` for generating TDX quotes
- **Intel DCAP Service**: `intel-dcap.service.ts` for certificate chain validation
- **DCAP Verification Endpoints**: `verify-quote-dcap` and `verify-oracle-dcap`
- **E2E Tests**: `reputation-oracle/test/tdx-verification.e2e-spec.ts`
- **Manual Test Script**: `scripts/tdx/test-tdx-verification.sh`

## Next Steps (Optional Enhancements)

1. **Deploy and Test**: Deploy updates and run E2E tests against live TDX infrastructure
2. **TCB Enforcement**: Add policy for minimum acceptable TCB status
3. **Caching**: Cache Intel PCS API responses to reduce latency
4. **Monitoring**: Add metrics for attestation verification success/failure rates
