#include "msg.h"

// {{ decoding

struct
{
    const char *kind_str;
    web_msg_kind_t kind;
} static web_msg_kind_map[] = {
    { "ping", WEB_MSG_PING },
    { "get_picc", WEB_MSG_GET_PICC },
    { "read_sector", WEB_MSG_READ_SECTOR },
    { "write_block", WEB_MSG_WRITE_BLOCK },
};

static void dec_map_kind(const char *kind_str, web_msg_kind_t *out_kind)
{
    uint8_t entry_count = sizeof(web_msg_kind_map) / sizeof(web_msg_kind_map[0]);

    for (uint8_t i = 0; i < entry_count; i++) {
        if (strcmp(kind_str, web_msg_kind_map[i].kind_str) == 0) {
            *out_kind = web_msg_kind_map[i].kind;
            return;
        }
    }

    *out_kind = WEB_MSG_UNKNOWN;
}

static CborError cbor_value_get_uint8(CborValue *value, uint8_t *out_result)
{
    uint64_t result;

    CBOR_ERRCHECK(cbor_value_get_uint64(value, &result));
    CBOR_RETCHECK(result <= UINT8_MAX, CborErrorDataTooLarge);

    *out_result = (uint8_t)result;
    return CborNoError;
}

CborError dec_msg(const uint8_t *buffer, size_t buffer_size, web_msg_t *out_msg)
{
    web_msg_t msg = { 0 };

    CborParser parser;
    CborValue it;
    CBOR_ERRCHECK(cbor_parser_init(buffer, buffer_size, 0, &parser, &it));
    CborValue value;
    CBOR_ERRCHECK(cbor_value_map_find_value(&it, MSG_ID_FIELD, &value));
    CBOR_RETCHECK(cbor_value_is_text_string(&value), CborErrorIllegalType);
    size_t len = 0;
    CBOR_ERRCHECK(cbor_value_get_string_length(&value, &len));
    CBOR_RETCHECK(len <= sizeof(msg.id) - 1, CborErrorOverlongEncoding);
    CBOR_ERRCHECK(cbor_value_copy_text_string(&value, msg.id, &len, NULL));
    char kind_str[32] = { 0 };
    CBOR_ERRCHECK(cbor_value_map_find_value(&it, MSG_KIND_FIELD, &value));
    CBOR_RETCHECK(cbor_value_is_text_string(&value), CborErrorIllegalType);
    CBOR_ERRCHECK(cbor_value_get_string_length(&value, &len));
    CBOR_RETCHECK(len <= sizeof(kind_str) - 1, CborErrorOverlongEncoding);
    CBOR_ERRCHECK(cbor_value_copy_text_string(&value, kind_str, &len, NULL));
    dec_map_kind(kind_str, &msg.kind);

    memcpy(out_msg, &msg, sizeof(msg));
    return CborNoError;
}

static CborError dec_picc_key(const CborValue *key_map, msg_picc_key_t *out_key)
{
    msg_picc_key_t key = { 0 };

    CborValue value;
    CBOR_ERRCHECK(cbor_value_map_find_value(key_map, "value", &value));
    CBOR_RETCHECK(cbor_value_is_byte_string(&value), CborErrorIllegalType);
    size_t len = 0;
    CBOR_ERRCHECK(cbor_value_get_string_length(&value, &len));
    CBOR_RETCHECK(len == RC522_MIFARE_KEY_SIZE, CborErrorUnknownLength);
    CBOR_ERRCHECK(cbor_value_copy_byte_string(&value, key.value, &len, NULL));
    CBOR_ERRCHECK(cbor_value_map_find_value(key_map, "type", &value));
    CBOR_RETCHECK(cbor_value_is_unsigned_integer(&value), CborErrorIllegalType);
    CBOR_ERRCHECK(cbor_value_get_uint8(&value, (uint8_t *)&key.type));

    memcpy(out_key, &key, sizeof(key));
    return CborNoError;
}

CborError dec_read_sector_msg(const uint8_t *buffer, size_t buffer_size, web_read_sector_msg_t *out_read_sector_msg)
{
    web_read_sector_msg_t msg = { 0 };

    CborParser parser;
    CborValue it;
    CBOR_ERRCHECK(cbor_parser_init(buffer, buffer_size, 0, &parser, &it));
    CborValue value;
    CBOR_ERRCHECK(cbor_value_map_find_value(&it, "offset", &value));
    CBOR_RETCHECK(cbor_value_is_unsigned_integer(&value), CborErrorIllegalType);
    CBOR_ERRCHECK(cbor_value_get_uint8(&value, &msg.offset));
    CBOR_ERRCHECK(cbor_value_map_find_value(&it, "key", &value));
    CBOR_RETCHECK(cbor_value_is_map(&value), CborErrorIllegalType);
    CBOR_ERRCHECK(dec_picc_key(&value, &msg.key));

    memcpy(out_read_sector_msg, &msg, sizeof(msg));
    return CborNoError;
}

CborError dec_write_block_msg(const uint8_t *buffer, size_t buffer_size, web_write_block_msg_t *out_write_block_msg)
{
    web_write_block_msg_t msg = { 0 };

    CborParser parser;
    CborValue it;
    CBOR_ERRCHECK(cbor_parser_init(buffer, buffer_size, 0, &parser, &it));
    CborValue value;
    CBOR_ERRCHECK(cbor_value_map_find_value(&it, "address", &value));
    CBOR_RETCHECK(cbor_value_is_unsigned_integer(&value), CborErrorIllegalType);
    CBOR_ERRCHECK(cbor_value_get_uint8(&value, &msg.address));
    CBOR_ERRCHECK(cbor_value_map_find_value(&it, "data", &value));
    CBOR_RETCHECK(cbor_value_is_byte_string(&value), CborErrorIllegalType);
    size_t len = 0;
    CBOR_ERRCHECK(cbor_value_get_string_length(&value, &len));
    CBOR_RETCHECK(len == RC522_MIFARE_BLOCK_SIZE, CborErrorUnknownLength);
    CBOR_ERRCHECK(cbor_value_copy_byte_string(&value, msg.data, &len, NULL));
    CBOR_ERRCHECK(cbor_value_map_find_value(&it, "key", &value));
    CBOR_RETCHECK(cbor_value_is_map(&value), CborErrorIllegalType);
    CBOR_ERRCHECK(dec_picc_key(&value, &msg.key));

    memcpy(out_write_block_msg, &msg, sizeof(msg));
    return CborNoError;
}

// }} decoding

// {{ encoding

#define ENC_KIND_LEN 1
static CborError enc_kind(CborEncoder *encoder, const char *kind)
{
    CBOR_ERRCHECK(cbor_encode_text_stringz(encoder, MSG_KIND_FIELD));
    CBOR_ERRCHECK(cbor_encode_text_stringz(encoder, kind));

    return CborNoError;
}

#define ENC_CTX_LEN     1
#define ENC_CTX_MAP_LEN 1
static CborError enc_ctx(CborEncoder *encoder, web_msg_t *ctx)
{
    CBOR_ERRCHECK(cbor_encode_text_stringz(encoder, MSG_CTX_FIELD));

    CborEncoder ctx_map;

    CBOR_ERRCHECK(cbor_encoder_create_map(encoder, &ctx_map, ENC_CTX_MAP_LEN));
    CBOR_ERRCHECK(cbor_encode_text_stringz(&ctx_map, MSG_ID_FIELD));
    CBOR_ERRCHECK(cbor_encode_text_stringz(&ctx_map, ctx->id));
    CBOR_ERRCHECK(cbor_encoder_close_container(encoder, &ctx_map));

    return CborNoError;
}

CborError enc_hello_message(CborEncoder *root)
{
    CborEncoder message_map;

    CBOR_ERRCHECK(cbor_encoder_create_map(root, &message_map, ENC_KIND_LEN));
    CBOR_ERRCHECK(enc_kind(&message_map, ENC_HELLO_MSG_KIND));
    CBOR_ERRCHECK(cbor_encoder_close_container(root, &message_map));

    return CborNoError;
}

CborError enc_error_message(web_msg_t *ctx, CborEncoder *encoder, int64_t error_code)
{
    CborEncoder message_map;

    size_t message_map_len = ENC_KIND_LEN + 1;
    if (ctx != NULL) {
        message_map_len += ENC_CTX_LEN;
    }
    CBOR_ERRCHECK(cbor_encoder_create_map(encoder, &message_map, message_map_len));
    CBOR_ERRCHECK(enc_kind(&message_map, ENC_ERROR_MSG_KIND));
    if (ctx != NULL) {
        CBOR_ERRCHECK(enc_ctx(&message_map, ctx));
    }
    CBOR_ERRCHECK(cbor_encode_text_stringz(&message_map, "code"));
    CBOR_ERRCHECK(cbor_encode_int(&message_map, error_code));
    CBOR_ERRCHECK(cbor_encoder_close_container(encoder, &message_map));

    return CborNoError;
}

CborError enc_pong_message(web_msg_t *ctx, CborEncoder *encoder)
{
    CborEncoder message_map;

    CBOR_ERRCHECK(cbor_encoder_create_map(encoder, &message_map, ENC_KIND_LEN + ENC_CTX_LEN));
    CBOR_ERRCHECK(enc_kind(&message_map, ENC_PONG_MSG_KIND));
    CBOR_ERRCHECK(enc_ctx(&message_map, ctx));
    CBOR_ERRCHECK(cbor_encoder_close_container(encoder, &message_map));

    return CborNoError;
}

#define ENC_PICC_LEN 5
static CborError enc_picc(CborEncoder *encoder, rc522_picc_t *picc)
{
    CBOR_ERRCHECK(cbor_encode_text_stringz(encoder, "state"));
    CBOR_ERRCHECK(cbor_encode_int(encoder, picc->state));
    CBOR_ERRCHECK(cbor_encode_text_stringz(encoder, "uid"));
    if (picc->uid.length == 0) {
        CBOR_ERRCHECK(cbor_encode_null(encoder));
    }
    else {
        CBOR_ERRCHECK(cbor_encode_byte_string(encoder, picc->uid.value, picc->uid.length));
    }
    CBOR_ERRCHECK(cbor_encode_text_stringz(encoder, "type"));
    CBOR_ERRCHECK(cbor_encode_int(encoder, picc->type));
    CBOR_ERRCHECK(cbor_encode_text_stringz(encoder, "atqa"));
    CBOR_ERRCHECK(cbor_encode_uint(encoder, picc->atqa.source));
    CBOR_ERRCHECK(cbor_encode_text_stringz(encoder, "sak"));
    CBOR_ERRCHECK(cbor_encode_uint(encoder, picc->sak));

    return CborNoError;
}

CborError enc_picc_message(web_msg_t *ctx, CborEncoder *root, rc522_picc_t *picc)
{
    CborEncoder message_map;

    CBOR_ERRCHECK(cbor_encoder_create_map(root, &message_map, ENC_KIND_LEN + ENC_CTX_LEN + 1));
    CBOR_ERRCHECK(enc_kind(&message_map, ENC_PICC_MSG_KIND));
    CBOR_ERRCHECK(enc_ctx(&message_map, ctx));
    CBOR_ERRCHECK(cbor_encode_text_stringz(&message_map, "picc"));
    CborEncoder picc_map;
    CBOR_ERRCHECK(cbor_encoder_create_map(&message_map, &picc_map, ENC_PICC_LEN));
    CBOR_ERRCHECK(enc_picc(&picc_map, picc));
    CBOR_ERRCHECK(cbor_encoder_close_container(&message_map, &picc_map));
    CBOR_ERRCHECK(cbor_encoder_close_container(root, &message_map));

    return CborNoError;
}

CborError enc_picc_state_changed_message(CborEncoder *root, rc522_picc_t *picc, rc522_picc_state_t old_state)
{
    CborEncoder message_map;

    CBOR_ERRCHECK(cbor_encoder_create_map(root, &message_map, ENC_KIND_LEN + 2));
    CBOR_ERRCHECK(enc_kind(&message_map, ENC_PICC_STATE_CHANGED_MSG_KIND));
    CBOR_ERRCHECK(cbor_encode_text_stringz(&message_map, "old_state"));
    CBOR_ERRCHECK(cbor_encode_int(&message_map, old_state));
    CBOR_ERRCHECK(cbor_encode_text_stringz(&message_map, "picc"));
    CborEncoder picc_map;
    CBOR_ERRCHECK(cbor_encoder_create_map(&message_map, &picc_map, ENC_PICC_LEN));
    CBOR_ERRCHECK(enc_picc(&picc_map, picc));
    CBOR_ERRCHECK(cbor_encoder_close_container(&message_map, &picc_map));
    CBOR_ERRCHECK(cbor_encoder_close_container(root, &message_map));

    return CborNoError;
}

#define ENC_PICC_BLOCK_LEN 2
static CborError enc_picc_block(CborEncoder *encoder, uint8_t address, uint8_t *data)
{
    CBOR_ERRCHECK(cbor_encode_text_stringz(encoder, "address"));
    CBOR_ERRCHECK(cbor_encode_uint(encoder, address));
    CBOR_ERRCHECK(cbor_encode_text_stringz(encoder, "data"));
    CBOR_ERRCHECK(cbor_encode_byte_string(encoder, data, RC522_MIFARE_BLOCK_SIZE));

    return CborNoError;
}

CborError enc_picc_sector_message(
    web_msg_t *ctx, CborEncoder *root, rc522_mifare_sector_desc_t *sector_desc, uint8_t *sector_data)
{
    CborEncoder message_map;

    CBOR_ERRCHECK(cbor_encoder_create_map(root, &message_map, ENC_KIND_LEN + ENC_CTX_LEN + 2));
    CBOR_ERRCHECK(enc_kind(&message_map, ENC_PICC_SECTOR_MSG_KIND));
    CBOR_ERRCHECK(enc_ctx(&message_map, ctx));
    CBOR_ERRCHECK(cbor_encode_text_stringz(&message_map, "offset"));
    CBOR_ERRCHECK(cbor_encode_uint(&message_map, sector_desc->index));
    CBOR_ERRCHECK(cbor_encode_text_stringz(&message_map, "blocks"));
    CborEncoder blocks_array;
    CBOR_ERRCHECK(cbor_encoder_create_array(&message_map, &blocks_array, sector_desc->number_of_blocks));
    for (uint8_t i = 0; i < sector_desc->number_of_blocks; i++) {
        CborEncoder block_map;
        CBOR_ERRCHECK(cbor_encoder_create_map(&blocks_array, &block_map, ENC_PICC_BLOCK_LEN));
        CBOR_ERRCHECK(
            enc_picc_block(&block_map, sector_desc->block_0_address + i, sector_data + (i * RC522_MIFARE_BLOCK_SIZE)));
        CBOR_ERRCHECK(cbor_encoder_close_container(&blocks_array, &block_map));
    }
    CBOR_ERRCHECK(cbor_encoder_close_container(&message_map, &blocks_array));
    CBOR_ERRCHECK(cbor_encoder_close_container(root, &message_map));

    return CborNoError;
}

CborError enc_picc_block_message(web_msg_t *ctx, CborEncoder *encoder, uint8_t address, uint8_t *data)
{
    CborEncoder message_map;

    CBOR_ERRCHECK(cbor_encoder_create_map(encoder, &message_map, ENC_KIND_LEN + ENC_CTX_LEN + ENC_PICC_BLOCK_LEN));
    CBOR_ERRCHECK(enc_kind(&message_map, ENC_PICC_BLOCK_MSG_KIND));
    CBOR_ERRCHECK(enc_ctx(&message_map, ctx));
    CBOR_ERRCHECK(enc_picc_block(&message_map, address, data));
    CBOR_ERRCHECK(cbor_encoder_close_container(encoder, &message_map));

    return CborNoError;
}

// }} encoding
