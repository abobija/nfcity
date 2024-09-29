#include "cbor.h"
#include "picc/rc522_mifare.h"

#define DEC_KIND_BYTES     32
#define DEC_MEM_READ_BYTES 128

#define PICC_BLOCK_READ_MSG_KIND "picc_block_read"

typedef struct
{
    uint8_t address; // Block address
    uint8_t key[RC522_MIFARE_KEY_SIZE];
    uint8_t key_type;
} picc_block_read_msg_t;

CborError dec_kind(const uint8_t *buffer, size_t buffer_size, char *kind, size_t *decoded_len);

CborError dec_picc_block_read(const uint8_t *buffer, size_t buffer_size, picc_block_read_msg_t *picc_block_read_msg);
