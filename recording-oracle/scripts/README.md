# Recording Oracle Scripts

Scripts for TDX attestation, VM provisioning, and measurement handling.

## Quick Start

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
