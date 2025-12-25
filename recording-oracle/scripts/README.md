# Recording Oracle Scripts

Scripts for TDX attestation, VM provisioning, and measurement handling.

## Quick Start

### 1. Provision a TDX VM (one-time setup)

Use cloud-init to create a reproducible TDX VM:

```bash
./provision-tdx-vm.sh --name recording-oracle-tdx
```

### 2. Get TDX Measurements

```bash
export TDX_GUEST_PASSWORD="your-password"
./deploy-to-tdx.sh measure
```

## VM Provisioning

### provision-tdx-vm.sh

Creates a fresh TDX VM from scratch using cloud-init. This ensures reproducible deployments.

```bash
# Create a TDX VM with default settings
./provision-tdx-vm.sh

# Create with custom resources
./provision-tdx-vm.sh --memory 8192 --cpus 4 --disk 50

# Dry run to see what would be created
./provision-tdx-vm.sh --dry-run
```

**Options:**
- `--name NAME` - VM name (default: recording-oracle-tdx)
- `--memory SIZE` - Memory in MB (default: 4096)
- `--cpus COUNT` - Number of CPUs (default: 2)
- `--disk SIZE` - Disk size in GB (default: 20)
- `--ssh-key FILE` - SSH public key file
- `--recording-oracle-image IMAGE` - Docker image for recording oracle
- `--dry-run` - Show what would be done without executing

### tdx-vm-cloud-init.yaml

Cloud-init configuration template that sets up:
- TDX attestation proxy service (port 8081)
- TDX quote generator compilation
- Recording oracle systemd service
- Docker Compose for full stack deployment

## Measurement & Status

### deploy-to-tdx.sh

Get TDX measurements and status from a running TDX VM.

```bash
# Required environment variables
export TDX_GUEST_PASSWORD="your-password"

# Optional (with defaults)
export TDX_HOST="ns3222044.ip-57-130-10.eu"
export TDX_HOST_SSH_KEY="~/.ssh/tdx_host_key"
export TDX_GUEST_SSH_PORT="44451"
export TDX_GUEST_USER="tdx"
export RECORDING_ORACLE_PORT="12000"

# Commands:
./deploy-to-tdx.sh measure   # Get TDX measurements (default)
./deploy-to-tdx.sh status    # Show status of TDX and recording oracle
./deploy-to-tdx.sh quote     # Generate a test TDX quote (raw JSON)
./deploy-to-tdx.sh help      # Show help
```

The `measure` command outputs TDX measurements as `KEY=VALUE` pairs to stdout (for GitHub Actions).

## Measurement Scripts

### extract-tdx-measurements.py

Extract TDX measurements (MRTD, RTMRs) from a TDX quote.

```bash
# From base64 quote string
python3 extract-tdx-measurements.py "BASE64_QUOTE"

# From stdin
curl http://oracle:12000/attestation/quote | jq -r '.quote' | python3 extract-tdx-measurements.py -

# JSON output
python3 extract-tdx-measurements.py --json "BASE64_QUOTE"
```

### create-measurement-manifest.sh

Create a JSON manifest with TDX measurements and build info.

```bash
# Set required environment variables
export MRTD="..." RTMR0="..." RTMR1="..." RTMR2="..." RTMR3="..."
export GIT_SHA="abc123" IMAGE_DIGEST="sha256:..."

# Optional
export GIT_REF="refs/heads/main"
export NODE_VERSION="20" UBUNTU_VERSION="22.04"
export REGISTRY="ghcr.io" IMAGE_NAME="org/repo"

# Generate manifest
./create-measurement-manifest.sh > measurements.json
```

### create-reproduce-md.sh

Generate reproduction instructions from a measurements.json file.

```bash
./create-reproduce-md.sh measurements.json > REPRODUCE.md
```

## GitHub Action Usage

The workflow `.github/workflows/tdx-measure-recording-oracle.yml` uses these scripts:

1. `deploy-to-tdx.sh measure` - Gets TDX measurements from running oracle
2. `deploy-to-tdx.sh status` - Verifies TDX attestation is available
3. `create-measurement-manifest.sh` - Creates measurements.json artifact
4. `create-reproduce-md.sh` - Creates REPRODUCE.md artifact

## Related

- `reputation-oracle/scripts/set-tdx-measurements.sh` - Set build-time env vars from measurements.json

## Architecture

### TDX Attestation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      TDX VM                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Recording Oracle Container              │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  TDX Attestation Service                     │   │   │
│  │  │  - /attestation/status                       │   │   │
│  │  │  - /attestation/quote                        │   │   │
│  │  └──────────────────┬──────────────────────────┘   │   │
│  └─────────────────────┼───────────────────────────────┘   │
│                        │ HTTP (via proxy)                   │
│  ┌─────────────────────▼───────────────────────────────┐   │
│  │         TDX Attestation Proxy (port 8081)           │   │
│  │  - Runs on host, has access to /dev/tdx_guest       │   │
│  │  - Generates TDX quotes on behalf of containers     │   │
│  └─────────────────────┬───────────────────────────────┘   │
│                        │                                    │
│  ┌─────────────────────▼───────────────────────────────┐   │
│  │              /dev/tdx_guest                          │   │
│  │  - TDX device for attestation                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Why a Proxy?

Docker containers cannot directly access `/dev/tdx_guest` due to:
1. Device isolation in container namespaces
2. TDX attestation requires specific kernel capabilities
3. The TDX device is tied to the VM's trust domain, not individual containers

The proxy runs on the VM host and provides TDX quotes to containers via HTTP.

## Troubleshooting

### TDX Device Not Found

If `/dev/tdx_guest` doesn't exist:
- Ensure the host has TDX-enabled hardware
- Check that TDX is enabled in BIOS
- Verify the TDX kernel module is loaded: `lsmod | grep tdx`

### Quote Generation Fails

If TDX quotes fail to generate:
- Check the attestation proxy is running: `systemctl status tdx-attestation-proxy`
- Verify the quote generator is compiled: `ls -la /opt/recording-oracle/tdx_quote_gen`
- Check TDX device permissions: `ls -la /dev/tdx_guest`

### Container Can't Reach Proxy

If the container can't reach the attestation proxy:
- Ensure `TDX_ATTESTATION_PROXY_URL=http://host.docker.internal:8081` is set
- Check the proxy is listening: `curl http://localhost:8081/status`
- Verify firewall rules allow localhost connections
