#include <inttypes.h>
#include "cbor.h"
#include "picc/rc522_mifare.h"

#define ENC_HELLO_MSG_KIND              "hello"
#define ENC_HELLO_BYTES                 32
#define ENC_PICC_MSG_KIND               "picc"
#define ENC_PICC_BYTES                  128
#define ENC_PICC_STATE_CHANGED_MSG_KIND "picc_state_changed"
#define ENC_PICC_STATE_CHANGED_BYTES    32 + ENC_PICC_BYTES
#define ENC_PICC_BLOCK_MSG_KIND         "picc_block"
#define ENC_PICC_BLOCK_BYTES            64

CborError enc_hello(uint8_t *buffer, size_t *encoded_len);

CborError enc_picc(uint8_t *buffer, rc522_picc_t *picc, size_t *encoded_len);

CborError enc_picc_state_changed(
    uint8_t *buffer, rc522_picc_t *picc, rc522_picc_state_t old_state, size_t *encoded_len);

CborError enc_picc_block(uint8_t *buffer, uint8_t block_address, uint8_t *data, size_t *encoded_len);
