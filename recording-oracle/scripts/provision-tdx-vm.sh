#!/bin/bash
# Provision a TDX VM for the Recording Oracle
# This script creates a reproducible TDX VM using cloud-init
#
# Usage: ./provision-tdx-vm.sh [options]
#
# Options:
#   --name NAME           VM name (default: recording-oracle-tdx)
#   --memory SIZE         Memory in MB (default: 4096)
#   --cpus COUNT          Number of CPUs (default: 2)
#   --disk SIZE           Disk size in GB (default: 20)
#   --image URL           Base image URL (default: Ubuntu 24.04 cloud image)
#   --ssh-key FILE        SSH public key file (default: ~/.ssh/id_rsa.pub)
#   --output DIR          Output directory for VM files
#   --recording-oracle-image IMAGE  Docker image for recording oracle
#   --dry-run             Show what would be done without executing

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default values
VM_NAME="recording-oracle-tdx"
MEMORY_MB=4096
CPUS=2
DISK_GB=20
BASE_IMAGE_URL="https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img"
SSH_KEY_FILE="${HOME}/.ssh/id_rsa.pub"
OUTPUT_DIR=""
RECORDING_ORACLE_IMAGE="ghcr.io/posix4e/hufi/recording-oracle-tdx:latest"
DRY_RUN=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

usage() {
    cat << EOF
Usage: $(basename "$0") [options]

Provision a TDX VM for the Recording Oracle using cloud-init.

Options:
    --name NAME                   VM name (default: $VM_NAME)
    --memory SIZE                 Memory in MB (default: $MEMORY_MB)
    --cpus COUNT                  Number of CPUs (default: $CPUS)
    --disk SIZE                   Disk size in GB (default: $DISK_GB)
    --image URL                   Base image URL (default: Ubuntu 24.04)
    --ssh-key FILE                SSH public key file (default: $SSH_KEY_FILE)
    --output DIR                  Output directory for VM files
    --recording-oracle-image IMG  Docker image for recording oracle
    --dry-run                     Show what would be done without executing
    -h, --help                    Show this help message

Examples:
    # Create a VM with default settings
    $(basename "$0")

    # Create a VM with custom resources
    $(basename "$0") --memory 8192 --cpus 4 --disk 50

    # Create a VM with a specific SSH key
    $(basename "$0") --ssh-key ~/.ssh/my_key.pub

    # Dry run to see what would be created
    $(basename "$0") --dry-run
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --name) VM_NAME="$2"; shift 2 ;;
        --memory) MEMORY_MB="$2"; shift 2 ;;
        --cpus) CPUS="$2"; shift 2 ;;
        --disk) DISK_GB="$2"; shift 2 ;;
        --image) BASE_IMAGE_URL="$2"; shift 2 ;;
        --ssh-key) SSH_KEY_FILE="$2"; shift 2 ;;
        --output) OUTPUT_DIR="$2"; shift 2 ;;
        --recording-oracle-image) RECORDING_ORACLE_IMAGE="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        -h|--help) usage; exit 0 ;;
        *) log_error "Unknown option: $1"; usage; exit 1 ;;
    esac
done

# Set output directory
if [[ -z "$OUTPUT_DIR" ]]; then
    OUTPUT_DIR="/var/lib/libvirt/images/${VM_NAME}"
fi

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing=()
    
    for cmd in qemu-img virt-install cloud-localds virsh; do
        if ! command -v "$cmd" &> /dev/null; then
            missing+=("$cmd")
        fi
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing required commands: ${missing[*]}"
        log_error "Install with: apt-get install qemu-utils virtinst cloud-image-utils libvirt-clients"
        exit 1
    fi
    
    if [[ ! -f "$SSH_KEY_FILE" ]]; then
        log_error "SSH public key not found: $SSH_KEY_FILE"
        log_error "Generate one with: ssh-keygen -t ed25519"
        exit 1
    fi
    
    # Check for TDX support
    if [[ -e /dev/tdx_guest ]] || grep -q tdx /proc/cpuinfo 2>/dev/null; then
        log_info "TDX support detected"
    else
        log_warn "TDX support not detected on this host"
        log_warn "VM will be created but TDX attestation may not work"
    fi
    
    log_info "Prerequisites check passed"
}

# Download base image
download_base_image() {
    local image_path="${OUTPUT_DIR}/base.qcow2"
    
    if [[ -f "$image_path" ]]; then
        log_info "Base image already exists: $image_path"
        return
    fi
    
    log_info "Downloading base image..."
    mkdir -p "$OUTPUT_DIR"
    
    local tmp_image="${OUTPUT_DIR}/base.img"
    curl -L -o "$tmp_image" "$BASE_IMAGE_URL"
    
    # Convert to qcow2 and resize
    qemu-img convert -f qcow2 -O qcow2 "$tmp_image" "$image_path"
    qemu-img resize "$image_path" "${DISK_GB}G"
    rm -f "$tmp_image"
    
    log_info "Base image ready: $image_path"
}

# Generate cloud-init configuration
generate_cloud_init() {
    local user_data="${OUTPUT_DIR}/user-data"
    local meta_data="${OUTPUT_DIR}/meta-data"
    local cloud_init_iso="${OUTPUT_DIR}/cloud-init.iso"
    
    log_info "Generating cloud-init configuration..."
    
    # Read SSH public key
    local ssh_public_key
    ssh_public_key=$(cat "$SSH_KEY_FILE")
    
    # Read the cloud-init template and substitute variables
    local template="${SCRIPT_DIR}/tdx-vm-cloud-init.yaml"
    if [[ ! -f "$template" ]]; then
        log_error "Cloud-init template not found: $template"
        exit 1
    fi
    
    # Substitute variables in template
    sed -e "s|\${SSH_PUBLIC_KEY}|${ssh_public_key}|g" \
        -e "s|\${RECORDING_ORACLE_IMAGE}|${RECORDING_ORACLE_IMAGE}|g" \
        "$template" > "$user_data"
    
    # Create meta-data
    cat > "$meta_data" << EOF
instance-id: ${VM_NAME}
local-hostname: ${VM_NAME}
EOF
    
    # Create cloud-init ISO
    cloud-localds "$cloud_init_iso" "$user_data" "$meta_data"
    
    log_info "Cloud-init ISO created: $cloud_init_iso"
}

# Create the VM
create_vm() {
    local disk_path="${OUTPUT_DIR}/${VM_NAME}.qcow2"
    local cloud_init_iso="${OUTPUT_DIR}/cloud-init.iso"
    local base_image="${OUTPUT_DIR}/base.qcow2"
    
    log_info "Creating VM disk..."
    
    # Create VM disk from base image
    cp "$base_image" "$disk_path"
    
    log_info "Creating VM: $VM_NAME"
    
    # Build virt-install command
    local virt_install_cmd=(
        virt-install
        --name "$VM_NAME"
        --memory "$MEMORY_MB"
        --vcpus "$CPUS"
        --disk "path=${disk_path},format=qcow2"
        --disk "path=${cloud_init_iso},device=cdrom"
        --os-variant ubuntu24.04
        --network network=default
        --graphics none
        --console pty,target_type=serial
        --import
        --noautoconsole
    )
    
    # Add TDX-specific options if available
    if command -v tdvirsh &> /dev/null; then
        log_info "Using TDX-enabled virtualization"
        virt_install_cmd+=(
            --launchSecurity type=tdx
            --boot loader=/usr/share/OVMF/OVMF_CODE_4M.ms.fd
        )
    fi
    
    if $DRY_RUN; then
        log_info "Dry run - would execute:"
        echo "${virt_install_cmd[*]}"
    else
        "${virt_install_cmd[@]}"
        log_info "VM created successfully"
    fi
}

# Wait for VM to be ready
wait_for_vm() {
    if $DRY_RUN; then
        log_info "Dry run - skipping wait"
        return
    fi
    
    log_info "Waiting for VM to be ready..."
    
    local max_attempts=60
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        local ip
        ip=$(virsh domifaddr "$VM_NAME" 2>/dev/null | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -1 || true)
        
        if [[ -n "$ip" ]]; then
            log_info "VM IP address: $ip"
            
            # Wait for SSH to be available
            if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "oracle@${ip}" "echo ready" &>/dev/null; then
                log_info "VM is ready!"
                echo ""
                echo "=========================================="
                echo "Recording Oracle TDX VM is ready!"
                echo "=========================================="
                echo ""
                echo "VM Name: $VM_NAME"
                echo "IP Address: $ip"
                echo ""
                echo "Connect with: ssh oracle@${ip}"
                echo ""
                echo "Services:"
                echo "  - Recording Oracle: http://${ip}:3000"
                echo "  - TDX Attestation:  http://${ip}:8081"
                echo ""
                echo "Check TDX status: curl http://${ip}:8081/status"
                echo "Get TDX quote:    curl http://${ip}:8081/quote"
                echo ""
                return
            fi
        fi
        
        ((attempt++))
        sleep 5
    done
    
    log_warn "VM may not be fully ready yet. Check manually with: virsh domifaddr $VM_NAME"
}

# Main execution
main() {
    log_info "Provisioning TDX VM for Recording Oracle"
    log_info "VM Name: $VM_NAME"
    log_info "Memory: ${MEMORY_MB}MB"
    log_info "CPUs: $CPUS"
    log_info "Disk: ${DISK_GB}GB"
    log_info "Output: $OUTPUT_DIR"
    
    if $DRY_RUN; then
        log_warn "DRY RUN MODE - no changes will be made"
    fi
    
    check_prerequisites
    download_base_image
    generate_cloud_init
    create_vm
    wait_for_vm
    
    log_info "Done!"
}

main "$@"
