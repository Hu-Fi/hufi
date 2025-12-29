#!/usr/bin/env python3
"""TDX Attestation Proxy - HTTP API for TDX quote generation via libtdx-attest."""

import base64
import ctypes
import http.server
import json
import os
import shutil
import sys
import threading
import uuid
from typing import Optional, Tuple

# Configuration
TSM_REPORT_PATH = "/sys/kernel/config/tsm/report"
TDX_ATTEST_LIB = "/usr/lib/x86_64-linux-gnu/libtdx_attest.so.1"
PORT = int(os.environ.get("TDX_PROXY_PORT", "8081"))
LOG_FILE = "/var/log/tdx-proxy.log"

# Cached library handle (loaded once, reused)
_lib: Optional[ctypes.CDLL] = None
_lib_lock = threading.Lock()


def log(msg: str) -> None:
    """Log message to file and stderr."""
    try:
        with open(LOG_FILE, "a") as f:
            f.write(f"{msg}\n")
    except Exception:
        pass
    print(msg, file=sys.stderr)


def get_lib() -> Optional[ctypes.CDLL]:
    """Get cached library handle, loading once on first call."""
    global _lib
    if _lib is not None:
        return _lib

    with _lib_lock:
        # Double-check after acquiring lock
        if _lib is not None:
            return _lib

        if not os.path.exists(TDX_ATTEST_LIB):
            log(f"Library not found: {TDX_ATTEST_LIB}")
            return None

        try:
            lib = ctypes.CDLL(TDX_ATTEST_LIB)

            # Set function signatures once
            lib.tdx_att_get_quote.argtypes = [
                ctypes.POINTER(ctypes.c_uint8),  # p_tdx_report_data (64 bytes)
                ctypes.c_void_p,  # att_key_id_list (NULL = use default)
                ctypes.c_uint32,  # list_size (0 if NULL)
                ctypes.c_void_p,  # p_att_key_id (output, can be NULL)
                ctypes.POINTER(ctypes.POINTER(ctypes.c_uint8)),  # pp_quote
                ctypes.POINTER(ctypes.c_uint32),  # p_quote_size
                ctypes.c_uint32,  # flags
            ]
            lib.tdx_att_get_quote.restype = ctypes.c_int

            lib.tdx_att_free_quote.argtypes = [ctypes.POINTER(ctypes.c_uint8)]
            lib.tdx_att_free_quote.restype = None

            _lib = lib
            log("libtdx-attest library loaded successfully")
            return lib

        except OSError as e:
            log(f"Failed to load libtdx_attest: {e}")
            return None


def normalize_report_data(report_data: Optional[bytes]) -> bytes:
    """Normalize report data to exactly 64 bytes."""
    if report_data is None:
        return bytes(64)
    if len(report_data) < 64:
        return report_data + bytes(64 - len(report_data))
    return report_data[:64]


def get_tdx_quote_via_lib(report_data: bytes) -> Tuple[bytes, bytes]:
    """Generate TDX Quote using libtdx-attest library."""
    lib = get_lib()
    if lib is None:
        return b"", report_data

    report_data_arr = (ctypes.c_uint8 * 64)(*report_data)
    quote_ptr = ctypes.POINTER(ctypes.c_uint8)()
    quote_size = ctypes.c_uint32(0)

    log("Calling tdx_att_get_quote...")
    ret = lib.tdx_att_get_quote(
        report_data_arr,
        None,  # att_key_id_list (NULL = use default)
        0,  # list_size
        None,  # p_att_key_id (don't need the selected key)
        ctypes.byref(quote_ptr),
        ctypes.byref(quote_size),
        0,  # flags
    )

    if ret != 0:
        log(f"tdx_att_get_quote failed with error code: {ret}")
        return b"", report_data

    # Check for valid pointer and size
    if not quote_ptr or quote_size.value == 0:
        log("tdx_att_get_quote returned empty or null quote")
        return b"", report_data

    try:
        quote = bytes(quote_ptr[: quote_size.value])
        lib.tdx_att_free_quote(quote_ptr)
        log(f"Got quote of {len(quote)} bytes via libtdx-attest")
        return quote, report_data
    except Exception as e:
        log(f"Error extracting quote: {e}")
        return b"", report_data


def get_tdx_quote_via_tsm(report_data: bytes) -> Tuple[bytes, bytes]:
    """Generate TDX Quote using TSM configfs (fallback method)."""
    report_name = f"quote_{uuid.uuid4().hex[:8]}"
    report_path = os.path.join(TSM_REPORT_PATH, report_name)

    try:
        log(f"TSM: Creating report at {report_path}")
        os.makedirs(report_path, exist_ok=True)

        # Write report data to inblob
        with open(os.path.join(report_path, "inblob"), "wb") as f:
            f.write(report_data)

        # Read quote from outblob
        with open(os.path.join(report_path, "outblob"), "rb") as f:
            quote = f.read()

        log(f"TSM: Got quote of {len(quote)} bytes")
        return quote, report_data

    except Exception as e:
        log(f"TSM configfs failed: {e}")
        return b"", report_data

    finally:
        # Proper cleanup - remove entire directory tree
        # (os.rmdir only removes empty dirs, TSM creates files)
        try:
            shutil.rmtree(report_path, ignore_errors=True)
        except Exception:
            pass


def get_tdx_quote(report_data: Optional[bytes] = None) -> Tuple[bytes, bytes]:
    """Generate TDX Quote - try libtdx-attest first, fall back to TSM."""
    normalized_data = normalize_report_data(report_data)

    # Try libtdx-attest library first (more reliable)
    if os.path.exists(TDX_ATTEST_LIB):
        log("Using libtdx-attest library")
        quote, used_data = get_tdx_quote_via_lib(normalized_data)
        if quote:
            return quote, used_data
        log("libtdx-attest failed, falling back to TSM")

    # Fallback to TSM configfs
    if os.path.exists(TSM_REPORT_PATH):
        return get_tdx_quote_via_tsm(normalized_data)

    log("No TDX quote method available")
    return b"", normalized_data


def extract_measurements(quote: bytes) -> dict:
    """Extract measurements from TDX Quote v4."""
    # TDX Quote v4: Header (48) + Body with TD Report
    # TD Report in quote body at offset 48, measurements at:
    # MRTD: offset 48+128=176 (48 bytes)
    # RTMRs: offset 48+320=368 (4x48 bytes)
    if len(quote) < 560:
        return {}
    return {
        "mrtd": quote[176:224].hex(),
        "rtmr0": quote[368:416].hex(),
        "rtmr1": quote[416:464].hex(),
        "rtmr2": quote[464:512].hex(),
        "rtmr3": quote[512:560].hex(),
    }


class TDXHandler(http.server.BaseHTTPRequestHandler):
    """HTTP request handler for TDX attestation API."""

    def log_message(self, format, *args):
        """Suppress default HTTP logging."""
        pass

    def send_json(self, code: int, data: dict) -> None:
        """Send JSON response."""
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_GET(self):
        """Handle GET requests."""
        if self.path == "/status":
            tdx_guest_dev = "/dev/tdx_guest"
            status = {
                "available": os.path.exists(TSM_REPORT_PATH)
                or os.path.exists(TDX_ATTEST_LIB),
                "tsm_path": TSM_REPORT_PATH,
                "tsm_available": os.path.exists(TSM_REPORT_PATH),
                "tdx_guest_device": os.path.exists(tdx_guest_dev),
                "libtdx_attest": os.path.exists(TDX_ATTEST_LIB),
                "device": tdx_guest_dev if os.path.exists(tdx_guest_dev) else None,
            }
            # List TSM report directory contents
            if os.path.exists(TSM_REPORT_PATH):
                try:
                    status["tsm_contents"] = os.listdir(TSM_REPORT_PATH)
                except Exception as e:
                    status["tsm_error"] = str(e)
            self.send_json(200, status)

        elif self.path == "/quote":
            try:
                quote, report_data = get_tdx_quote()
                if not quote:
                    self.send_json(503, {"error": "Failed to generate TDX quote"})
                    return
                self.send_json(
                    200,
                    {
                        "quote": base64.b64encode(quote).decode(),
                        "quote_size": len(quote),
                        "report_data": base64.b64encode(report_data).decode(),
                        "measurements": extract_measurements(quote),
                    },
                )
            except Exception as e:
                log(f"Exception in GET /quote: {e}")
                self.send_json(500, {"error": str(e)})

        elif self.path == "/logs":
            try:
                with open(LOG_FILE, "r") as f:
                    logs = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(logs.encode())
            except Exception as e:
                self.send_json(500, {"error": str(e)})

        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        """Handle POST requests."""
        if self.path == "/quote":
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = json.loads(self.rfile.read(length)) if length else {}
                report_data = None
                if body.get("reportData"):
                    report_data = base64.b64decode(body["reportData"])

                quote, used_report_data = get_tdx_quote(report_data)
                if not quote:
                    self.send_json(503, {"error": "Failed to generate TDX quote"})
                    return

                self.send_json(
                    200,
                    {
                        "quote": base64.b64encode(quote).decode(),
                        "quote_size": len(quote),
                        "report_data": base64.b64encode(used_report_data).decode(),
                        "measurements": extract_measurements(quote),
                    },
                )
            except Exception as e:
                log(f"Exception in POST /quote: {e}")
                self.send_json(500, {"error": str(e)})
        else:
            self.send_response(404)
            self.end_headers()


if __name__ == "__main__":
    log(f"TDX Attestation Proxy starting on port {PORT}")
    log(f"TSM path: {TSM_REPORT_PATH} (exists: {os.path.exists(TSM_REPORT_PATH)})")
    log(f"libtdx-attest: {TDX_ATTEST_LIB} (exists: {os.path.exists(TDX_ATTEST_LIB)})")

    server = http.server.HTTPServer(("0.0.0.0", PORT), TDXHandler)
    print(f"TDX Attestation Proxy listening on port {PORT}")
    server.serve_forever()
