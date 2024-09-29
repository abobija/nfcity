#include <inttypes.h>
#include "cbor.h"
#include "rc522_picc.h"

#define ENC_HELLO_BYTES              32
#define ENC_PICC_STATE_CHANGED_BYTES 128

CborError enc_hello(uint8_t *buffer, size_t *encoded_len);

CborError enc_picc_state_changed(
    uint8_t *buffer, rc522_picc_t *picc, rc522_picc_state_t old_state, size_t *encoded_len);
