#include <stdio.h>
#include <inttypes.h>
#include "esp_wifi.h"
#include "esp_system.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "protocol_examples_common.h"
#include "mqtt_client.h"
#include "cbor.h"

#define MQTT_BROKER_URL "wss://broker.emqx.io:8084/mqtt"
#define MQTT_USERNAME   "emqx"
#define MQTT_PASSWORD   "public"

static const char *TAG = "nfcity";

extern const uint8_t mqtt_emqx_cert_start[] asm("_binary_mqtt_emqx_io_pem_start");
extern const uint8_t mqtt_emqx_cert_end[] asm("_binary_mqtt_emqx_io_pem_end");

#define ENC_HELLO_BYTES 32

static CborError enc_hello(uint8_t *buffer, size_t buffer_len, size_t *encoded_len)
{
    CborEncoder root_enc;
    cbor_encoder_init(&root_enc, buffer, buffer_len, 0);

    CborEncoder map_encoder;
    cbor_encoder_create_map(&root_enc, &map_encoder, 1);
    cbor_encode_text_stringz(&map_encoder, "kind");
    cbor_encode_text_stringz(&map_encoder, "hello");
    cbor_encoder_close_container(&root_enc, &map_encoder);

    *encoded_len = cbor_encoder_get_buffer_size(&root_enc, buffer);

    return CborNoError;
}

static void mqtt_event_handler(void *arg, esp_event_base_t base, int32_t eid, void *data)
{
    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)data;
    ESP_LOGW(TAG, "mqtt event id: %d", event->event_id);
}

static void on_mqtt_connected(void *arg, esp_event_base_t base, int32_t eid, void *data)
{
    ESP_LOGI(TAG, "mqtt connected");
    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)data;

    esp_mqtt_client_subscribe_single(event->client, "/nfcity/7493/web", 0);

    uint8_t buffer[ENC_HELLO_BYTES];
    uint8_t len;
    enc_hello(buffer, sizeof(buffer), (size_t *)&len);

    esp_mqtt_client_publish(event->client, "/nfcity/7493/dev", (char *)buffer, len, 1, 0);
}

static void on_mqtt_data(void *arg, esp_event_base_t base, int32_t eid, void *data)
{
    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)data;

    ESP_LOGI(TAG, "mqtt data (topic=%.*s): %.*s", event->topic_len, event->topic, event->data_len, event->data);
}

void app_main()
{
    ESP_ERROR_CHECK(nvs_flash_init());
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    ESP_ERROR_CHECK(example_connect());

    const esp_mqtt_client_config_t mqtt_cfg = {
        .broker.address.uri = MQTT_BROKER_URL,
        .broker.verification.certificate = (const char *)mqtt_emqx_cert_start,
        .broker.verification.certificate_len = mqtt_emqx_cert_end - mqtt_emqx_cert_start,
        .credentials.username = MQTT_USERNAME,
        .credentials.authentication.password = MQTT_PASSWORD,
    };

    esp_mqtt_client_handle_t client = esp_mqtt_client_init(&mqtt_cfg);

    if (client == NULL) {
        ESP_LOGE(TAG, "Failed to initialize MQTT client");
        return;
    }

    ESP_ERROR_CHECK(esp_mqtt_client_register_event(client, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL));
    ESP_ERROR_CHECK(esp_mqtt_client_register_event(client, MQTT_EVENT_CONNECTED, on_mqtt_connected, NULL));
    ESP_ERROR_CHECK(esp_mqtt_client_register_event(client, MQTT_EVENT_DATA, on_mqtt_data, NULL));

    ESP_ERROR_CHECK(esp_mqtt_client_start(client));
}
