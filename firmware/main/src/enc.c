#include "enc.h"

// TODO: Check for return values everywhere

CborError enc_hello(uint8_t *buffer, size_t *encoded_len)
{
    CborEncoder root;
    cbor_encoder_init(&root, buffer, ENC_HELLO_BYTES, 0);

    CborEncoder map;
    cbor_encoder_create_map(&root, &map, 1);
    cbor_encode_text_stringz(&map, "kind");
    cbor_encode_text_stringz(&map, ENC_HELLO_MSG_KIND);
    cbor_encoder_close_container(&root, &map);

    *encoded_len = cbor_encoder_get_buffer_size(&root, buffer);

    return CborNoError;
}

CborError enc_picc_state_changed(uint8_t *buffer, rc522_picc_t *picc, rc522_picc_state_t old_state, size_t *encoded_len)
{
    CborEncoder root;
    cbor_encoder_init(&root, buffer, ENC_PICC_STATE_CHANGED_BYTES, 0);

    CborEncoder map;
    cbor_encoder_create_map(&root, &map, 3);

    cbor_encode_text_stringz(&map, "kind");
    cbor_encode_text_stringz(&map, ENC_PICC_STATE_CHANGED_MSG_KIND);

    cbor_encode_text_stringz(&map, "old_state");
    cbor_encode_int(&map, old_state);

    cbor_encode_text_stringz(&map, "picc");
    CborEncoder picc_map;
    cbor_encoder_create_map(&map, &picc_map, 5);

    cbor_encode_text_stringz(&picc_map, "state");
    cbor_encode_int(&picc_map, picc->state);

    cbor_encode_text_stringz(&picc_map, "uid");

    if (picc->uid.length == 0) {
        cbor_encode_null(&picc_map);
    }
    else {
        cbor_encode_byte_string(&picc_map, picc->uid.value, picc->uid.length);
    }

    cbor_encode_text_stringz(&picc_map, "type");
    cbor_encode_int(&picc_map, picc->type);

    cbor_encode_text_stringz(&picc_map, "atqa");
    cbor_encode_uint(&picc_map, picc->atqa.source);

    cbor_encode_text_stringz(&picc_map, "sak");
    cbor_encode_uint(&picc_map, picc->sak);

    cbor_encoder_close_container(&map, &picc_map);
    cbor_encoder_close_container(&root, &map);

    *encoded_len = cbor_encoder_get_buffer_size(&root, buffer);

    return CborNoError;
}

CborError enc_picc_block(uint8_t *buffer, uint8_t block_address, uint8_t *data, size_t *encoded_len)
{
    CborEncoder root;
    cbor_encoder_init(&root, buffer, ENC_PICC_BLOCK_BYTES, 0);

    CborEncoder map;
    cbor_encoder_create_map(&root, &map, 3);
    cbor_encode_text_stringz(&map, "kind");
    cbor_encode_text_stringz(&map, ENC_PICC_BLOCK_MSG_KIND);
    cbor_encode_text_stringz(&map, "address");
    cbor_encode_uint(&map, block_address);
    cbor_encode_text_stringz(&map, "data");
    cbor_encode_byte_string(&map, data, RC522_MIFARE_BLOCK_SIZE);
    cbor_encoder_close_container(&root, &map);

    *encoded_len = cbor_encoder_get_buffer_size(&root, buffer);

    return CborNoError;
}
