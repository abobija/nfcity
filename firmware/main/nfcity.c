#include <stdio.h>
#include <inttypes.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "esp_wifi.h"
#include "esp_system.h"
#include "esp_check.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "protocol_examples_common.h"
#include "mqtt_client.h"
#include "msg.h"
#include "rc522.h"
#include "driver/rc522_spi.h"
#include "picc/rc522_mifare.h"

#define MQTT_READY_BIT BIT0

#define MQTT_BROKER_URL   "wss://broker.emqx.io:8084/mqtt"
#define MQTT_USERNAME     "emqx"
#define MQTT_PASSWORD     "public"
#define MQTT_QOS_0        0
#define MQTT_QOS_1        1
#define MQTT_QOS_2        2
#define MQTT_DEV_SUBTOPIC "dev"
#define MQTT_WEB_SUBTOPIC "web"

#define RC522_SPI_BUS_GPIO_MISO    21
#define RC522_SPI_BUS_GPIO_MOSI    23
#define RC522_SPI_BUS_GPIO_SCLK    19
#define RC522_SPI_SCANNER_GPIO_SDA 22
#define RC522_SCANNER_GPIO_RST     18

static const char *TAG = "nfcity";

extern const uint8_t mqtt_emqx_cert_start[] asm("_binary_mqtt_emqx_io_pem_start");
extern const uint8_t mqtt_emqx_cert_end[] asm("_binary_mqtt_emqx_io_pem_end");

static esp_mqtt_client_handle_t mqtt_client;
static SemaphoreHandle_t rc522_task_mutex;
static rc522_driver_handle_t rc522_driver;
static rc522_handle_t rc522_scanner;
static EventGroupHandle_t wait_bits;
static char mqtt_topic_buffer[64] = { 0 };
static char *mqtt_subtopic_ptr = NULL;
static rc522_picc_t picc = { 0 };

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

// TODO: Check for return values everywhere

static char *mqtt_subtopic(const char *subtopic)
{
    strcpy(mqtt_subtopic_ptr, subtopic);
    return mqtt_topic_buffer;
}

static inline int mqtt_pub(const uint8_t *data, int len, int qos)
{
    return esp_mqtt_client_publish(mqtt_client, mqtt_subtopic(MQTT_DEV_SUBTOPIC), (char *)data, len, qos, 0);
}

static void mqtt_event_handler(void *arg, esp_event_base_t base, int32_t id, void *data)
{
    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)data;
    ESP_LOGW(TAG, "mqtt event id: %d", event->event_id);
}

static void on_mqtt_connected(void *arg, esp_event_base_t base, int32_t id, void *data)
{
    ESP_LOGW(TAG, "mqtt connected");
    esp_mqtt_client_subscribe_single(mqtt_client, mqtt_subtopic(MQTT_WEB_SUBTOPIC), MQTT_QOS_0);

    uint8_t buffer[ENC_HELLO_BYTES] = { 0 };
    CborEncoder root = { 0 };
    cbor_encoder_init(&root, buffer, ENC_HELLO_BYTES, 0);
    enc_hello_message(&root);
    size_t len = cbor_encoder_get_buffer_size(&root, buffer);

    mqtt_pub(buffer, len, MQTT_QOS_0);

    xEventGroupSetBits(wait_bits, MQTT_READY_BIT);
}

static void on_picc_state_changed(void *arg, esp_event_base_t base, int32_t event_id, void *data)
{
    rc522_picc_state_changed_event_t *event = (rc522_picc_state_changed_event_t *)data;

    ESP_LOGW(TAG, "picc state changed (state=%d, old_state=%d)", event->picc->state, event->old_state);

    memcpy(&picc, event->picc, sizeof(rc522_picc_t));

    uint8_t buffer[ENC_PICC_STATE_CHANGED_BYTES] = { 0 };
    CborEncoder root = { 0 };
    cbor_encoder_init(&root, buffer, ENC_PICC_STATE_CHANGED_BYTES, 0);
    enc_picc_state_changed_message(&root, &picc, event->old_state);
    size_t len = cbor_encoder_get_buffer_size(&root, buffer);

    mqtt_pub(buffer, len, MQTT_QOS_0);
}

static esp_err_t read_block(dec_read_block_msg_t *msg, uint8_t buffer[RC522_MIFARE_BLOCK_SIZE])
{
    ESP_LOGW(TAG,
        "read_block (block_addr=%d, key_type=%d, key: %.*s)",
        msg->address,
        msg->key.type,
        RC522_MIFARE_KEY_SIZE,
        msg->key.value);

    if (picc.state != RC522_PICC_STATE_ACTIVE && picc.state != RC522_PICC_STATE_ACTIVE_H) {
        ESP_LOGW(TAG, "cannot read memory. picc is not active");
        return ESP_FAIL;
    }

    if (xSemaphoreTake(rc522_task_mutex, pdMS_TO_TICKS(1000)) != pdTRUE) {
        ESP_LOGE(TAG, "Failed to take mutex");
        return ESP_FAIL;
    }

    rc522_mifare_key_t key = {
        .type = msg->key.type,
    };

    memcpy(key.value, msg->key.value, RC522_MIFARE_KEY_SIZE);

    esp_err_t ret = ESP_OK;

    ESP_GOTO_ON_ERROR(rc522_mifare_auth(rc522_scanner, &picc, msg->address, &key), _exit, TAG, "auth failed");
    ESP_GOTO_ON_ERROR(rc522_mifare_read(rc522_scanner, &picc, msg->address, buffer), _exit, TAG, "read failed");

    ESP_LOGW(TAG, "data at block %d:", msg->address);
    ESP_LOG_BUFFER_HEXDUMP(TAG, buffer, RC522_MIFARE_BLOCK_SIZE, ESP_LOG_WARN);
_exit:
    rc522_mifare_deauth(rc522_scanner, &picc);
    xSemaphoreGive(rc522_task_mutex);

    return ret;
}

static esp_err_t read_sector(
    dec_read_sector_msg_t *msg, uint8_t buffer[4 * RC522_MIFARE_BLOCK_SIZE] /* FIXME: for mifare 4k  */)
{
    ESP_LOGW(TAG,
        "TODO: read_sector (offset=%d, key_type=%d, key: %.*s)",
        msg->offset,
        msg->key.type,
        RC522_MIFARE_KEY_SIZE,
        msg->key.value);

    if (picc.state != RC522_PICC_STATE_ACTIVE && picc.state != RC522_PICC_STATE_ACTIVE_H) {
        ESP_LOGW(TAG, "cannot read memory. picc is not active");
        return ESP_FAIL;
    }

    if (xSemaphoreTake(rc522_task_mutex, pdMS_TO_TICKS(1000)) != pdTRUE) {
        ESP_LOGE(TAG, "Failed to take mutex");
        return ESP_FAIL;
    }

    rc522_mifare_key_t key = {
        .type = msg->key.type,
    };

    memcpy(key.value, msg->key.value, RC522_MIFARE_KEY_SIZE);

    esp_err_t ret = ESP_OK;

    rc522_mifare_sector_desc_t sector_desc = { 0 };
    rc522_mifare_get_sector_desc(msg->offset, &sector_desc);
    ESP_GOTO_ON_ERROR(rc522_mifare_auth_sector(rc522_scanner, &picc, &sector_desc, &key), _exit, TAG, "auth failed");

    for (uint8_t i = 0; i < 4; i++) { // FIXME: for mifare 4k
        uint8_t block_addr = sector_desc.block_0_address + i;
        uint8_t *buffer_ptr = buffer + (i * RC522_MIFARE_BLOCK_SIZE);

        ESP_GOTO_ON_ERROR(rc522_mifare_read(rc522_scanner, &picc, block_addr, buffer_ptr), _exit, TAG, "read failed");

        ESP_LOGW(TAG, "data at block %d:", block_addr);
        ESP_LOG_BUFFER_HEXDUMP(TAG, buffer_ptr, RC522_MIFARE_BLOCK_SIZE, ESP_LOG_WARN);
    }
_exit:
    rc522_mifare_deauth(rc522_scanner, &picc);
    xSemaphoreGive(rc522_task_mutex);

    return ret;
}

static esp_err_t handle_message_from_web(const char *kind, const uint8_t *data, size_t data_len)
{
    if (strcmp(kind, DEC_GET_PICC_MSG_KIND) == 0) {
        uint8_t buffer[ENC_PICC_BYTES] = { 0 };
        CborEncoder root = { 0 };
        cbor_encoder_init(&root, buffer, ENC_PICC_BYTES, 0);
        enc_picc_message(&root, &picc);
        size_t len = cbor_encoder_get_buffer_size(&root, buffer);

        mqtt_pub(buffer, len, MQTT_QOS_0);

        return ESP_OK;
    }
    else if (strcmp(kind, DEC_READ_BLOCK_MSG_KIND) == 0) {
        dec_read_block_msg_t msg = { 0 };
        dec_read_block(data, data_len, &msg);
        uint8_t block_buffer[RC522_MIFARE_BLOCK_SIZE] = { 0 };
        if (read_block(&msg, block_buffer) == ESP_OK) {
            uint8_t sector_offset = rc522_mifare_get_sector_index_by_block_address(msg.address);
            uint8_t sector_block_0_address = 0;
            rc522_mifare_get_sector_block_0_address(sector_offset, &sector_block_0_address);
            uint8_t offset = msg.address - sector_block_0_address;
            CborEncoder root = { 0 };
            uint8_t buffer[ENC_PICC_BLOCK_BYTES] = { 0 };
            cbor_encoder_init(&root, buffer, sizeof(buffer), 0);
            enc_picc_block_message(&root, msg.address, offset, block_buffer);
            size_t len = cbor_encoder_get_buffer_size(&root, buffer);
            mqtt_pub(buffer, len, MQTT_QOS_0);
        }

        return ESP_OK;
    }
    else if (strcmp(kind, DEC_READ_SECTOR_MSG_KIND) == 0) {
        dec_read_sector_msg_t msg = { 0 };
        dec_read_sector(data, data_len, &msg);
        uint8_t sector_buffer[4 * RC522_MIFARE_BLOCK_SIZE] = { 0 }; // FIXME: for mifare 4k
        if (read_sector(&msg, sector_buffer) == ESP_OK) {
            uint8_t sector_block_0_address = 0;
            rc522_mifare_get_sector_block_0_address(msg.offset, &sector_block_0_address);
            CborEncoder root = { 0 };
            uint8_t buffer[ENC_PICC_SECTOR_BYTES] = { 0 };
            cbor_encoder_init(&root, buffer, sizeof(buffer), 0);
            enc_picc_sector_message(&root, msg.offset, sector_block_0_address, sector_buffer);
            size_t len = cbor_encoder_get_buffer_size(&root, buffer);
            mqtt_pub(buffer, len, MQTT_QOS_0);
        }
    }
    else {
        ESP_LOGW(TAG, "Unsupported meessage kind: %s", kind);
    }

    return ESP_OK;
}

static void on_mqtt_data(void *arg, esp_event_base_t base, int32_t eid, void *data)
{
    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)data;

    ESP_LOGW(TAG, "mqtt data (topic=%.*s):", event->topic_len, event->topic);
    ESP_LOG_BUFFER_HEXDUMP(TAG, event->data, event->data_len, ESP_LOG_WARN);

    CborError err = CborNoError;
    dec_msg_desc_t msg = { 0 };
    if ((err = dec_msg_desc((uint8_t *)event->data, event->data_len, &msg)) != CborNoError) {
        ESP_LOGE(TAG, "Failed to decode message description: %d", err);
        return;
    }

    ESP_LOGW(TAG, "msg id: %s, kind: %s", msg.id, msg.kind);

    handle_message_from_web(msg.kind, (uint8_t *)event->data, event->data_len);
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
    rc522_task_mutex = xSemaphoreCreateMutex();

    if (rc522_task_mutex == NULL) {
        ESP_LOGE(TAG, "Failed to create mutex");
        return;
    }

    ESP_ERROR_CHECK(rc522_spi_create(&rc522_driver_config, &rc522_driver));
    ESP_ERROR_CHECK(rc522_driver_install(rc522_driver));

    rc522_config_t rc522_scanner_config = {
        .driver = rc522_driver,
        .task_mutex = rc522_task_mutex,
    };

    ESP_ERROR_CHECK(rc522_create(&rc522_scanner_config, &rc522_scanner));
    ESP_ERROR_CHECK(rc522_register_events(rc522_scanner, RC522_EVENT_PICC_STATE_CHANGED, on_picc_state_changed, NULL));
    ESP_ERROR_CHECK(rc522_start(rc522_scanner));
    // }}
}
