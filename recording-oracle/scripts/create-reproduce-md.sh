#!/bin/bash
# Create REPRODUCE.md from measurements.json
# Usage: ./create-reproduce-md.sh measurements.json > REPRODUCE.md

set -euo pipefail

MEASUREMENTS_FILE="${1:-measurements.json}"

if [ ! -f "$MEASUREMENTS_FILE" ]; then
  echo "Error: $MEASUREMENTS_FILE not found" >&2
  exit 1
fi

GIT_SHA=$(jq -r '.git_sha' "$MEASUREMENTS_FILE")
IMAGE_DIGEST=$(jq -r '.image.digest' "$MEASUREMENTS_FILE")
MRTD=$(jq -r '.measurements.mrtd' "$MEASUREMENTS_FILE")
RTMR0=$(jq -r '.measurements.rtmr0' "$MEASUREMENTS_FILE")
RTMR1=$(jq -r '.measurements.rtmr1' "$MEASUREMENTS_FILE")
RTMR2=$(jq -r '.measurements.rtmr2' "$MEASUREMENTS_FILE")
RTMR3=$(jq -r '.measurements.rtmr3' "$MEASUREMENTS_FILE")

cat << EOF
# TDX Recording Oracle - Reproduction Guide

## Build Info
- **Git SHA:** ${GIT_SHA}
- **Image Digest:** ${IMAGE_DIGEST}

## TDX Measurements
| Register | Value |
|----------|-------|
| MRTD | \`${MRTD}\` |
| RTMR[0] | \`${RTMR0}\` |
| RTMR[1] | \`${RTMR1}\` |
| RTMR[2] | \`${RTMR2}\` |
| RTMR[3] | \`${RTMR3}\` |

## Building Reputation Oracle with These Measurements

\`\`\`bash
# Download measurements.json from this release, then:
eval \$(./reputation-oracle/scripts/set-tdx-measurements.sh measurements.json)
cd reputation-oracle && yarn build
\`\`\`

## Verifying a Recording Oracle

\`\`\`bash
# Get quote from recording oracle
curl http://<oracle>:12000/attestation/quote | \\
  python3 recording-oracle/scripts/extract-tdx-measurements.py --json -

# Or use reputation oracle endpoint
curl -X POST http://<reputation-oracle>/tdx-verification/verify-oracle \\
  -H "Content-Type: application/json" \\
  -d '{"oracleUrl": "http://<recording-oracle>:12000"}'
\`\`\`

## Notes
- MRTD = initial TD memory (firmware, kernel, initrd)
- RTMR[0-3] = runtime measurements
- Use challenge-response (report_data) to prevent replay attacks
EOF
