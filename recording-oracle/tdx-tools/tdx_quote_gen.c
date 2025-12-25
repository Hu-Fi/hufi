/*
 * TDX Quote Generator - Generates TDX attestation quotes
 * Usage: tdx_quote_gen [report_data_hex]
 * Output: JSON with base64-encoded quote and report
 */

#include <stdlib.h>
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <time.h>
#include "tdx_attest.h"

static const char base64_chars[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static char* base64_encode(const uint8_t *data, size_t len) {
    size_t out_len = 4 * ((len + 2) / 3);
    char *encoded = malloc(out_len + 1);
    if (!encoded) return NULL;
    
    size_t i, j;
    for (i = 0, j = 0; i < len;) {
        uint32_t octet_a = i < len ? data[i++] : 0;
        uint32_t octet_b = i < len ? data[i++] : 0;
        uint32_t octet_c = i < len ? data[i++] : 0;
        uint32_t triple = (octet_a << 16) + (octet_b << 8) + octet_c;
        
        encoded[j++] = base64_chars[(triple >> 18) & 0x3F];
        encoded[j++] = base64_chars[(triple >> 12) & 0x3F];
        encoded[j++] = base64_chars[(triple >> 6) & 0x3F];
        encoded[j++] = base64_chars[triple & 0x3F];
    }
    
    // Add padding
    size_t mod = len % 3;
    if (mod == 1) {
        encoded[out_len - 1] = '=';
        encoded[out_len - 2] = '=';
    } else if (mod == 2) {
        encoded[out_len - 1] = '=';
    }
    encoded[out_len] = '\0';
    return encoded;
}

static int hex_to_bytes(const char *hex, uint8_t *bytes, size_t max_len) {
    size_t hex_len = strlen(hex);
    if (hex_len % 2 != 0) return -1;
    
    size_t byte_len = hex_len / 2;
    if (byte_len > max_len) byte_len = max_len;
    
    for (size_t i = 0; i < byte_len; i++) {
        unsigned int byte;
        if (sscanf(hex + 2*i, "%2x", &byte) != 1) return -1;
        bytes[i] = (uint8_t)byte;
    }
    return byte_len;
}

int main(int argc, char *argv[]) {
    tdx_report_data_t report_data = {{0}};
    tdx_report_t tdx_report = {{0}};
    tdx_uuid_t selected_att_key_id = {0};
    uint8_t *p_quote_buf = NULL;
    uint32_t quote_size = 0;
    tdx_attest_error_t ret;
    
    // Parse report data from command line (hex string) or generate random
    if (argc > 1) {
        int parsed = hex_to_bytes(argv[1], report_data.d, TDX_REPORT_DATA_SIZE);
        if (parsed < 0) {
            fprintf(stderr, "{\"error\": \"Invalid hex string for report_data\"}\n");
            return 1;
        }
    } else {
        // Generate random report data
        srand(time(NULL));
        for (int i = 0; i < TDX_REPORT_DATA_SIZE; i++) {
            report_data.d[i] = rand() & 0xFF;
        }
    }
    
    // Get TD Report
    ret = tdx_att_get_report(&report_data, &tdx_report);
    if (ret != TDX_ATTEST_SUCCESS) {
        fprintf(stderr, "{\"error\": \"Failed to get TD report\", \"code\": %d}\n", ret);
        return 1;
    }
    
    // Get TD Quote
    ret = tdx_att_get_quote(&report_data, NULL, 0, &selected_att_key_id,
                           &p_quote_buf, &quote_size, 0);
    if (ret != TDX_ATTEST_SUCCESS) {
        fprintf(stderr, "{\"error\": \"Failed to get TD quote\", \"code\": %d}\n", ret);
        return 1;
    }
    
    // Encode to base64
    char *report_b64 = base64_encode(tdx_report.d, TDX_REPORT_SIZE);
    char *quote_b64 = base64_encode(p_quote_buf, quote_size);
    char *report_data_b64 = base64_encode(report_data.d, TDX_REPORT_DATA_SIZE);
    
    if (!report_b64 || !quote_b64 || !report_data_b64) {
        fprintf(stderr, "{\"error\": \"Failed to encode to base64\"}\n");
        tdx_att_free_quote(p_quote_buf);
        return 1;
    }
    
    // Output JSON
    printf("{\n");
    printf("  \"quote\": \"%s\",\n", quote_b64);
    printf("  \"quote_size\": %u,\n", quote_size);
    printf("  \"report\": \"%s\",\n", report_b64);
    printf("  \"report_data\": \"%s\"\n", report_data_b64);
    printf("}\n");
    
    free(report_b64);
    free(quote_b64);
    free(report_data_b64);
    tdx_att_free_quote(p_quote_buf);
    
    return 0;
}
