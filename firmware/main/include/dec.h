#include "cbor.h"
#include "picc/rc522_mifare.h"

#define DEC_MSG_ID_SIZE   36 // uuid
#define DEC_MSG_KIND_SIZE 32

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

CborError dec_msg_desc(const uint8_t *buffer, size_t buffer_size, dec_msg_desc_t *out_msg_desc);

CborError dec_read_block(const uint8_t *buffer, size_t buffer_size, dec_read_block_msg_t *out_read_block_msg);

CborError dec_read_sector(const uint8_t *buffer, size_t buffer_size, dec_read_sector_msg_t *out_read_sector_msg);
