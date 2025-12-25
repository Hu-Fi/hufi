#!/bin/bash
# Set TDX measurements from a measurements.json file or command line args
# Usage:
#   ./set-tdx-measurements.sh measurements.json
#   ./set-tdx-measurements.sh --mrtd <mrtd> --rtmr0 <rtmr0> ...

set -u

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  echo "Usage:"
  echo "  $0 measurements.json              # Load from JSON file"
  echo "  $0 --mrtd <mrtd> [--rtmr0 <rtmr0>] ...  # Set directly"
  echo ""
  echo "Outputs environment variables for building reputation-oracle with baked-in measurements"
  exit 0
fi

if [ -f "${1:-}" ]; then
  # Load from JSON file
  JSON_FILE="$1"
  MRTD=$(jq -r '.measurements.mrtd // .mrtd // ""' "$JSON_FILE")
  RTMR0=$(jq -r '.measurements.rtmr0 // .rtmr0 // ""' "$JSON_FILE")
  RTMR1=$(jq -r '.measurements.rtmr1 // .rtmr1 // ""' "$JSON_FILE")
  RTMR2=$(jq -r '.measurements.rtmr2 // .rtmr2 // ""' "$JSON_FILE")
  RTMR3=$(jq -r '.measurements.rtmr3 // .rtmr3 // ""' "$JSON_FILE")
  GIT_SHA=$(jq -r '.git_sha // ""' "$JSON_FILE")
  IMAGE_DIGEST=$(jq -r '.image.digest // ""' "$JSON_FILE")
  TIMESTAMP=$(jq -r '.timestamp // ""' "$JSON_FILE")
else
  # Parse command line args
  while [[ $# -gt 0 ]]; do
    case $1 in
      --mrtd) MRTD="$2"; shift 2 ;;
      --rtmr0) RTMR0="$2"; shift 2 ;;
      --rtmr1) RTMR1="$2"; shift 2 ;;
      --rtmr2) RTMR2="$2"; shift 2 ;;
      --rtmr3) RTMR3="$2"; shift 2 ;;
      --git-sha) GIT_SHA="$2"; shift 2 ;;
      --image-digest) IMAGE_DIGEST="$2"; shift 2 ;;
      *) echo "Unknown option: $1"; exit 1 ;;
    esac
  done
fi

# Output for shell eval or export
echo "export TDX_EXPECTED_MRTD='${MRTD:-}'"
echo "export TDX_EXPECTED_RTMR0='${RTMR0:-}'"
echo "export TDX_EXPECTED_RTMR1='${RTMR1:-}'"
echo "export TDX_EXPECTED_RTMR2='${RTMR2:-}'"
echo "export TDX_EXPECTED_RTMR3='${RTMR3:-}'"
echo "export TDX_BUILD_GIT_SHA='${GIT_SHA:-}'"
echo "export TDX_BUILD_IMAGE_DIGEST='${IMAGE_DIGEST:-}'"
echo "export TDX_BUILD_TIMESTAMP='${TIMESTAMP:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}'"
