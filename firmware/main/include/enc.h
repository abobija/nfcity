#include <inttypes.h> 
#include "cbor.h"

#define ENC_HELLO_BYTES 32

CborError enc_hello(uint8_t *buffer, size_t buffer_len, size_t *encoded_len);
