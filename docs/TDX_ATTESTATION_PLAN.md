# TDX Remote Attestation Implementation Plan

This document outlines the implementation of TDX (Intel Trust Domain Extensions) remote attestation for the HUFI recording oracle, enabling cryptographic verification of the oracle's integrity.

## Overview

The goal is to:
1. Create reproducible builds of the recording oracle that produce deterministic TDX measurements
2. Automate measurement extraction via GitHub Actions using real TDX hardware
3. Enable the reputation oracle to verify TDX attestation quotes from the recording oracle

## Architecture

```
GitHub Actions                    TDX Host (ns3222044.ip-57-130-10.eu)
┌─────────────────┐              ┌─────────────────────────────────────┐
│ 1. Build Docker │              │  TDX VM (QEMU/KVM with launchSecurity)
│    Image        │              │  ┌─────────────────────────────────┐│
│                 │              │  │ TDX Attestation Proxy (native)  ││
│ 2. Push to GHCR │──Ansible────▶│  │ Port 8082: /status, /quote      ││
│                 │              │  │ Reads /dev/tdx_guest            ││
│ 3. Deploy VM    │              │  ├─────────────────────────────────┤│
│    via Ansible  │              │  │ Docker Compose Stack            ││
│                 │              │  │ - postgres:5432                 ││
│ 4. Get TDX      │◀─────────────│  │ - minio:9000                    ││
│    Measurements │              │  │ - recording-oracle:12000        ││
│                 │              │  └─────────────────────────────────┘│
│ 5. Publish to   │              │  Port forwards: 2222→22, 12000, 8082→8081│
│    GitHub       │              └─────────────────────────────────────┘
└─────────────────┘
        │
        │ Measurements JSON
        ▼
┌─────────────────┐
│ Reputation      │
│ Oracle          │
│                 │
│ Verify TDX      │
│ quotes against  │
│ expected values │
└─────────────────┘
```

## GitHub Actions Workflow

The workflow (`tdx-measure-recording-oracle.yml`) performs:

1. **Build**: Creates Docker image with pinned dependencies
2. **Push**: Uploads to `ghcr.io/posix4e/hufi/recording-oracle:sha-<commit>`
3. **Deploy**: SSHs to TDX host, runs Ansible playbooks
4. **Measure**: Extracts TDX measurements from attestation proxy
5. **Publish**: Creates GitHub release with measurements

### Required Secrets

| Secret Name | Description |
|-------------|-------------|
| `TDX_HOST_SSH_KEY` | SSH private key for TDX host |

### Workflow Triggers

- Push to `main` or `tdx-remote-attestation` branch (when recording-oracle files change)
- Manual dispatch with `publish_release` option

## Ansible Deployment

### Playbooks

| Playbook | Purpose |
|----------|---------|
| `deploy.yml` | Full deployment (destroy + provision + wait) |
| `destroy.yml` | Remove existing VM |
| `measure.yml` | Extract TDX measurements |
| `status.yml` | Check VM and service status |
| `build-tdx-image.yml` | Build TDX guest base image |

### Usage

```bash
cd recording-oracle/ansible

# Deploy fresh VM
ansible-playbook -i inventory/hosts.yml playbooks/deploy.yml \
  -e "recording_oracle_image=ghcr.io/posix4e/hufi/recording-oracle:sha-abc123"

# Get measurements
ansible-playbook -i inventory/hosts.yml playbooks/measure.yml

# Check status
ansible-playbook -i inventory/hosts.yml playbooks/status.yml

# Destroy VM
ansible-playbook -i inventory/hosts.yml playbooks/destroy.yml
```

## TDX VM Configuration

### Cloud-Init Components

The VM is configured via cloud-init with:

1. **TDX Attestation Proxy** (runs natively, not containerized)
   - Python HTTP server on port 8081
   - Uses Linux configfs TSM (`/sys/kernel/config/tsm/report/`) for quote generation
   - Endpoints: `/status`, `/quote`

2. **Docker Compose Stack**
   - PostgreSQL 15
   - MinIO (S3-compatible storage)
   - Recording Oracle application

3. **Systemd Services**
   - `tdx-attestation-proxy.service` - TDX proxy
   - `recording-oracle.service` - Docker compose stack

### Port Forwarding (SLIRP)

| Host Port | Guest Port | Service |
|-----------|------------|---------|
| 2222 | 22 | SSH |
| 12000 | 12000 | Recording Oracle |
| 8082 | 8081 | TDX Attestation Proxy |

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

## API Endpoints

### TDX Attestation Proxy (Port 8082)

```
GET /status
Response: {
  "available": true,
  "device": "/dev/tdx_guest",
  "tsm_path": "/sys/kernel/config/tsm/report",
  "tsm_available": true
}

GET /quote
Response: {
  "quote": "<base64-encoded-quote>",
  "quote_size": 1234,
  "report_data": "<base64-encoded-report-data>",
  "measurements": {
    "mrtd": "<hex>",
    "rtmr0": "<hex>",
    "rtmr1": "<hex>",
    "rtmr2": "<hex>",
    "rtmr3": "<hex>"
  }
}
```

### Reputation Oracle Verification

```
POST /tdx-verification/verify-quote
Body: { "quote": "<base64>" }

POST /tdx-verification/verify-oracle
Body: { "oracle_url": "http://..." }

GET /tdx-verification/expected-measurements

POST /tdx-verification/set-measurements
Body: { "mrtd": "...", "rtmr0": "...", ... }
```

## Security Considerations

1. **Measurement Integrity**: Measurements computed on real TDX hardware
2. **Reproducible Builds**: Docker images tagged with git SHA
3. **Freshness**: Include nonces in report_data to prevent replay attacks
4. **Certificate Validation**: Future: validate Intel certificate chain

## Environment Variables

### Recording Oracle (.env in VM)
```env
JWT_PRIVATE_KEY=<EC private key with escaped newlines>
JWT_PUBLIC_KEY=<EC public key with escaped newlines>
AES_ENCRYPTION_KEY=<32-character key>
WEB3_PRIVATE_KEY=<ethereum private key>
RPC_URL_POLYGON_AMOY=<RPC URL>
```

### Reputation Oracle
```env
TDX_EXPECTED_MRTD=<sha384-hash>
TDX_EXPECTED_RTMR0=<sha384-hash>
TDX_EXPECTED_RTMR1=<sha384-hash>
TDX_EXPECTED_RTMR2=<sha384-hash>
TDX_EXPECTED_RTMR3=<sha384-hash>
```

## References

- [Intel TDX Documentation](https://www.intel.com/content/www/us/en/developer/tools/trust-domain-extensions/documentation.html)
- [TDX Quote Verification](https://github.com/intel/SGXDataCenterAttestationPrimitives)
- [Canonical TDX](https://github.com/canonical/tdx)
