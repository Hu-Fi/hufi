#!/usr/bin/env python3
"""Extract TDX measurements (MRTD, RTMRs) from a base64-encoded TDX quote."""

import base64
import json
import sys
import os

# TDX Quote v4 structure offsets
TD_REPORT_OFFSET = 48
MRTD_OFFSET = 128
MRTD_SIZE = 48
RTMR_OFFSET = 368
RTMR_SIZE = 48


def extract_measurements(quote_b64: str) -> dict:
    """Extract MRTD and RTMRs from a base64-encoded TDX quote."""
    quote = base64.b64decode(quote_b64)
    
    mrtd_start = TD_REPORT_OFFSET + MRTD_OFFSET
    mrtd = quote[mrtd_start:mrtd_start + MRTD_SIZE].hex()
    
    rtmr_start = TD_REPORT_OFFSET + RTMR_OFFSET
    rtmr0 = quote[rtmr_start:rtmr_start + RTMR_SIZE].hex()
    rtmr1 = quote[rtmr_start + RTMR_SIZE:rtmr_start + 2*RTMR_SIZE].hex()
    rtmr2 = quote[rtmr_start + 2*RTMR_SIZE:rtmr_start + 3*RTMR_SIZE].hex()
    rtmr3 = quote[rtmr_start + 3*RTMR_SIZE:rtmr_start + 4*RTMR_SIZE].hex()
    
    return {
        'mrtd': mrtd,
        'rtmr0': rtmr0,
        'rtmr1': rtmr1,
        'rtmr2': rtmr2,
        'rtmr3': rtmr3
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: extract-tdx-measurements.py <base64_quote>", file=sys.stderr)
        print("       extract-tdx-measurements.py --json <json_with_quote_field>", file=sys.stderr)
        sys.exit(1)
    
    if sys.argv[1] == '--json':
        # Read JSON from stdin or second argument
        if len(sys.argv) > 2:
            json_data = json.loads(sys.argv[2])
        else:
            json_data = json.load(sys.stdin)
        quote_b64 = json_data.get('quote')
        if not quote_b64:
            print("ERROR: No 'quote' field in JSON", file=sys.stderr)
            sys.exit(1)
    else:
        quote_b64 = sys.argv[1]
    
    measurements = extract_measurements(quote_b64)
    
    # Print measurements
    print(f"MRTD:    {measurements['mrtd']}")
    print(f"RTMR[0]: {measurements['rtmr0']}")
    print(f"RTMR[1]: {measurements['rtmr1']}")
    print(f"RTMR[2]: {measurements['rtmr2']}")
    print(f"RTMR[3]: {measurements['rtmr3']}")
    
    # Write to GitHub output if available
    github_output = os.environ.get('GITHUB_OUTPUT')
    if github_output:
        with open(github_output, 'a') as f:
            for key, value in measurements.items():
                f.write(f"{key}={value}\n")


if __name__ == '__main__':
    main()
