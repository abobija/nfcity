#include "cbor.h"
#include "picc/rc522_mifare.h"

#define DEC_KIND_BYTES 32

#define DEC_GET_PICC_MSG_KIND   "get_picc"
#define DEC_READ_BLOCK_MSG_KIND "read_block"

typedef struct
{
    uint8_t address; // Block address
    uint8_t key[RC522_MIFARE_KEY_SIZE];
    uint8_t key_type;
} dec_read_block_msg_t;

CborError dec_kind(const uint8_t *buffer, size_t buffer_size, char *kind, size_t *decoded_len);

CborError dec_read_block(const uint8_t *buffer, size_t buffer_size, dec_read_block_msg_t *read_block_msg);
