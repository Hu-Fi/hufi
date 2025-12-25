# TDX Tools

This directory contains tools for TDX (Intel Trust Domain Extensions) attestation.

## tdx_quote_gen.c

A C program that generates TDX attestation quotes using the libtdx-attest library.

### Building

On a system with TDX support and libtdx-attest installed:

```bash
gcc -o tdx_quote_gen tdx_quote_gen.c -ltdx_attest
```

### Usage

```bash
# Generate quote with random report data
./tdx_quote_gen

# Generate quote with custom report data (hex string, up to 64 bytes)
./tdx_quote_gen 48656c6c6f20576f726c6421
```

### Output

The program outputs JSON with:
- `quote`: Base64-encoded TDX quote
- `quote_size`: Size of the quote in bytes
- `report_data`: Base64-encoded report data used

### Requirements

- Intel TDX-enabled hardware
- Running inside a TDX guest VM
- libtdx-attest library installed
- /dev/tdx_guest device available

### Integration

The recording oracle's TDX attestation service calls this binary to generate quotes.
The binary must be installed at `/usr/local/bin/tdx_quote_gen`.
