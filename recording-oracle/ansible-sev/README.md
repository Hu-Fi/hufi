# SEV Recording Oracle Ansible Deployment

This directory contains Ansible playbooks and roles for deploying the Recording Oracle in an AMD SEV-SNP protected VM.

## Prerequisites

- AMD EPYC processor with SEV-SNP support (e.g., EPYC 9004 series "Genoa")
- Ubuntu 24.04 on the host with:
  - QEMU with SEV-SNP support
  - libvirt
  - OVMF firmware with SEV support
- SSH access to the SEV host

## Quick Start

1. **Configure the inventory**:
   ```bash
   # Edit inventory/hosts.yml or pass variables on command line
   ansible-playbook playbooks/deploy.yml \
     -e "sev_host_ip=51.68.31.68" \
     -e "sev_host_user=ubuntu"
   ```

2. **Deploy the SEV VM**:
   ```bash
   ansible-playbook playbooks/deploy.yml
   ```

3. **Check status**:
   ```bash
   ansible-playbook playbooks/status.yml
   ```

4. **Get SEV measurements**:
   ```bash
   ansible-playbook playbooks/measure.yml
   ```

5. **Destroy the VM**:
   ```bash
   ansible-playbook playbooks/destroy.yml
   ```

## Configuration

### Group Variables (group_vars/all.yml)

| Variable | Default | Description |
|----------|---------|-------------|
| `vm_name` | `recording-oracle-sev` | Name of the VM |
| `vm_memory_mb` | `4096` | Memory in MB |
| `vm_cpus` | `2` | Number of vCPUs |
| `vm_disk_size_gb` | `20` | Disk size in GB |
| `sev_policy` | `0x30000` | SEV-SNP policy |
| `vm_ssh_port` | `2222` | SSH port forwarded to host |
| `recording_oracle_port` | `12000` | Recording Oracle port |
| `recording_oracle_image` | `ghcr.io/posix4e/hufi/recording-oracle:latest` | Docker image |

### SEV-SNP Policy Bits

The `sev_policy` controls VM behavior:
- Bit 0: SMT (Simultaneous Multi-Threading) allowed
- Bit 1: Reserved (must be 1)
- Bit 2: Migration Agent allowed
- Bit 3: Debug allowed
- Bit 16: Single socket required

Default `0x30000` enables basic SEV-SNP with SMT.

## Endpoints

After deployment, the following endpoints are available on the host:

| Endpoint | Port | Description |
|----------|------|-------------|
| SSH | 2222 | SSH access to VM |
| Recording Oracle | 12000 | Main oracle API |
| SEV Attestation Proxy | 8082 | SEV attestation API |

### SEV Attestation Proxy API

- `GET /status` - Check SEV availability
- `GET /report` - Generate attestation report with random data
- `POST /report` - Generate attestation report with custom data
  ```json
  {"report_data": "<hex-encoded-64-bytes>"}
  ```

## SEV-SNP Measurements

The attestation report contains:
- **LAUNCH_MEASUREMENT**: 48-byte hash of the VM's initial state
- **Policy**: The SEV-SNP policy in effect
- **Report ID**: Unique identifier for this VM instance
- **VMPL**: Current VM Privilege Level

## Directory Structure

```
ansible-sev/
├── ansible.cfg
├── inventory/
│   └── hosts.yml
├── group_vars/
│   └── all.yml
├── playbooks/
│   ├── deploy.yml
│   ├── destroy.yml
│   ├── measure.yml
│   └── status.yml
└── roles/
    ├── sev_vm/
    │   ├── tasks/
    │   │   ├── main.yml
    │   │   ├── provision.yml
    │   │   ├── destroy.yml
    │   │   ├── wait.yml
    │   │   └── find_base_image.yml
    │   ├── templates/
    │   │   ├── vm.xml.j2
    │   │   ├── user-data.yml.j2
    │   │   ├── meta-data.yml.j2
    │   │   └── network-config.yml.j2
    │   └── vars/
    │       └── main.yml
    └── sev_attestation/
        ├── tasks/
        │   ├── main.yml
        │   ├── status.yml
        │   └── measure.yml
        └── vars/
            └── main.yml
```

## Comparison with TDX

| Feature | TDX | SEV-SNP |
|---------|-----|---------|
| Vendor | Intel | AMD |
| Measurement | MRTD + 4 RTMRs | LAUNCH_MEASUREMENT |
| Device | `/dev/tdx_guest` | `/dev/sev-guest` |
| libvirt type | `<launchSecurity type='tdx'>` | `<launchSecurity type='sev-snp'>` |
| Quote size | ~4KB | ~1.2KB |

## Troubleshooting

### SEV not available

Check if SEV is enabled:
```bash
# On the host
grep sev /proc/cpuinfo
ls -la /dev/sev
dmesg | grep -i sev
```

### VM fails to start

Check OVMF firmware paths:
```bash
ls -la /usr/share/OVMF/
```

The VM requires OVMF with SEV support. Install with:
```bash
apt install ovmf
```

### Attestation fails

Check if the VM is actually running with SEV:
```bash
virsh dumpxml recording-oracle-sev | grep -A5 launchSecurity
```
