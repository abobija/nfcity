#include <inttypes.h>
#include "cbor.h"
#include "picc/rc522_mifare.h"

// {{ encoding

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

// }} encoding

// {{ decoding

#define DEC_MSG_ID_SIZE          36 // uuid
#define DEC_MSG_KIND_SIZE        32
#define DEC_GET_PICC_MSG_KIND    "get_picc"
#define DEC_READ_BLOCK_MSG_KIND  "read_block"
#define DEC_READ_SECTOR_MSG_KIND "read_sector"

typedef struct
{
    char id[DEC_MSG_ID_SIZE + 1];
    char kind[DEC_MSG_KIND_SIZE + 1];
} dec_msg_desc_t;

typedef struct
{
    uint8_t value[RC522_MIFARE_BLOCK_SIZE];
    rc522_mifare_key_type_t type;
} dec_picc_key_t;

typedef struct
{
    uint8_t address; // Block address
    dec_picc_key_t key;
} dec_read_block_msg_t;

typedef struct
{
    uint8_t offset;
    dec_picc_key_t key;
} dec_read_sector_msg_t;

// }} decoding

// {{ encoding

CborError enc_hello_message(CborEncoder *encoder);

CborError enc_picc_message(CborEncoder *encoder, rc522_picc_t *picc);

CborError enc_picc_state_changed_message(CborEncoder *encoder, rc522_picc_t *picc, rc522_picc_state_t old_state);

CborError enc_picc_block_message(CborEncoder *encoder, uint8_t address, uint8_t offset, uint8_t *data);

CborError enc_picc_sector_message(
    CborEncoder *encoder, uint8_t sector_offset, uint8_t sector_block_0_address, uint8_t *sector_data);

// }} encoding

// {{ decoding

CborError dec_msg_desc(const uint8_t *buffer, size_t buffer_size, dec_msg_desc_t *out_msg_desc);

CborError dec_read_block(const uint8_t *buffer, size_t buffer_size, dec_read_block_msg_t *out_read_block_msg);

CborError dec_read_sector(const uint8_t *buffer, size_t buffer_size, dec_read_sector_msg_t *out_read_sector_msg);

// }} decoding
