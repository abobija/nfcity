#include "cbor.h"
#include "picc/rc522_mifare.h"

#define DEC_KIND_BYTES 32

#define DEC_GET_PICC_MSG_KIND   "get_picc"
#define DEC_READ_BLOCK_MSG_KIND "read_block"

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

CborError dec_kind(const uint8_t *buffer, size_t buffer_size, char *kind, size_t *decoded_len);

CborError dec_read_block(const uint8_t *buffer, size_t buffer_size, dec_read_block_msg_t *out_read_block_msg);
