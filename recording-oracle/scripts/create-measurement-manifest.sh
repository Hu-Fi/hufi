#!/bin/bash
# Create TDX measurement manifest from environment variables
# Usage: ./create-measurement-manifest.sh > measurements.json
#
# Required environment variables:
#   MRTD, RTMR0, RTMR1, RTMR2, RTMR3 - TDX measurements
#   GIT_SHA - Git commit SHA
#   IMAGE_DIGEST - Docker image digest
#
# Optional environment variables:
#   GIT_REF - Git reference (branch/tag)
#   NODE_VERSION, UBUNTU_VERSION - Build environment
#   WORKFLOW_RUN_ID, WORKFLOW_RUN_NUMBER - CI info
#   REGISTRY, IMAGE_NAME - Container registry info
#   TDX_HOST - TDX host used for measurement

set -euo pipefail

# Required
: "${MRTD:?MRTD is required}"
: "${RTMR0:?RTMR0 is required}"
: "${RTMR1:?RTMR1 is required}"
: "${RTMR2:?RTMR2 is required}"
: "${RTMR3:?RTMR3 is required}"
: "${GIT_SHA:?GIT_SHA is required}"
: "${IMAGE_DIGEST:?IMAGE_DIGEST is required}"

# Optional with defaults
GIT_REF="${GIT_REF:-}"
NODE_VERSION="${NODE_VERSION:-}"
UBUNTU_VERSION="${UBUNTU_VERSION:-}"
WORKFLOW_RUN_ID="${WORKFLOW_RUN_ID:-}"
WORKFLOW_RUN_NUMBER="${WORKFLOW_RUN_NUMBER:-}"
REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_NAME="${IMAGE_NAME:-}"
TDX_HOST="${TDX_HOST:-}"

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

cat << EOF
{
  "version": "1.0",
  "timestamp": "${TIMESTAMP}",
  "git_sha": "${GIT_SHA}",
  "git_ref": "${GIT_REF}",
  "build": {
    "node_version": "${NODE_VERSION}",
    "ubuntu_version": "${UBUNTU_VERSION}",
    "workflow_run_id": "${WORKFLOW_RUN_ID}",
    "workflow_run_number": "${WORKFLOW_RUN_NUMBER}"
  },
  "image": {
    "registry": "${REGISTRY}",
    "name": "${IMAGE_NAME}",
    "digest": "${IMAGE_DIGEST}",
    "pull_command": "docker pull ${REGISTRY}/${IMAGE_NAME}@${IMAGE_DIGEST}"
  },
  "tdx": {
    "host": "${TDX_HOST}",
    "measured_from_hardware": true
  },
  "measurements": {
    "mrtd": "${MRTD}",
    "rtmr0": "${RTMR0}",
    "rtmr1": "${RTMR1}",
    "rtmr2": "${RTMR2}",
    "rtmr3": "${RTMR3}"
  },
  "verification": {
    "reputation_oracle_endpoint": "/tdx-verification/verify-quote",
    "expected_measurements_endpoint": "/tdx-verification/expected-measurements"
  }
}
EOF
