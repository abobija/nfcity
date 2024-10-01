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
#define ENC_PICC_SECTOR_MSG_KIND        "picc_sector"
#define ENC_PICC_SECTOR_BYTES           4 * ENC_PICC_BLOCK_BYTES // FIXME: for mifare 4k

CborError enc_hello_message(CborEncoder *encoder);

CborError enc_picc_message(CborEncoder *encoder, rc522_picc_t *picc);

CborError enc_picc_state_changed_message(CborEncoder *encoder, rc522_picc_t *picc, rc522_picc_state_t old_state);

CborError enc_picc_block_message(CborEncoder *encoder, uint8_t address, uint8_t offset, uint8_t *data);

CborError enc_picc_sector_message(
    CborEncoder *encoder, uint8_t sector_offset, uint8_t sector_block_0_address, uint8_t *sector_data);
