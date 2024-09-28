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

static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data)
{
    ESP_LOGD(TAG, "Event dispatched from event loop base=%s, event_id=%" PRIi32, base, event_id);

    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)event_data;

    ESP_LOGI(TAG, "MQTT EVENT ID: %d", event->event_id);
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
    ESP_ERROR_CHECK(esp_mqtt_client_start(client));
}
