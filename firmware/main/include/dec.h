#include "cbor.h"
#include "picc/rc522_mifare.h"

#define DEC_KIND_BYTES     32
#define DEC_MEM_READ_BYTES 128

typedef struct
{
    uint8_t block_addr;
    uint8_t key[RC522_MIFARE_KEY_SIZE];
    uint8_t key_type;
} mem_read_msg_t;

CborError dec_kind(const uint8_t *buffer, size_t buffer_size, char *kind, size_t *decoded_len);

CborError dec_mem_read(const uint8_t *buffer, size_t buffer_size, mem_read_msg_t *mem_read_msg);
