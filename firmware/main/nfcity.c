#include <stdio.h>
#include <inttypes.h>
#include <string.h>
#include "esp_wifi.h"
#include "esp_system.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "protocol_examples_common.h"
#include "mqtt_client.h"
#include "enc.h"
#include "dec.h"
#include "rc522.h"
#include "driver/rc522_spi.h"
#include "rc522_picc.h"

#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"

#define MQTT_BROKER_URL "wss://broker.emqx.io:8084/mqtt"
#define MQTT_USERNAME   "emqx"
#define MQTT_PASSWORD   "public"
#define MQTT_QOS_0      0
#define MQTT_QOS_1      1
#define MQTT_QOS_2      2

#define RC522_SPI_BUS_GPIO_MISO    (21)
#define RC522_SPI_BUS_GPIO_MOSI    (23)
#define RC522_SPI_BUS_GPIO_SCLK    (19)
#define RC522_SPI_SCANNER_GPIO_SDA (22)
#define RC522_SCANNER_GPIO_RST     (18)

static const char *TAG = "nfcity";

extern const uint8_t mqtt_emqx_cert_start[] asm("_binary_mqtt_emqx_io_pem_start");
extern const uint8_t mqtt_emqx_cert_end[] asm("_binary_mqtt_emqx_io_pem_end");

static esp_mqtt_client_handle_t mqtt_client;

static rc522_spi_config_t rc522_driver_config = {
    .host_id = VSPI_HOST,
    .bus_config = &(spi_bus_config_t){
        .miso_io_num = RC522_SPI_BUS_GPIO_MISO,
        .mosi_io_num = RC522_SPI_BUS_GPIO_MOSI,
        .sclk_io_num = RC522_SPI_BUS_GPIO_SCLK,
    },
    .dev_config = {
        .spics_io_num = RC522_SPI_SCANNER_GPIO_SDA,
    },
    .rst_io_num = RC522_SCANNER_GPIO_RST,
};

static rc522_driver_handle_t rc522_driver;
static rc522_handle_t rc522_scanner;

#define MQTT_READY_BIT (BIT0)
static EventGroupHandle_t wait_bits;

static char mqtt_topic_buffer[64] = { 0 };
static char *mqtt_subtopic_ptr = NULL;

// TODO: Check for return values everywhere

static char *mqtt_subtopic(const char *subtopic)
{
    strcpy(mqtt_subtopic_ptr, subtopic);
    return mqtt_topic_buffer;
}

static inline int mqtt_pub(const char *data, int len, int qos)
{
    return esp_mqtt_client_publish(mqtt_client, mqtt_subtopic("dev"), data, len, qos, 0);
}

static void mqtt_event_handler(void *arg, esp_event_base_t base, int32_t id, void *data)
{
    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)data;
    ESP_LOGW(TAG, "mqtt event id: %d", event->event_id);
}

static void on_mqtt_connected(void *arg, esp_event_base_t base, int32_t id, void *data)
{
    ESP_LOGW(TAG, "mqtt connected");
    esp_mqtt_client_subscribe_single(mqtt_client, mqtt_subtopic("web"), MQTT_QOS_0);

    uint8_t buffer[ENC_HELLO_BYTES];
    size_t len;
    enc_hello(buffer, &len);

    mqtt_pub((char *)buffer, len, MQTT_QOS_0);

    xEventGroupSetBits(wait_bits, MQTT_READY_BIT);
}

static void on_picc_state_changed(void *arg, esp_event_base_t base, int32_t event_id, void *data)
{
    rc522_picc_state_changed_event_t *event = (rc522_picc_state_changed_event_t *)data;

    ESP_LOGW(TAG, "picc state changed (state=%d, old_state=%d)", event->picc->state, event->old_state);

    uint8_t buffer[ENC_PICC_STATE_CHANGED_BYTES];
    size_t len;
    enc_picc_state_changed(buffer, event->picc, event->old_state, &len);

    mqtt_pub((char *)buffer, len, MQTT_QOS_0);
}

static esp_err_t handle_message_from_web(const char *kind, const uint8_t *data, size_t data_len)
{
    ESP_LOGW(TAG, "TODO: %s", kind);

    return ESP_OK;
}

static void on_mqtt_data(void *arg, esp_event_base_t base, int32_t eid, void *data)
{
    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)data;

    ESP_LOGW(TAG, "mqtt data (topic=%.*s):", event->topic_len, event->topic);
    ESP_LOG_BUFFER_HEXDUMP(TAG, event->data, event->data_len, ESP_LOG_WARN);

    char kind[DEC_KIND_BYTES];
    size_t len;
    dec_kind((uint8_t *)event->data, event->data_len, kind, &len);

    handle_message_from_web(kind, (uint8_t *)event->data, event->data_len);
}

void app_main()
{
    wait_bits = xEventGroupCreate();

    if (wait_bits == NULL) {
        ESP_LOGE(TAG, "Failed to create event group");
        return;
    }

    xEventGroupClearBits(wait_bits, MQTT_READY_BIT);

    // {{ wifi
    ESP_ERROR_CHECK(nvs_flash_init());
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    ESP_ERROR_CHECK(example_connect());
    // }}

    // {{ mqtt
    const char *mqtt_root_topic = "/nfcity-7493/"; // TODO: Generate random ID
    strcpy(mqtt_topic_buffer, mqtt_root_topic);
    mqtt_subtopic_ptr = mqtt_topic_buffer + strlen(mqtt_topic_buffer);

    const esp_mqtt_client_config_t mqtt_cfg = {
        .broker.address.uri = MQTT_BROKER_URL,
        .broker.verification.certificate = (const char *)mqtt_emqx_cert_start,
        .broker.verification.certificate_len = mqtt_emqx_cert_end - mqtt_emqx_cert_start,
        .credentials.username = MQTT_USERNAME,
        .credentials.authentication.password = MQTT_PASSWORD,
    };

    mqtt_client = esp_mqtt_client_init(&mqtt_cfg);

    if (mqtt_client == NULL) {
        ESP_LOGE(TAG, "Failed to initialize MQTT client");
        return;
    }

    ESP_ERROR_CHECK(esp_mqtt_client_register_event(mqtt_client, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL));
    ESP_ERROR_CHECK(esp_mqtt_client_register_event(mqtt_client, MQTT_EVENT_CONNECTED, on_mqtt_connected, NULL));
    ESP_ERROR_CHECK(esp_mqtt_client_register_event(mqtt_client, MQTT_EVENT_DATA, on_mqtt_data, NULL));

    ESP_ERROR_CHECK(esp_mqtt_client_start(mqtt_client));
    // }}

    xEventGroupWaitBits(wait_bits, MQTT_READY_BIT, pdFALSE, pdTRUE, portMAX_DELAY);

    // {{ rc522
    ESP_ERROR_CHECK(rc522_spi_create(&rc522_driver_config, &rc522_driver));
    ESP_ERROR_CHECK(rc522_driver_install(rc522_driver));

    rc522_config_t rc522_scanner_config = {
        .driver = rc522_driver,
    };

    ESP_ERROR_CHECK(rc522_create(&rc522_scanner_config, &rc522_scanner));
    ESP_ERROR_CHECK(rc522_register_events(rc522_scanner, RC522_EVENT_PICC_STATE_CHANGED, on_picc_state_changed, NULL));
    ESP_ERROR_CHECK(rc522_start(rc522_scanner));
    // }}
}
