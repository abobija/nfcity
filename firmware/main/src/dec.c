#include "dec.h"

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

CborError dec_kind(const uint8_t *buffer, size_t buffer_size, char *kind, size_t *decoded_len)
{
    CborParser parser;
    CborValue it;
    cbor_parser_init(buffer, buffer_size, 0, &parser, &it);

    CborValue value;
    cbor_value_map_find_value(&it, "kind", &value);

    cbor_value_copy_text_string(&value, kind, decoded_len, NULL);

    return CborNoError;
}

CborError dec_read_block(const uint8_t *buffer, size_t buffer_size, dec_read_block_msg_t *read_block_msg)
{
    CborParser parser;
    CborValue it;
    cbor_parser_init(buffer, buffer_size, 0, &parser, &it);

    dec_read_block_msg_t _read_block_msg = { 0 };

    CborValue value;
    cbor_value_map_find_value(&it, "address", &value);
    cbor_value_get_uint8(&value, &_read_block_msg.address);

    cbor_value_map_find_value(&it, "key", &value);

    size_t len = 0;
    cbor_value_get_string_length(&value, &len);

    if (len != RC522_MIFARE_KEY_SIZE) {
        return CborErrorUnknownLength;
    }

    cbor_value_copy_byte_string(&value, _read_block_msg.key, &len, NULL);

    cbor_value_map_find_value(&it, "key_type", &value);
    cbor_value_get_uint8(&value, &_read_block_msg.key_type);

    memcpy(read_block_msg, &_read_block_msg, sizeof(dec_read_block_msg_t));

    return CborNoError;
}
