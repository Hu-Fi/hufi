#!/bin/bash
# Test TDX verification endpoints against live infrastructure
#
# Usage: ./test-tdx-verification.sh [--host HOST] [--proxy-port PORT] [--oracle-port PORT]
#
# Environment variables:
#   TDX_HOST          - TDX host address (default: ns3222044.ip-57-130-10.eu)
#   TDX_PROXY_PORT    - TDX attestation proxy port (default: 8082)
#   ORACLE_PORT       - Recording oracle port (default: 12000)
#   REPUTATION_ORACLE - Reputation oracle URL for verification (optional)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
TDX_HOST="${TDX_HOST:-ns3222044.ip-57-130-10.eu}"
TDX_PROXY_PORT="${TDX_PROXY_PORT:-8082}"
ORACLE_PORT="${ORACLE_PORT:-12000}"
REPUTATION_ORACLE="${REPUTATION_ORACLE:-}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --host)
            TDX_HOST="$2"
            shift 2
            ;;
        --proxy-port)
            TDX_PROXY_PORT="$2"
            shift 2
            ;;
        --oracle-port)
            ORACLE_PORT="$2"
            shift 2
            ;;
        --reputation-oracle)
            REPUTATION_ORACLE="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [--host HOST] [--proxy-port PORT] [--oracle-port PORT] [--reputation-oracle URL]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

PROXY_URL="http://${TDX_HOST}:${TDX_PROXY_PORT}"
ORACLE_URL="http://${TDX_HOST}:${ORACLE_PORT}"

echo "=========================================="
echo "TDX Verification Test Suite"
echo "=========================================="
echo "TDX Host: ${TDX_HOST}"
echo "Proxy URL: ${PROXY_URL}"
echo "Recording Oracle: ${ORACLE_URL}"
if [ -n "$REPUTATION_ORACLE" ]; then
    echo "Reputation Oracle: ${REPUTATION_ORACLE}"
fi
echo "=========================================="
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

info() {
    echo -e "[INFO] $1"
}

# Test 1: TDX Attestation Proxy Status
echo "Test 1: TDX Attestation Proxy Status"
echo "-------------------------------------"
STATUS_RESPONSE=$(curl -s -f "${PROXY_URL}/status" 2>/dev/null || echo "FAILED")

if [ "$STATUS_RESPONSE" = "FAILED" ]; then
    fail "Cannot connect to TDX attestation proxy at ${PROXY_URL}"
else
    info "Response: $STATUS_RESPONSE"
    AVAILABLE=$(echo "$STATUS_RESPONSE" | jq -r '.available // false')
    if [ "$AVAILABLE" = "true" ]; then
        pass "TDX attestation proxy is available"
    else
        fail "TDX is not available on the host"
    fi
fi
echo ""

# Test 2: Generate TDX Quote
echo "Test 2: Generate TDX Quote"
echo "--------------------------"
QUOTE_RESPONSE=$(curl -s -f "${PROXY_URL}/quote" 2>/dev/null || echo "FAILED")

if [ "$QUOTE_RESPONSE" = "FAILED" ]; then
    fail "Cannot generate TDX quote"
else
    QUOTE=$(echo "$QUOTE_RESPONSE" | jq -r '.quote // empty')
    QUOTE_SIZE=$(echo "$QUOTE_RESPONSE" | jq -r '.quote_size // 0')

    if [ -n "$QUOTE" ] && [ "$QUOTE_SIZE" -gt 0 ]; then
        pass "TDX quote generated (${QUOTE_SIZE} bytes)"

        # Extract measurements
        MRTD=$(echo "$QUOTE_RESPONSE" | jq -r '.measurements.mrtd // empty')
        RTMR0=$(echo "$QUOTE_RESPONSE" | jq -r '.measurements.rtmr0 // empty')

        if [ -n "$MRTD" ]; then
            info "MRTD: ${MRTD:0:32}..."
        fi
        if [ -n "$RTMR0" ]; then
            info "RTMR0: ${RTMR0:0:32}..."
        fi
    else
        fail "Invalid TDX quote response"
    fi
fi
echo ""

# Test 3: Recording Oracle Attestation Endpoint
echo "Test 3: Recording Oracle Attestation Endpoint"
echo "----------------------------------------------"

# First check if oracle is reachable
ORACLE_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${ORACLE_URL}/health/ping" 2>/dev/null || echo "000")

if [ "$ORACLE_HEALTH" = "200" ]; then
    pass "Recording oracle is reachable"

    # Test attestation status endpoint
    ATTEST_STATUS=$(curl -s -f "${ORACLE_URL}/attestation/status" 2>/dev/null || echo "FAILED")
    if [ "$ATTEST_STATUS" != "FAILED" ]; then
        pass "Recording oracle attestation status endpoint works"
        info "Status: $ATTEST_STATUS"
    else
        warn "Recording oracle attestation status endpoint not available (may need deployment)"
    fi

    # Test attestation quote endpoint
    CHALLENGE=$(openssl rand -hex 32)
    ATTEST_QUOTE=$(curl -s -f -X POST "${ORACLE_URL}/attestation/quote" \
        -H "Content-Type: application/json" \
        -d "{\"reportData\": \"${CHALLENGE}\"}" 2>/dev/null || echo "FAILED")

    if [ "$ATTEST_QUOTE" != "FAILED" ]; then
        ORACLE_QUOTE=$(echo "$ATTEST_QUOTE" | jq -r '.quote // empty')
        if [ -n "$ORACLE_QUOTE" ]; then
            pass "Recording oracle can generate attestation quotes"
        else
            fail "Recording oracle returned empty quote"
        fi
    else
        warn "Recording oracle attestation quote endpoint not available (may need deployment)"
    fi
else
    warn "Recording oracle not reachable at ${ORACLE_URL} (HTTP ${ORACLE_HEALTH})"
fi
echo ""

# Test 4: Reputation Oracle Verification (if available)
if [ -n "$REPUTATION_ORACLE" ]; then
    echo "Test 4: Reputation Oracle Verification"
    echo "---------------------------------------"

    # Test verify-quote endpoint
    if [ -n "$QUOTE" ]; then
        VERIFY_RESULT=$(curl -s -f -X POST "${REPUTATION_ORACLE}/tdx-verification/verify-quote" \
            -H "Content-Type: application/json" \
            -d "{\"quote\": \"${QUOTE}\"}" 2>/dev/null || echo "FAILED")

        if [ "$VERIFY_RESULT" != "FAILED" ]; then
            VALID=$(echo "$VERIFY_RESULT" | jq -r '.valid // false')
            if [ "$VALID" = "true" ]; then
                pass "Quote verification succeeded"
            else
                ERRORS=$(echo "$VERIFY_RESULT" | jq -r '.errors[]? // empty')
                if [ -n "$ERRORS" ]; then
                    fail "Quote verification failed: $ERRORS"
                else
                    fail "Quote verification failed (no measurement match)"
                fi
            fi
        else
            fail "Cannot connect to reputation oracle verification endpoint"
        fi
    else
        warn "Skipping verify-quote test (no quote available)"
    fi

    # Test expected-measurements endpoint
    EXPECTED=$(curl -s -f "${REPUTATION_ORACLE}/tdx-verification/expected-measurements" 2>/dev/null || echo "FAILED")
    if [ "$EXPECTED" != "FAILED" ]; then
        EXPECTED_MRTD=$(echo "$EXPECTED" | jq -r '.mrtd // empty')
        if [ -n "$EXPECTED_MRTD" ] && [ "$EXPECTED_MRTD" != "" ]; then
            pass "Expected measurements configured"
            info "Expected MRTD: ${EXPECTED_MRTD:0:32}..."
        else
            warn "No expected measurements configured in reputation oracle"
        fi
    else
        fail "Cannot get expected measurements from reputation oracle"
    fi

    # Test build-info endpoint
    BUILD_INFO=$(curl -s -f "${REPUTATION_ORACLE}/tdx-verification/build-info" 2>/dev/null || echo "FAILED")
    if [ "$BUILD_INFO" != "FAILED" ]; then
        GIT_SHA=$(echo "$BUILD_INFO" | jq -r '.gitSha // empty')
        if [ -n "$GIT_SHA" ]; then
            pass "Build info available"
            info "Git SHA: $GIT_SHA"
        else
            warn "Build info incomplete"
        fi
    fi
    echo ""
fi

# Test 5: Challenge-Response Verification
echo "Test 5: Challenge-Response Verification"
echo "----------------------------------------"

CHALLENGE_HEX=$(openssl rand -hex 32)
info "Challenge: ${CHALLENGE_HEX:0:16}..."

# Get quote with challenge from proxy
CHALLENGE_QUOTE_RESPONSE=$(curl -s -f "${PROXY_URL}/quote" 2>/dev/null || echo "FAILED")

if [ "$CHALLENGE_QUOTE_RESPONSE" != "FAILED" ]; then
    CHALLENGE_QUOTE=$(echo "$CHALLENGE_QUOTE_RESPONSE" | jq -r '.quote // empty')
    REPORT_DATA=$(echo "$CHALLENGE_QUOTE_RESPONSE" | jq -r '.report_data // empty')

    if [ -n "$CHALLENGE_QUOTE" ]; then
        pass "Challenge quote generated"
        if [ -n "$REPORT_DATA" ]; then
            info "Report data (base64): ${REPORT_DATA:0:20}..."
        fi
    else
        fail "Failed to generate challenge quote"
    fi
else
    fail "Cannot generate challenge quote"
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Failed: ${RED}${TESTS_FAILED}${NC}"
echo "=========================================="

if [ $TESTS_FAILED -gt 0 ]; then
    exit 1
fi
exit 0
