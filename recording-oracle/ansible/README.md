# TDX Recording Oracle Ansible Deployment

Deploy the Recording Oracle in a TDX (Intel Trust Domain Extensions) virtual machine with remote attestation support.

## Prerequisites

### On the TDX Host
1. **TDX-enabled hardware** with Intel TDX support
2. **QGS (Quote Generation Service)** installed and running:
   ```bash
   sudo apt install tdx-qgs
   sudo mkdir -p /var/run/tdx-qgs
   sudo chown qgsd:qgsd /var/run/tdx-qgs
   sudo chmod 755 /var/run/tdx-qgs
   sudo systemctl enable --now qgsd
   ```
3. **Libvirt/QEMU** with TDX support
4. **TDX guest image** at `/var/lib/libvirt/images/tdx-guest-ubuntu-24.04-generic.qcow2`

### AppArmor Configuration
Add QGS socket access to libvirt:
```bash
echo '  "/var/run/tdx-qgs/**" rw,' | sudo tee -a /etc/apparmor.d/abstractions/libvirt-qemu
sudo systemctl reload apparmor
```

## Quick Start

```bash
# Create inventory file
cat > /tmp/localhost-inventory.yml << 'EOF'
all:
  hosts:
    tdx_host:
      ansible_connection: local
      ansible_python_interpreter: /usr/bin/python3
EOF

# Deploy
ansible-playbook -i /tmp/localhost-inventory.yml playbooks/deploy.yml

# Get measurements
ansible-playbook -i /tmp/localhost-inventory.yml playbooks/measure.yml

# Check status
ansible-playbook -i /tmp/localhost-inventory.yml playbooks/status.yml

# Destroy
ansible-playbook -i /tmp/localhost-inventory.yml playbooks/destroy.yml
```

## Architecture

```
TDX Host
├── QGS (Quote Generation Service)
│   └── /var/run/tdx-qgs/qgs.socket
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
4. QEMU forwards to QGS via unix socket
5. Full TDX Quote (~5KB) returned in `outblob`

## Troubleshooting

### Empty quotes (0 bytes)
1. Check QGS is running: `systemctl status qgsd`
2. Check socket permissions: `ls -la /var/run/tdx-qgs/`
3. Check QEMU logs: `tail /var/log/libvirt/qemu/recording-oracle-tdx.log`
4. Verify AppArmor allows access (see above)

### Permission denied on QGS socket
```bash
sudo chmod 755 /var/run/tdx-qgs
sudo chmod 666 /var/run/tdx-qgs/qgs.socket
```

Or disable AppArmor for the VM by adding `<seclabel type='none'/>` to the VM XML.

### SSH connection issues
```bash
ssh-keygen -R '[127.0.0.1]:2222'
sshpass -p oracle123 ssh -p 2222 -o StrictHostKeyChecking=no oracle@127.0.0.1
```
