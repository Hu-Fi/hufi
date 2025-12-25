#!/bin/bash
# Manage Recording Oracle on TDX Guest VM
# The VM is provisioned via cloud-init (see provision-tdx-vm.sh)
#
# Usage: ./deploy-to-tdx.sh [command]
#
# Commands:
#   measure   - Get TDX measurements from running oracle (default)
#   status    - Show status of TDX and recording oracle
#   quote     - Generate a test TDX quote (raw JSON)
#   help      - Show this help message
#
# Environment variables:
#   TDX_HOST - TDX host address (required, or use default)
#   TDX_HOST_SSH_KEY - Path to SSH key for TDX host (optional if using password)
#   TDX_GUEST_SSH_PORT - SSH port for TDX guest (default: 44451)
#   TDX_GUEST_USER - TDX guest username (default: tdx)
#   TDX_GUEST_PASSWORD - Password for TDX guest (required)
#   RECORDING_ORACLE_PORT - Port for recording oracle (default: 12000)
#
# For CI (measure command), outputs TDX measurements as KEY=VALUE to stdout

set -euo pipefail

# Configuration with defaults
TDX_HOST="${TDX_HOST:-ns3222044.ip-57-130-10.eu}"
TDX_HOST_SSH_KEY="${TDX_HOST_SSH_KEY:-}"
TDX_GUEST_SSH_PORT="${TDX_GUEST_SSH_PORT:-44451}"
TDX_GUEST_USER="${TDX_GUEST_USER:-tdx}"
TDX_GUEST_PASSWORD="${TDX_GUEST_PASSWORD:-}"
RECORDING_ORACLE_PORT="${RECORDING_ORACLE_PORT:-12000}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# SSH command helper - supports both key and password auth
ssh_host() {
  if [[ -n "$TDX_HOST_SSH_KEY" ]]; then
    ssh -T -i "$TDX_HOST_SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$TDX_HOST" "$@"
  else
    ssh -T -o StrictHostKeyChecking=no "ubuntu@$TDX_HOST" "$@"
  fi
}

# Run command in TDX guest (via host)
run_in_guest() {
  local cmd="$1"
  if [[ -z "$TDX_GUEST_PASSWORD" ]]; then
    log_error "TDX_GUEST_PASSWORD is required"
    exit 1
  fi
  ssh_host "sshpass -p '$TDX_GUEST_PASSWORD' ssh -T -o StrictHostKeyChecking=no -p $TDX_GUEST_SSH_PORT $TDX_GUEST_USER@localhost \"$cmd\""
}

check_tdx_availability() {
  log_info "Checking TDX availability in guest VM..."
  if run_in_guest "test -c /dev/tdx_guest" 2>/dev/null; then
    log_info "TDX device /dev/tdx_guest is available"
    return 0
  else
    log_error "TDX device not found in guest VM"
    return 1
  fi
}

check_recording_oracle_status() {
  log_info "Checking recording oracle status..."
  local status=$(run_in_guest "curl -s http://localhost:${RECORDING_ORACLE_PORT}/health 2>/dev/null || echo 'not running'")
  if [[ "$status" == *"ok"* ]] || [[ "$status" == *"healthy"* ]] || [[ "$status" == *"status"* ]]; then
    log_info "Recording oracle is running"
    return 0
  else
    log_warn "Recording oracle is not running"
    return 1
  fi
}

check_attestation_endpoint() {
  log_info "Checking TDX attestation endpoint..."
  local status=$(run_in_guest "curl -s http://localhost:${RECORDING_ORACLE_PORT}/attestation/status 2>/dev/null")
  if [[ "$status" == *"available"* ]]; then
    log_info "TDX attestation is available"
    return 0
  else
    log_warn "TDX attestation endpoint not responding"
    return 1
  fi
}

cmd_measure() {
  log_info "Getting TDX measurements..."
  
  # Get quote from running oracle
  RAW_OUTPUT=$(run_in_guest "curl -s http://localhost:$RECORDING_ORACLE_PORT/attestation/quote")
  
  # Extract JSON from output (filter out SSH banners)
  QUOTE_JSON=$(echo "$RAW_OUTPUT" | grep -E '^\{.*\}$' | head -1)
  
  if [ -z "$QUOTE_JSON" ]; then
    log_error "Could not find JSON in output"
    echo "$RAW_OUTPUT" >&2
    exit 1
  fi
  
  # Extract measurements using Python script
  QUOTE_B64=$(echo "$QUOTE_JSON" | jq -r '.quote')
  python3 "$SCRIPT_DIR/extract-tdx-measurements.py" "$QUOTE_B64"
}

cmd_status() {
  echo ""
  echo "=========================================="
  echo "  TDX Recording Oracle Status"
  echo "=========================================="
  echo ""
  echo "TDX Host: ${TDX_HOST}"
  echo "TDX Guest Port: ${TDX_GUEST_SSH_PORT}"
  echo "Recording Oracle Port: ${RECORDING_ORACLE_PORT}"
  echo ""
  check_tdx_availability || true
  echo ""
  check_recording_oracle_status || true
  check_attestation_endpoint || true
  echo ""
}

cmd_quote() {
  run_in_guest "curl -s http://localhost:${RECORDING_ORACLE_PORT}/attestation/quote"
}

cmd_help() {
  head -21 "$0" | tail -20
}

# Main
case "${1:-measure}" in
  measure)    cmd_measure ;;
  status)     cmd_status ;;
  quote)      cmd_quote ;;
  help|--help|-h) cmd_help ;;
  *)
    log_error "Unknown command: $1"
    cmd_help
    exit 1
    ;;
esac
