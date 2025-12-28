# TDX Recording Oracle Ansible Deployment

Deploy the Recording Oracle in a TDX (Intel Trust Domain Extensions) virtual machine with remote attestation support.

## Prerequisites

### Hardware & BIOS
1. **TDX-capable Intel CPU** (4th Gen Xeon Scalable or newer)
2. **BIOS configured for TDX**:
   - Enable Memory Encryption (TME)
   - Enable TME-MT (Total Memory Encryption Multi-Tenant)
   - Enable Trust Domain Extension (TDX)
   - Enable SEAM Loader
   - Set TME-MT/TDX key split to non-zero value
   - Enable Software Guard Extensions (SGX)

### Intel PCCS API Key (Required for Attestation)

TDX attestation requires an Intel API key to fetch platform certificates:

1. Register at https://api.portal.trustedservices.intel.com/
2. Subscribe to "Intel Software Guard Extensions Provisioning Certification Service"
3. Copy your API key from the portal

Set the environment variable before running ansible:
```bash
export INTEL_PCCS_API_KEY="your-api-key-here"
```

For GitHub Actions, add `INTEL_PCCS_API_KEY` as a repository secret.

### On the TDX Host
The `qgs_host` role will install everything else automatically:
- TDX kernel (via Canonical's TDX setup)
- Docker and docker-compose
- libvirt/QEMU with TDX support
- QGS (Quote Generation Service)
- PCCS (Provisioning Certificate Caching Service)
- Intel attestation services

## Quick Start

### 1. Setup TDX Host (run once)

```bash
cd recording-oracle/ansible

# Set the Intel PCCS API key (required for attestation)
export INTEL_PCCS_API_KEY="your-api-key-here"

# Run the host setup role
ansible localhost -c local -m include_role -a name=qgs_host --become
```

**IMPORTANT**: After initial setup, you must **reboot** to boot into the TDX kernel:
```bash
sudo reboot
```

After reboot, verify TDX is working:
```bash
sudo dmesg | grep "tdx: module initialized"
# Should show: virt/tdx: module initialized
```

### 2. Deploy TDX VM

```bash
# Create inventory file
cat > /tmp/localhost-inventory.yml << 'EOF'
all:
  hosts:
    tdx_host:
      ansible_connection: local
      ansible_python_interpreter: /usr/bin/python3
EOF

# Deploy TDX VM
ansible-playbook -i /tmp/localhost-inventory.yml playbooks/deploy.yml

# Get measurements
ansible-playbook -i /tmp/localhost-inventory.yml playbooks/measure.yml

# Check status
ansible-playbook -i /tmp/localhost-inventory.yml playbooks/status.yml

# Destroy
ansible-playbook -i /tmp/localhost-inventory.yml playbooks/destroy.yml
```

## What the Host Setup Does

The `qgs_host` role performs a complete TDX host configuration:

1. **Clones Canonical TDX repo** from https://github.com/canonical/tdx
2. **Runs setup-tdx-host.sh** which:
   - Adds Canonical's TDX PPA
   - Installs TDX-enabled kernel (`linux-image-intel`)
   - Installs QGS and attestation services
   - Configures GRUB to boot TDX kernel
3. **Installs Docker** and docker-compose-v2
4. **Installs libvirt/QEMU** with TDX support
5. **Configures AppArmor** for QGS socket access
6. **Starts QGS daemon** (after reboot into TDX kernel)

## Architecture

```
TDX Host (linux-image-intel kernel)
├── QGS (Quote Generation Service) - listens on VSOCK
│
└── TDX VM (recording-oracle-tdx)
    ├── TDX Attestation Proxy (native, port 8081)
    │   └── Uses TSM configfs → QEMU → QGS for quote generation
    │
    └── Docker Compose Stack
        ├── postgres:15-alpine
        ├── minio
        └── recording-oracle (port 12000)
```

## Port Forwarding

| Host Port | VM Port | Service |
|-----------|---------|---------|
| 2222 | 22 | SSH |
| 12000 | 12000 | Recording Oracle |
| 8082 | 8081 | TDX Attestation Proxy |

## Endpoints

### TDX Attestation Proxy (port 8082)
- `GET /status` - Check TDX availability
- `GET /quote` - Generate TDX quote with default reportData
- `POST /quote` - Generate quote with custom `{"reportData": "<base64>"}`

### Recording Oracle (port 12000)
- `GET /` - API documentation
- `POST /attestation/quote` - Generate TDX quote via proxy
- `GET /attestation/status` - TDX status

## Configuration

Edit `group_vars/all.yml`:
```yaml
vm_name: recording-oracle-tdx
vm_memory_mb: 4096
vm_cpus: 2
recording_oracle_image: ghcr.io/posix4e/hufi/recording-oracle:latest
recording_oracle_port: 12000
```

## TDX Quote Generation

The proxy uses the Linux TSM (Trusted Security Module) configfs interface:

1. Creates `/sys/kernel/config/tsm/report/<uuid>/`
2. Writes 64-byte reportData to `inblob`
3. Kernel sends TDX VMCALL to QEMU
4. QEMU forwards to QGS via VSOCK
5. Full TDX Quote (~5KB) returned in `outblob`

## Troubleshooting

### TDX not initialized after reboot
```bash
# Check which kernel is running
uname -r
# Should be: 6.8.0-XXXX-intel

# Check TDX status
sudo dmesg | grep tdx
```

If not on intel kernel, check GRUB:
```bash
cat /etc/default/grub.d/99-tdx-kernel.cfg
sudo update-grub
sudo reboot
```

### QGS not running
```bash
systemctl status qgsd
journalctl -u qgsd -n 50
```

### Empty quotes (0 bytes)
1. Check PCCS has a valid API key:
   ```bash
   sudo journalctl -u pccs -n 20
   # Look for "401" errors - means API key is missing/invalid
   ```
2. Check QGS is running: `systemctl status qgsd`
3. Check QEMU logs: `tail /var/log/libvirt/qemu/recording-oracle-tdx.log`
4. Verify AppArmor allows access

### PCCS API key errors
If you see `Intel PCS server returns error(401)` in PCCS logs:
```bash
# Verify API key is configured
sudo grep ApiKey /opt/intel/sgx-dcap-pccs/config/default.json

# Re-run host setup with the API key
export INTEL_PCCS_API_KEY="your-api-key"
ansible localhost -c local -m include_role -a name=qgs_host --become

# Restart PCCS
sudo systemctl restart pccs
```

### Permission denied on QGS
The AppArmor configuration is handled automatically. If issues persist:
```bash
# Check if AppArmor rule exists
grep qgs /etc/apparmor.d/abstractions/libvirt-qemu
```

### SSH connection issues
```bash
ssh-keygen -R '[127.0.0.1]:2222'
sshpass -p oracle123 ssh -p 2222 -o StrictHostKeyChecking=no oracle@127.0.0.1
```
