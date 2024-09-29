#include "enc.h"

// TODO: Check for return values everywhere

CborError enc_hello(uint8_t *buffer, size_t buffer_len, size_t *encoded_len)
{
    CborEncoder root;
    cbor_encoder_init(&root, buffer, buffer_len, 0);

    CborEncoder map;
    cbor_encoder_create_map(&root, &map, 1);
    cbor_encode_text_stringz(&map, "kind");
    cbor_encode_text_stringz(&map, "hello");
    cbor_encoder_close_container(&root, &map);

    *encoded_len = cbor_encoder_get_buffer_size(&root, buffer);

    return CborNoError;
}
