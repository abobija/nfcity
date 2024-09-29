#include "cbor.h"

#define DEC_KIND_BYTES 32

CborError dec_kind(const uint8_t *buffer, size_t buffer_size, char *kind, size_t *decoded_len);
