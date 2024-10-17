#include <stdio.h>
#include <inttypes.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "freertos/semphr.h"
#include "esp_wifi.h"
#include "esp_system.h"
#include "esp_check.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "esp_random.h"
#include "protocol_examples_common.h"
#include "mqtt_client.h"
#include "msg.h"
#include "rc522.h"
#include "driver/rc522_spi.h"
#include "picc/rc522_mifare.h"

#ifndef CONFIG_ESP_TLS_SKIP_SERVER_CERT_VERIFY
extern const uint8_t mqtt_broker_pem_start[] asm("_binary_mqtt_broker_pem_start");
extern const uint8_t mqtt_broker_pem_end[] asm("_binary_mqtt_broker_pem_end");
#else
const uint8_t *mqtt_broker_pem_start = NULL;
const uint8_t *mqtt_broker_pem_end = mqtt_broker_pem_start;
#endif

#define NVS_NAMESPACE              "nfcity"
#define NVS_KEY_MQTT_ROOT_TOPIC    "mqtt_rtopic"

#define MQTT_ROOT_TOPIC_LENGTH     16
#define MQTT_DEV_SUBTOPIC          "/dev"
#define MQTT_WEB_SUBTOPIC          "/web"
#define MQTT_QOS_0                 0
#define MQTT_QOS_1                 1
#define MQTT_QOS_2                 2
#define MQTT_READY_BIT             BIT0

#define RC522_SPI_BUS_GPIO_MISO    21
#define RC522_SPI_BUS_GPIO_MOSI    23
#define RC522_SPI_BUS_GPIO_SCLK    19
#define RC522_SPI_SCANNER_GPIO_SDA 22
#define RC522_SCANNER_GPIO_RST     18

#define PICC_MEM_BUFFER_SIZE       1024

const char *TAG = "nfcity";
const char *MSG_LOG_TAG = "nfcity";

static rc522_driver_handle_t rc522_driver;
static rc522_handle_t rc522_scanner;
static EventGroupHandle_t wait_bits;
static SemaphoreHandle_t rc522_task_mutex;
static const uint16_t rc522_task_mutex_take_timeout_ms = 1000;
static esp_mqtt_client_handle_t mqtt_client;
static char mqtt_topic_buffer[64] = { 0 };
static char *mqtt_subtopic_ptr = NULL;
static uint8_t enc_buffer[ENC_BUFFER_SIZE] = { 0 };
static SemaphoreHandle_t enc_buffer_mutex;
static const uint16_t enc_buffer_mutex_take_timeout_ms = 1000;
static uint8_t picc_mem_buffer[PICC_MEM_BUFFER_SIZE] = { 0 }; // protect?
static rc522_picc_t picc = { 0 };

static rc522_spi_config_t rc522_driver_config = {
    .host_id = SPI3_HOST,
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

typedef struct
{
    esp_mqtt_event_id_t event;
    const char *name;
} mqtt_event_name_map_entry_t;

static mqtt_event_name_map_entry_t mqtt_event_name_map[] = {
    { MQTT_EVENT_ERROR, "error" },
    { MQTT_EVENT_CONNECTED, "connected" },
    { MQTT_EVENT_DISCONNECTED, "disconnected" },
    { MQTT_EVENT_SUBSCRIBED, "subscribed" },
    { MQTT_EVENT_UNSUBSCRIBED, "unsubscribed" },
    { MQTT_EVENT_PUBLISHED, "published" },
    { MQTT_EVENT_DATA, "data" },
    { MQTT_EVENT_BEFORE_CONNECT, "before_connect" },
    { MQTT_EVENT_DELETED, "deleted" },
    { MQTT_USER_EVENT, "user_event" },
};

static const char *mqtt_event_name(esp_mqtt_event_id_t id);

static esp_err_t read_sector(web_read_sector_msg_t *msg, rc522_mifare_sector_desc_t *sector_desc, uint8_t *buffer);

static esp_err_t write_block(web_write_block_msg_t *msg, uint8_t *out_buffer);

// TODO: Check for return values everywhere

static inline char *mqtt_subtopic(const char *subtopic)
{
    strcpy(mqtt_subtopic_ptr, subtopic);
    return mqtt_topic_buffer;
}

static inline int mqtt_pub(const uint8_t *data, int len, int qos)
{
    return esp_mqtt_client_publish(mqtt_client, mqtt_subtopic(MQTT_DEV_SUBTOPIC), (char *)data, len, qos, 0);
}

static void on_mqtt_event(void *arg, esp_event_base_t base, int32_t id, void *data)
{
    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)data;
    esp_log_level_t log_level = ESP_LOG_NONE;
    switch (id) {
        case MQTT_EVENT_PUBLISHED:
        case MQTT_EVENT_DATA: {
            log_level = ESP_LOG_DEBUG;
        } break;
        case MQTT_EVENT_ERROR:
        case MQTT_EVENT_DISCONNECTED:
        case MQTT_EVENT_UNSUBSCRIBED: {
            log_level = ESP_LOG_WARN;
        } break;
        default: {
            log_level = ESP_LOG_INFO;
        } break;
    }
    ESP_LOG_LEVEL_LOCAL(log_level,
        TAG,
        "mqtt event (id=%d, name=%s)",
        event->event_id,
        mqtt_event_name((esp_mqtt_event_id_t)event->event_id));
}

static void on_mqtt_connected(void *arg, esp_event_base_t base, int32_t id, void *data)
{
    esp_mqtt_client_subscribe_single(mqtt_client, mqtt_subtopic(MQTT_WEB_SUBTOPIC), MQTT_QOS_0);

    if (xSemaphoreTake(enc_buffer_mutex, pdMS_TO_TICKS(enc_buffer_mutex_take_timeout_ms)) != pdTRUE) {
        ESP_LOGE(TAG, "Failed to take enc_buffer_mutex");
        return;
    }

    CborEncoder root = { 0 };
    cbor_encoder_init(&root, enc_buffer, sizeof(enc_buffer), 0);
    enc_hello_message(&root);
    size_t enc_length = cbor_encoder_get_buffer_size(&root, enc_buffer);

    mqtt_pub(enc_buffer, enc_length, MQTT_QOS_0);

    if (xSemaphoreGive(enc_buffer_mutex) != pdTRUE) {
        ESP_LOGE(TAG, "Failed to give enc_buffer_mutex");
    }

    xEventGroupSetBits(wait_bits, MQTT_READY_BIT);
}

static void on_mqtt_data(void *arg, esp_event_base_t base, int32_t eid, void *data)
{
    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)data;

    // decoding request

    CborError dec_err = CborNoError;
    web_msg_t web_msg = { 0 };
    if ((dec_err = dec_msg((uint8_t *)event->data, event->data_len, &web_msg)) != CborNoError) {
        ESP_LOGE(TAG, "Failed to decode message (dec_err=%d)", dec_err);
        return;
    }

    if (web_msg.kind != WEB_MSG_PING) {
        ESP_LOGI(TAG, "msg received (kind=%d, id=%s)", web_msg.kind, web_msg.id);
    }

    // encoding response

    if (xSemaphoreTake(enc_buffer_mutex, pdMS_TO_TICKS(enc_buffer_mutex_take_timeout_ms)) != pdTRUE) {
        ESP_LOGE(TAG, "Failed to take enc_buffer_mutex");
        return;
    }

    esp_err_t err = ESP_OK;
    CborEncoder root = { 0 };
    size_t enc_length = 0;

    cbor_encoder_init(&root, enc_buffer, sizeof(enc_buffer), 0);

    switch (web_msg.kind) {
        case WEB_MSG_PING: {
            enc_pong_message(&web_msg, &root);
        } break;
        case WEB_MSG_GET_PICC: {
            enc_picc_message(&web_msg, &root, &picc);
        } break;
        case WEB_MSG_READ_SECTOR: {
            web_read_sector_msg_t read_sector_msg = { 0 };
            dec_read_sector_msg((uint8_t *)event->data, event->data_len, &read_sector_msg);
            rc522_mifare_sector_desc_t sector_desc = { 0 };
            rc522_mifare_get_sector_desc(read_sector_msg.offset, &sector_desc);
            if ((err = read_sector(&read_sector_msg, &sector_desc, picc_mem_buffer)) == ESP_OK) {
                enc_picc_sector_message(&web_msg, &root, &sector_desc, picc_mem_buffer);
            }
        } break;
        case WEB_MSG_WRITE_BLOCK: {
            web_write_block_msg_t write_block_msg = { 0 };
            dec_write_block_msg((uint8_t *)event->data, event->data_len, &write_block_msg);
            if ((err = write_block(&write_block_msg, picc_mem_buffer)) == ESP_OK) {
                enc_picc_block_message(&web_msg, &root, write_block_msg.address, picc_mem_buffer);
            }
        } break;
        default: {
            ESP_LOGW(TAG, "Unsupported meessage kind: %d", web_msg.kind);
            err = ESP_ERR_NOT_SUPPORTED;
        } break;
    }

    if (err != ESP_OK) {
        enc_error_message(&web_msg, &root, err);
    }

    enc_length = cbor_encoder_get_buffer_size(&root, enc_buffer);

    if (enc_length > 0) {
        mqtt_pub(enc_buffer, enc_length, MQTT_QOS_0);
    }

    if (xSemaphoreGive(enc_buffer_mutex) != pdTRUE) {
        ESP_LOGE(TAG, "Failed to give enc_buffer_mutex");
    }
}

static void on_picc_state_changed(void *arg, esp_event_base_t base, int32_t event_id, void *data)
{
    rc522_picc_state_changed_event_t *event = (rc522_picc_state_changed_event_t *)data;

    ESP_LOGD(TAG, "picc state changed from %d to %d", event->old_state, event->picc->state);

    memcpy(&picc, event->picc, sizeof(rc522_picc_t));

    if (xSemaphoreTake(enc_buffer_mutex, pdMS_TO_TICKS(enc_buffer_mutex_take_timeout_ms)) != pdTRUE) {
        ESP_LOGE(TAG, "Failed to take enc_buffer_mutex");
        return;
    }

    CborEncoder root = { 0 };
    cbor_encoder_init(&root, enc_buffer, sizeof(enc_buffer), 0);
    enc_picc_state_changed_message(&root, &picc, event->old_state);
    size_t enc_length = cbor_encoder_get_buffer_size(&root, enc_buffer);

    mqtt_pub(enc_buffer, enc_length, MQTT_QOS_0);

    if (xSemaphoreGive(enc_buffer_mutex) != pdTRUE) {
        ESP_LOGE(TAG, "Failed to give enc_buffer_mutex");
    }
}

static const char *mqtt_event_name(esp_mqtt_event_id_t id)
{
    for (uint8_t i = 0; i < sizeof(mqtt_event_name_map) / sizeof(mqtt_event_name_map[0]); i++) {
        if (mqtt_event_name_map[i].event == id) {
            return mqtt_event_name_map[i].name;
        }
    }

    return "unknown";
}

static esp_err_t read_sector(web_read_sector_msg_t *msg, rc522_mifare_sector_desc_t *sector_desc, uint8_t *buffer)
{
    if (picc.state != RC522_PICC_STATE_ACTIVE && picc.state != RC522_PICC_STATE_ACTIVE_H) {
        ESP_LOGW(TAG, "cannot read memory. picc is not active");
        return ESP_FAIL;
    }

    if (xSemaphoreTake(rc522_task_mutex, pdMS_TO_TICKS(rc522_task_mutex_take_timeout_ms)) != pdTRUE) {
        ESP_LOGE(TAG, "Failed to take rc522_task_mutex");
        return ESP_FAIL;
    }

    rc522_mifare_key_t key = {
        .type = msg->key.type,
    };

    memcpy(key.value, msg->key.value, RC522_MIFARE_KEY_SIZE);

    esp_err_t ret = ESP_OK;

    ESP_GOTO_ON_ERROR(rc522_mifare_auth_sector(rc522_scanner, &picc, sector_desc, &key), _exit, TAG, "auth failed");

    for (uint8_t i = 0; i < sector_desc->number_of_blocks; i++) {
        uint8_t block_addr = sector_desc->block_0_address + i;
        uint8_t *buffer_ptr = buffer + (i * RC522_MIFARE_BLOCK_SIZE);

        ESP_GOTO_ON_ERROR(rc522_mifare_read(rc522_scanner, &picc, block_addr, buffer_ptr), _exit, TAG, "read failed");
    }
_exit:
    rc522_mifare_deauth(rc522_scanner, &picc);
    xSemaphoreGive(rc522_task_mutex);

    return ret;
}

static esp_err_t write_block(web_write_block_msg_t *msg, uint8_t *out_buffer)
{
    esp_err_t ret = ESP_OK;

    if (picc.state != RC522_PICC_STATE_ACTIVE && picc.state != RC522_PICC_STATE_ACTIVE_H) {
        ESP_LOGW(TAG, "cannot write memory. picc is not active");
        return ESP_FAIL;
    }
    if (xSemaphoreTake(rc522_task_mutex, pdMS_TO_TICKS(rc522_task_mutex_take_timeout_ms)) != pdTRUE) {
        ESP_LOGE(TAG, "Failed to take rc522_task_mutex");
        return ESP_FAIL;
    }
    rc522_mifare_key_t key = {
        .type = msg->key.type,
    };
    memcpy(key.value, msg->key.value, RC522_MIFARE_KEY_SIZE);

    ESP_GOTO_ON_ERROR(rc522_mifare_auth(rc522_scanner, &picc, msg->address, &key), _exit, TAG, "auth failed");
    ESP_GOTO_ON_ERROR(rc522_mifare_write(rc522_scanner, &picc, msg->address, msg->data), _exit, TAG, "write failed");
    uint8_t verification_buffer[RC522_MIFARE_BLOCK_SIZE] = { 0 };
    ESP_GOTO_ON_ERROR(rc522_mifare_read(rc522_scanner, &picc, msg->address, verification_buffer),
        _exit,
        TAG,
        "read failed");
    memcpy(out_buffer, verification_buffer, RC522_MIFARE_BLOCK_SIZE);

_exit:
    rc522_mifare_deauth(rc522_scanner, &picc);
    xSemaphoreGive(rc522_task_mutex);

    return ret;
}

void app_main()
{
    ESP_ERROR_CHECK(nvs_flash_init());

    { // concurrency
        wait_bits = xEventGroupCreate();
        assert(wait_bits != NULL);
        xEventGroupClearBits(wait_bits, MQTT_READY_BIT);
        enc_buffer_mutex = xSemaphoreCreateMutex();
        assert(enc_buffer_mutex != NULL);
        rc522_task_mutex = xSemaphoreCreateMutex();
        assert(rc522_task_mutex != NULL);
    }

    { // wifi
        ESP_ERROR_CHECK(esp_netif_init());
        ESP_ERROR_CHECK(esp_event_loop_create_default());
        ESP_ERROR_CHECK(example_connect());
    }

    { // mqtt
        char root_topic[MQTT_ROOT_TOPIC_LENGTH + 1] = { 0 };
        nvs_handle_t nfcity_nvs;
        ESP_ERROR_CHECK(nvs_open(NVS_NAMESPACE, NVS_READWRITE, &nfcity_nvs));
        size_t root_topic_size = 0;
        esp_err_t nvs_err = nvs_get_str(nfcity_nvs, NVS_KEY_MQTT_ROOT_TOPIC, NULL, &root_topic_size);
        assert(nvs_err == ESP_OK || nvs_err == ESP_ERR_NVS_NOT_FOUND);
        if (nvs_err == ESP_OK) { // retrieve root_topic from cache
            ESP_LOGI(TAG, "size of root_topic retrieved from cache: %d", root_topic_size);
            assert(root_topic_size == (MQTT_ROOT_TOPIC_LENGTH + 1));
            ESP_ERROR_CHECK(nvs_get_str(nfcity_nvs, NVS_KEY_MQTT_ROOT_TOPIC, root_topic, &root_topic_size));
            root_topic[MQTT_ROOT_TOPIC_LENGTH] = 0;
            ESP_LOGI(TAG, "root_topic retrieved from cache: %s", root_topic);
        }
        else { // generate and cache random root_topic
            root_topic_size = MQTT_ROOT_TOPIC_LENGTH + 1;
            uint8_t rnd_root_topic_bytes[MQTT_ROOT_TOPIC_LENGTH / 2] = { 0 };
            esp_fill_random(rnd_root_topic_bytes, sizeof(rnd_root_topic_bytes));
            for (uint8_t i = 0; i < sizeof(rnd_root_topic_bytes); ++i) {
                sprintf(root_topic + (i * 2), "%02x", rnd_root_topic_bytes[i]);
            }
            root_topic[MQTT_ROOT_TOPIC_LENGTH] = 0;
            ESP_LOGI(TAG, "root_topic generated: %s", root_topic);
            ESP_ERROR_CHECK(nvs_set_str(nfcity_nvs, NVS_KEY_MQTT_ROOT_TOPIC, root_topic));
            ESP_ERROR_CHECK(nvs_commit(nfcity_nvs));
            ESP_LOGI(TAG, "root_topic cached");
        }
        nvs_close(nfcity_nvs);
        memset(mqtt_topic_buffer, 0, sizeof(mqtt_topic_buffer));
        sprintf(mqtt_topic_buffer, "/%.*s", MQTT_ROOT_TOPIC_LENGTH, root_topic);
        mqtt_subtopic_ptr = mqtt_topic_buffer + strlen(mqtt_topic_buffer);
        ESP_LOGI(TAG, "*** +-----------------------------------+");
        ESP_LOGI(TAG, "*** |%*c", 36, '|');
        ESP_LOGI(TAG, "*** | MQTT_ROOT_TOPIC: %s |", mqtt_topic_buffer + 1);
        ESP_LOGI(TAG, "*** |%*c", 36, '|');
        ESP_LOGI(TAG, "*** +-----------------------------------+");

        const esp_mqtt_client_config_t mqtt_cfg = {
            .broker.address.uri = CONFIG_NFCITY_MQTT_BROKER,
            .broker.verification.certificate = (const char *)mqtt_broker_pem_start,
            .broker.verification.certificate_len = mqtt_broker_pem_end - mqtt_broker_pem_start,
#ifdef NFCITY_MQTT_USE_CREDENTIALS
            .credentials.username = CONFIG_NFCITY_MQTT_USERNAME,
            .credentials.authentication.password = CONFIG_NFCITY_MQTT_PASSWORD,
#endif
        };

        mqtt_client = esp_mqtt_client_init(&mqtt_cfg);
        assert(mqtt_client != NULL);

        ESP_ERROR_CHECK(esp_mqtt_client_register_event(mqtt_client, ESP_EVENT_ANY_ID, on_mqtt_event, NULL));
        ESP_ERROR_CHECK(esp_mqtt_client_register_event(mqtt_client, MQTT_EVENT_CONNECTED, on_mqtt_connected, NULL));
        ESP_ERROR_CHECK(esp_mqtt_client_register_event(mqtt_client, MQTT_EVENT_DATA, on_mqtt_data, NULL));

        ESP_ERROR_CHECK(esp_mqtt_client_start(mqtt_client));
    }

    { // rc522
        xEventGroupWaitBits(wait_bits, MQTT_READY_BIT, pdFALSE, pdTRUE, portMAX_DELAY);

        ESP_ERROR_CHECK(rc522_spi_create(&rc522_driver_config, &rc522_driver));
        ESP_ERROR_CHECK(rc522_driver_install(rc522_driver));

        rc522_config_t rc522_scanner_config = {
            .driver = rc522_driver,
            .task_mutex = rc522_task_mutex,
        };

        ESP_ERROR_CHECK(rc522_create(&rc522_scanner_config, &rc522_scanner));
        ESP_ERROR_CHECK(
            rc522_register_events(rc522_scanner, RC522_EVENT_PICC_STATE_CHANGED, on_picc_state_changed, NULL));
        ESP_ERROR_CHECK(rc522_start(rc522_scanner));
    }
}
