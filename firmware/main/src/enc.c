#include "enc.h"

// TODO: Check for return values everywhere

CborError enc_message(CborEncoder *encoder, size_t length, const char *kind, CborEncoder *out_message_encoder)
{
    if (length < 1) {
        return -1;
    }

    CborEncoder message_encoder;

    cbor_encoder_create_map(encoder, &message_encoder, length);
    cbor_encode_text_stringz(&message_encoder, "kind");
    cbor_encode_text_stringz(&message_encoder, kind);

    if (out_message_encoder == NULL) {
        cbor_encoder_close_container(encoder, &message_encoder);
    }
    else {
        memcpy(out_message_encoder, &message_encoder, sizeof(CborEncoder));
    }
    return CborNoError;
}

inline CborError enc_hello_message(CborEncoder *encoder)
{
    return enc_message(encoder, 1, ENC_HELLO_MSG_KIND, NULL);
}

CborError enc_picc(CborEncoder *encoder, rc522_picc_t *picc, CborEncoder *out_picc_encoder)
{
    CborEncoder picc_encoder;

    cbor_encoder_create_map(encoder, &picc_encoder, 5);
    cbor_encode_text_stringz(&picc_encoder, "state");
    cbor_encode_int(&picc_encoder, picc->state);
    cbor_encode_text_stringz(&picc_encoder, "uid");
    if (picc->uid.length == 0) {
        cbor_encode_null(&picc_encoder);
    }
    else {
        cbor_encode_byte_string(&picc_encoder, picc->uid.value, picc->uid.length);
    }
    cbor_encode_text_stringz(&picc_encoder, "type");
    cbor_encode_int(&picc_encoder, picc->type);
    cbor_encode_text_stringz(&picc_encoder, "atqa");
    cbor_encode_uint(&picc_encoder, picc->atqa.source);
    cbor_encode_text_stringz(&picc_encoder, "sak");
    cbor_encode_uint(&picc_encoder, picc->sak);

    if (out_picc_encoder == NULL) {
        cbor_encoder_close_container(encoder, &picc_encoder);
    }
    else {
        memcpy(out_picc_encoder, &picc_encoder, sizeof(CborEncoder));
    }

    return CborNoError;
}

CborError enc_picc_message(CborEncoder *encoder, rc522_picc_t *picc)
{
    CborEncoder message_encoder;

    enc_message(encoder, 2, ENC_PICC_MSG_KIND, &message_encoder);
    cbor_encode_text_stringz(&message_encoder, "picc");
    enc_picc(&message_encoder, picc, NULL);
    cbor_encoder_close_container(encoder, &message_encoder);

    return CborNoError;
}

CborError enc_picc_state_changed_message(CborEncoder *encoder, rc522_picc_t *picc, rc522_picc_state_t old_state)
{
    CborEncoder message_encoder;

    enc_message(encoder, 3, ENC_PICC_STATE_CHANGED_MSG_KIND, &message_encoder);
    cbor_encode_text_stringz(&message_encoder, "old_state");
    cbor_encode_int(&message_encoder, old_state);
    cbor_encode_text_stringz(&message_encoder, "picc");
    enc_picc(&message_encoder, picc, NULL);
    cbor_encoder_close_container(encoder, &message_encoder);

    return CborNoError;
}

CborError enc_picc_block(CborEncoder *encoder, uint8_t block_address, uint8_t *data, CborEncoder *out_block_encoder)
{
    CborEncoder block_encoder;

    cbor_encoder_create_map(encoder, &block_encoder, 2);
    cbor_encode_text_stringz(&block_encoder, "address");
    cbor_encode_uint(&block_encoder, block_address);
    cbor_encode_text_stringz(&block_encoder, "data");
    cbor_encode_byte_string(&block_encoder, data, RC522_MIFARE_BLOCK_SIZE);

    if (out_block_encoder == NULL) {
        cbor_encoder_close_container(encoder, &block_encoder);
    }
    else {
        memcpy(out_block_encoder, &block_encoder, sizeof(CborEncoder));
    }
    return CborNoError;
}

CborError enc_picc_block_message(CborEncoder *encoder, uint8_t block_address, uint8_t *data)
{
    CborEncoder message_encoder;

    enc_message(encoder, 2, ENC_PICC_BLOCK_MSG_KIND, &message_encoder);
    cbor_encode_text_stringz(&message_encoder, "block");
    enc_picc_block(&message_encoder, block_address, data, NULL);
    cbor_encoder_close_container(encoder, &message_encoder);

    return CborNoError;
}
