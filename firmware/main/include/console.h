#pragma once

#include <stdbool.h>
#include "esp_err.h"
#include "esp_wifi.h"

typedef enum
{
    CONSOLE_NOERR = 0,
    CONSOLE_ERR_TIMEOUT,
    CONSOLE_ERR_WIFI_CONFIG_NOT_FOUND,
    CONSOLE_ERR_CMD_EMPTY,
    CONSOLE_ERR_CMD_EXIT,
    CONSOLE_ERR_CMD_NOT_FOUND,
    CONSOLE_ERR_CMD_FAIL,
    CONSOLE_ERR_CMD_INTERNAL,
} console_err_t;

esp_err_t console_init();
console_err_t console_wifi_join(wifi_config_t *wifi_config, int timeout_ms);
console_err_t console_process_line(const char *prompt);
esp_err_t console_deinit();
