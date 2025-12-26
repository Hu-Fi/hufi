# Recording Oracle Scripts

Scripts for TDX attestation, VM provisioning, and measurement handling.

## Quick Start

### 1. Deploy a fresh TDX VM (destroys existing, provisions new)

```bash
export TDX_GUEST_PASSWORD="your-password"
./tdx.py deploy --name recording-oracle-tdx
```

### 2. Get TDX Measurements

```bash
./tdx.py measure
```

## Unified TDX Tool

All TDX operations are handled by a single Python script: `tdx.py`

```bash
# Measurement commands
./tdx.py measure              # Get TDX measurements from running oracle
./tdx.py status               # Show status of TDX and recording oracle
./tdx.py quote                # Generate a test TDX quote (raw JSON)
./tdx.py extract-measurements # Extract measurements from base64 quote
./tdx.py manifest             # Create measurement manifest JSON
./tdx.py reproduce FILE       # Generate reproduction instructions

# VM lifecycle commands (run on TDX host via SSH)
./tdx.py destroy              # Destroy existing TDX VM
./tdx.py provision            # Provision a new TDX VM using cloud-init
./tdx.py wait-ready           # Wait for TDX VM to be ready
./tdx.py deploy               # Full cycle: destroy + provision + wait
```

### Environment Variables

```bash
export TDX_HOST="ns3222044.ip-57-130-10.eu"
export TDX_HOST_SSH_KEY="~/.ssh/tdx_host_key"
export TDX_GUEST_SSH_PORT="44451"
export TDX_GUEST_USER="tdx"
export TDX_GUEST_PASSWORD="your-password"  # Required
export RECORDING_ORACLE_PORT="12000"
```

### Deploy Options (Full VM Lifecycle)

```bash
./tdx.py deploy --name NAME                 # VM name (default: recording-oracle-tdx)
./tdx.py deploy --memory 8192               # Memory in MB (default: 4096)
./tdx.py deploy --cpus 4                    # Number of CPUs (default: 2)
./tdx.py deploy --disk 50                   # Disk size in GB (default: 20)
./tdx.py deploy --timeout 600               # Timeout for VM to be ready (default: 600s)
./tdx.py deploy --recording-oracle-image IMG # Docker image for recording oracle
```

### Provisioning Options (VM Creation Only)

```bash
./tdx.py provision --name NAME              # VM name (default: recording-oracle-tdx)
./tdx.py provision --memory 8192            # Memory in MB (default: 4096)
./tdx.py provision --cpus 4                 # Number of CPUs (default: 2)
./tdx.py provision --disk 50                # Disk size in GB (default: 20)
./tdx.py provision --dry-run                # Show what would be done
```

## TDX VM Components

The following components are deployed to the TDX VM via cloud-init (embedded in `ansible/roles/tdx_vm/templates/user-data.yml.j2`):

- `tdx-attestation-proxy.py` - HTTP proxy for TDX attestation (port 8081 in guest, 8082 on host)
  - Uses Linux configfs TSM interface (`/sys/kernel/config/tsm/report/`) for quote generation
- `tdx-attestation-proxy.service` - Systemd service for proxy
- `recording-oracle.service` - Systemd service for recording oracle
- `docker-compose.yml` - Full stack deployment (postgres, minio, oracle)

## GitHub Action Usage

The workflow `.github/workflows/tdx-measure-recording-oracle.yml` uses:

```bash
./tdx.py measure   # Gets TDX measurements from running oracle
./tdx.py status    # Verifies TDX attestation is available
./tdx.py manifest  # Creates measurements.json artifact
./tdx.py reproduce measurements.json  # Creates REPRODUCE.md artifact
```

## Architecture

### TDX Attestation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      TDX VM                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Recording Oracle Container              │   │
│  │  - Runs the recording oracle application             │   │
│  │  - Connects to attestation proxy for TDX quotes      │   │
│  └─────────────────────┬───────────────────────────────┘   │
│                        │ HTTP                               │
│  ┌─────────────────────▼───────────────────────────────┐   │
│  │         TDX Attestation Proxy (port 8082)           │   │
│  │  - Runs on VM host                                   │   │
│  │  - Uses configfs TSM for quote generation            │   │
│  │  - Generates TDX quotes on behalf of containers     │   │
│  └─────────────────────┬───────────────────────────────┘   │
│                        │                                    │
│  ┌─────────────────────▼───────────────────────────────┐   │
│  │     /sys/kernel/config/tsm/report/ (configfs TSM)    │   │
│  │  - Linux kernel interface for TDX attestation        │   │
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

### TDX Not Available

If TDX is not available:
- Ensure the host has TDX-enabled hardware
- Check that TDX is enabled in BIOS
- Verify the TDX kernel module is loaded: `lsmod | grep tdx`
- Check if configfs TSM is available: `ls /sys/kernel/config/tsm/report/`

### Quote Generation Fails

If TDX quotes fail to generate:
- Check the attestation proxy is running: `systemctl status tdx-attestation-proxy`
- Verify configfs TSM is mounted: `mount | grep configfs`
- Check proxy logs: `journalctl -u tdx-attestation-proxy`
- Test the status endpoint: `curl http://localhost:8081/status`

### Container Can't Reach Proxy

If the container can't reach the attestation proxy:
- Ensure `TDX_ATTESTATION_PROXY_URL=http://host.docker.internal:8081` is set (inside VM)
- Check the proxy is listening from host: `curl http://localhost:8082/status`
- Verify firewall rules allow localhost connections
