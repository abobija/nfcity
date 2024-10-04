#include "msg.h"

// {{ encoding

// TODO: Check for return values everywhere

#define ENC_KIND_LEN 1
static CborError enc_kind(CborEncoder *encoder, const char *kind)
{
    cbor_encode_text_stringz(encoder, MSG_DESC_KIND);
    cbor_encode_text_stringz(encoder, kind);

    return CborNoError;
}

CborError enc_hello_message(CborEncoder *root)
{
    CborEncoder message_map;
    cbor_encoder_create_map(root, &message_map, ENC_KIND_LEN);
    enc_kind(&message_map, ENC_HELLO_MSG_KIND);
    cbor_encoder_close_container(root, &message_map);

    return CborNoError;
}

#define ENC_PICC_LEN 5
static CborError enc_picc(CborEncoder *encoder, rc522_picc_t *picc)
{
    cbor_encode_text_stringz(encoder, "state");
    cbor_encode_int(encoder, picc->state);
    cbor_encode_text_stringz(encoder, "uid");
    if (picc->uid.length == 0) {
        cbor_encode_null(encoder);
    }
    else {
        cbor_encode_byte_string(encoder, picc->uid.value, picc->uid.length);
    }
    cbor_encode_text_stringz(encoder, "type");
    cbor_encode_int(encoder, picc->type);
    cbor_encode_text_stringz(encoder, "atqa");
    cbor_encode_uint(encoder, picc->atqa.source);
    cbor_encode_text_stringz(encoder, "sak");
    cbor_encode_uint(encoder, picc->sak);

    return CborNoError;
}

CborError enc_picc_message(CborEncoder *root, rc522_picc_t *picc)
{
    CborEncoder message_map;
    cbor_encoder_create_map(root, &message_map, ENC_KIND_LEN + 1);
    enc_kind(&message_map, ENC_PICC_MSG_KIND);
    cbor_encode_text_stringz(&message_map, "picc");
    CborEncoder picc_map;
    cbor_encoder_create_map(&message_map, &picc_map, ENC_PICC_LEN);
    enc_picc(&picc_map, picc);
    cbor_encoder_close_container(&message_map, &picc_map);
    cbor_encoder_close_container(root, &message_map);

    return CborNoError;
}

CborError enc_picc_state_changed_message(CborEncoder *root, rc522_picc_t *picc, rc522_picc_state_t old_state)
{
    CborEncoder message_map;
    cbor_encoder_create_map(root, &message_map, ENC_KIND_LEN + 2);
    enc_kind(&message_map, ENC_PICC_STATE_CHANGED_MSG_KIND);
    cbor_encode_text_stringz(&message_map, "old_state");
    cbor_encode_int(&message_map, old_state);
    cbor_encode_text_stringz(&message_map, "picc");
    CborEncoder picc_map;
    cbor_encoder_create_map(&message_map, &picc_map, ENC_PICC_LEN);
    enc_picc(&picc_map, picc);
    cbor_encoder_close_container(&message_map, &picc_map);
    cbor_encoder_close_container(root, &message_map);

    return CborNoError;
}

#define ENC_PICC_BLOCK_LEN 3
static CborError enc_picc_block(CborEncoder *encoder, uint8_t address, uint8_t offset, uint8_t *data)
{
    cbor_encode_text_stringz(encoder, "address");
    cbor_encode_uint(encoder, address);
    cbor_encode_text_stringz(encoder, "offset");
    cbor_encode_uint(encoder, offset);
    cbor_encode_text_stringz(encoder, "data");
    cbor_encode_byte_string(encoder, data, RC522_MIFARE_BLOCK_SIZE);

    return CborNoError;
}

CborError enc_picc_block_message(CborEncoder *root, uint8_t address, uint8_t offset, uint8_t *data)
{
    CborEncoder message_map;
    cbor_encoder_create_map(root, &message_map, ENC_KIND_LEN + 1);
    enc_kind(&message_map, ENC_PICC_BLOCK_MSG_KIND);
    cbor_encode_text_stringz(&message_map, "block");
    CborEncoder block_map;
    cbor_encoder_create_map(&message_map, &block_map, ENC_PICC_BLOCK_LEN);
    enc_picc_block(&block_map, address, offset, data);
    cbor_encoder_close_container(&message_map, &block_map);
    cbor_encoder_close_container(root, &message_map);

    return CborNoError;
}

CborError enc_picc_sector_message(
    CborEncoder *root, uint8_t sector_offset, uint8_t sector_block_0_address, uint8_t *sector_data)
{
    CborEncoder message_map;
    cbor_encoder_create_map(root, &message_map, ENC_KIND_LEN + 2);
    enc_kind(&message_map, ENC_PICC_SECTOR_MSG_KIND);
    cbor_encode_text_stringz(&message_map, "offset");
    cbor_encode_uint(&message_map, sector_offset);
    cbor_encode_text_stringz(&message_map, "blocks");
    CborEncoder blocks_array;
    cbor_encoder_create_array(&message_map, &blocks_array, 4); // FIXME: for mifare 4k
    for (uint8_t i = 0; i < 4; i++) {                          // FIXME: for mifare 4k
        CborEncoder block_map;
        cbor_encoder_create_map(&blocks_array, &block_map, ENC_PICC_BLOCK_LEN);
        enc_picc_block(&block_map, sector_block_0_address + i, i, sector_data + (i * RC522_MIFARE_BLOCK_SIZE));
        cbor_encoder_close_container(&blocks_array, &block_map);
    }
    cbor_encoder_close_container(&message_map, &blocks_array);
    cbor_encoder_close_container(root, &message_map);

    return CborNoError;
}

// }} encoding

// {{ decoding

// TODO: Check for return values everywhere

static CborError cbor_value_get_uint8(CborValue *value, uint8_t *result)
{
    uint64_t _result;
    CborError err = cbor_value_get_uint64(value, &_result);

    if (err != CborNoError) {
        return err;
    }

    if (_result > UINT8_MAX) {
        return CborErrorDataTooLarge;
    }

    *result = (uint8_t)_result;

    return CborNoError;
}

CborError dec_msg(const uint8_t *buffer, size_t buffer_size, web_msg_t *out_msg)
{
    web_msg_t msg = { 0 };

    CborParser parser;
    CborValue it;
    CBOR_ERRCHECK(cbor_parser_init(buffer, buffer_size, 0, &parser, &it));
    CborValue value;
    CBOR_ERRCHECK(cbor_value_map_find_value(&it, MSG_DESC_ID, &value));
    CBOR_RETCHECK(cbor_value_is_text_string(&value), CborErrorIllegalType);
    size_t len = 0;
    CBOR_ERRCHECK(cbor_value_get_string_length(&value, &len));
    CBOR_RETCHECK(len <= sizeof(msg.id) - 1, CborErrorOverlongEncoding);
    CBOR_ERRCHECK(cbor_value_copy_text_string(&value, msg.id, &len, NULL));
    CBOR_ERRCHECK(cbor_value_map_find_value(&it, MSG_DESC_KIND, &value));
    CBOR_RETCHECK(cbor_value_is_text_string(&value), CborErrorIllegalType);
    CBOR_ERRCHECK(cbor_value_get_string_length(&value, &len));
    CBOR_RETCHECK(len <= sizeof(msg.kind) - 1, CborErrorOverlongEncoding);
    CBOR_ERRCHECK(cbor_value_copy_text_string(&value, msg.kind, &len, NULL));

    memcpy(out_msg, &msg, sizeof(msg));

    return CborNoError;
}

static CborError dec_key(const CborValue *key_map, msg_picc_key_t *out_key)
{
    CborValue value;
    cbor_value_map_find_value(key_map, "value", &value);

    size_t len = 0;
    cbor_value_get_string_length(&value, &len);

    if (len != RC522_MIFARE_KEY_SIZE) {
        return CborErrorUnknownLength;
    }

    msg_picc_key_t key = { 0 };

    cbor_value_copy_byte_string(&value, key.value, &len, NULL);
    cbor_value_map_find_value(key_map, "type", &value);
    cbor_value_get_uint8(&value, (uint8_t *)&key.type);

    memcpy(out_key, &key, sizeof(key));

    return CborNoError;
}

CborError dec_read_sector_msg(const uint8_t *buffer, size_t buffer_size, web_read_sector_msg_t *out_read_sector_msg)
{
    CborParser parser;
    CborValue it;
    cbor_parser_init(buffer, buffer_size, 0, &parser, &it);

    web_read_sector_msg_t msg = { 0 };

    CborValue value;
    cbor_value_map_find_value(&it, "offset", &value);
    cbor_value_get_uint8(&value, &msg.offset);
    cbor_value_map_find_value(&it, "key", &value);
    dec_key(&value, &msg.key);

    memcpy(out_read_sector_msg, &msg, sizeof(msg));

    return CborNoError;
}

// }} decoding
