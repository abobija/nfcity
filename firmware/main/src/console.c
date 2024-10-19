#include <unistd.h>
#include <string.h>
#include "console.h"
#include "esp_wifi.h"
#include "esp_system.h"
#include "esp_log.h"
#include "esp_console.h"
#include "driver/uart_vfs.h"
#include "driver/uart.h"
#include "linenoise/linenoise.h"
#include "argtable3/argtable3.h"

// TODO: Check return values everywhere

#define JOIN_TIMEOUT_MS (10000)

extern const char *NFCITY_TAG;

static EventGroupHandle_t wifi_event_group;
const int WIFI_CONNECTED_BIT = BIT0;

static struct
{
    struct arg_int *timeout;
    struct arg_str *ssid;
    struct arg_str *password;
    struct arg_end *end;
} wifi_cmd_args;

static void console_wifi_event_handler(void *arg, esp_event_base_t event_base, int32_t event_id, void *event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        ESP_ERROR_CHECK(esp_wifi_connect()); // reconnect
        xEventGroupClearBits(wifi_event_group, WIFI_CONNECTED_BIT);
    }
    else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        xEventGroupSetBits(wifi_event_group, WIFI_CONNECTED_BIT);
    }
}

static esp_err_t console_wifi_initialize()
{
    wifi_event_group = xEventGroupCreate();
    ESP_ERROR_CHECK(
        esp_event_handler_register(WIFI_EVENT, WIFI_EVENT_STA_DISCONNECTED, &console_wifi_event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &console_wifi_event_handler, NULL));
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));
    ESP_ERROR_CHECK(esp_wifi_set_storage(WIFI_STORAGE_FLASH));
    esp_netif_t *esp_netif_sta = esp_netif_create_default_wifi_sta();
    assert(esp_netif_sta);
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_start());

    return ESP_OK;
}

/**
 * @param wifi_config NULL to reuse config from NVS
 */
console_err_t console_wifi_join(wifi_config_t *wifi_config, int timeout_ms)
{
    char ssid[32] = { 0 };
    if (wifi_config) {
        ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, wifi_config));
        memcpy(ssid, wifi_config->sta.ssid, sizeof(ssid));
    }
    else {
        wifi_config_t existing_config = { 0 };
        ESP_ERROR_CHECK(esp_wifi_get_config(WIFI_IF_STA, &existing_config));
        if (existing_config.sta.ssid[0] == 0) {
            return CONSOLE_ERR_WIFI_CONFIG_NOT_FOUND;
        }
        memcpy(ssid, existing_config.sta.ssid, sizeof(ssid));
    }
    ESP_LOGI(NFCITY_TAG, "connecting to '%s' wifi network...", ssid);
    ESP_ERROR_CHECK(esp_wifi_connect());
    EventBits_t bits =
        xEventGroupWaitBits(wifi_event_group, WIFI_CONNECTED_BIT, pdFALSE, pdTRUE, pdTICKS_TO_MS(timeout_ms));

    if (bits & WIFI_CONNECTED_BIT) {
        ESP_LOGI(NFCITY_TAG, "connected to wifi network");
        return CONSOLE_NOERR;
    }
    else {
        ESP_LOGW(NFCITY_TAG, "connection timed out");
        return CONSOLE_ERR_TIMEOUT;
    }
}

static int console_wifi_cmd_handler(int argc, char **argv)
{
    int nerrors = arg_parse(argc, argv, (void **)&wifi_cmd_args);
    if (nerrors != 0) {
        arg_print_errors(stderr, wifi_cmd_args.end, argv[0]);
        return 1;
    }
    /* set default value*/
    if (wifi_cmd_args.timeout->count == 0) {
        wifi_cmd_args.timeout->ival[0] = JOIN_TIMEOUT_MS;
    }
    wifi_config_t wifi_config = { 0 };
    strlcpy((char *)wifi_config.sta.ssid, wifi_cmd_args.ssid->sval[0], sizeof(wifi_config.sta.ssid));
    if (wifi_cmd_args.password->sval[0]) {
        strlcpy((char *)wifi_config.sta.password, wifi_cmd_args.password->sval[0], sizeof(wifi_config.sta.password));
    }

    return console_wifi_join(&wifi_config, wifi_cmd_args.timeout->ival[0]) == CONSOLE_NOERR ? 0 : 1;
}

static esp_err_t console_wifi_register_cmd()
{
    wifi_cmd_args.timeout = arg_int0(NULL, "timeout", "<t>", "Connection timeout, ms");
    wifi_cmd_args.ssid = arg_str1(NULL, NULL, "<ssid>", "SSID");
    wifi_cmd_args.password = arg_str0(NULL, NULL, "<pass>", "Password");
    wifi_cmd_args.end = arg_end(2);

    const esp_console_cmd_t wifi_cmd = {
        .command = "wifi",
        .help = "Join WiFi network",
        .hint = NULL,
        .func = &console_wifi_cmd_handler,
        .argtable = &wifi_cmd_args,
    };

    return esp_console_cmd_register(&wifi_cmd);
}

esp_err_t console_init()
{
    // Drain stdout before reconfiguring it
    fflush(stdout);
    fsync(fileno(stdout));

    // Disable buffering on stdin
    setvbuf(stdin, NULL, _IONBF, 0);

    // Minicom, screen, idf_monitor send CR when ENTER key is pressed
    uart_vfs_dev_port_set_rx_line_endings(CONFIG_ESP_CONSOLE_UART_NUM, ESP_LINE_ENDINGS_CR);

    // Move the caret to the beginning of the next line on '\n'
    uart_vfs_dev_port_set_tx_line_endings(CONFIG_ESP_CONSOLE_UART_NUM, ESP_LINE_ENDINGS_CRLF);

    // Configure UART.
    // Note that REF_TICK is used so that the baud rate remains
    // correct while APB frequency is changing in light sleep mode.
    const uart_config_t uart_config = {
        .baud_rate = CONFIG_ESP_CONSOLE_UART_BAUDRATE,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
#if SOC_UART_SUPPORT_REF_TICK
        .source_clk = UART_SCLK_REF_TICK,
#elif SOC_UART_SUPPORT_XTAL_CLK
        .source_clk = UART_SCLK_XTAL,
#endif
    };

    // Install UART driver for interrupt-driven reads and writes
    ESP_ERROR_CHECK(uart_driver_install(CONFIG_ESP_CONSOLE_UART_NUM, 256, 0, 0, NULL, 0));
    ESP_ERROR_CHECK(uart_param_config(CONFIG_ESP_CONSOLE_UART_NUM, &uart_config));

    // Tell VFS to use UART driver
    uart_vfs_dev_use_driver(CONFIG_ESP_CONSOLE_UART_NUM);

    // Initialize the console
    esp_console_config_t console_config = { .max_cmdline_args = 8,
        .max_cmdline_length = 256,
#if CONFIG_LOG_COLORS
        .hint_color = atoi(LOG_COLOR_CYAN)
#endif
    };
    ESP_ERROR_CHECK(esp_console_init(&console_config));

    // Configure linenoise line completion library.

    // Enable multiline editing.
    // If not set, long commands will scroll within single line.
    linenoiseSetMultiLine(1);

    // Tell linenoise where to get command completions and hints
    linenoiseSetCompletionCallback(&esp_console_get_completion);
    linenoiseSetHintsCallback((linenoiseHintsCallback *)&esp_console_get_hint);

    // Set command history size
    // linenoiseHistorySetMaxLen(100);

    // Set command maximum length
    linenoiseSetMaxLineLen(console_config.max_cmdline_length);

    // Don't return empty lines
    linenoiseAllowEmpty(false);

    ESP_ERROR_CHECK(console_wifi_initialize());

    ESP_ERROR_CHECK(esp_console_register_help_command());
    ESP_ERROR_CHECK(console_wifi_register_cmd());

    return ESP_OK;
}

console_err_t console_process_line(const char *prompt)
{
    char *line = linenoise(prompt);

    if (line == NULL) {
        return CONSOLE_ERR_CMD_EMPTY;
    }

    if (strcmp(line, "exit") == 0 || strcmp(line, "quit") == 0) {
        linenoiseFree(line);
        return CONSOLE_ERR_CMD_EXIT;
    }

    int ret = 0;
    esp_err_t err = ESP_OK;
    switch (err = esp_console_run(line, &ret)) {
        case ESP_OK: {
            if (ret != 0) {
                ESP_LOGE(NFCITY_TAG, "command returned non-zero error code: 0x%x (%s)", ret, esp_err_to_name(ret));
                return CONSOLE_ERR_CMD_FAIL;
            }
        } break;
        case ESP_ERR_NOT_FOUND: {
            ESP_LOGE(NFCITY_TAG, "unrecognized command");
            return CONSOLE_ERR_CMD_NOT_FOUND;
        } break;
        case ESP_ERR_INVALID_ARG: {
            return CONSOLE_ERR_CMD_EMPTY;
        } break;
        default: {
            ESP_LOGE(NFCITY_TAG, "internal error: %s", esp_err_to_name(err));
            return CONSOLE_ERR_CMD_INTERNAL;
        } break;
    }

    linenoiseFree(line);
    return CONSOLE_NOERR;
}

inline esp_err_t console_deinit()
{
    return esp_console_deinit();
}
