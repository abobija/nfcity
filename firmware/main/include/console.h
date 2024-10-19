#pragma once

#include <stdbool.h>
#include "esp_err.h"
#include "esp_wifi.h"

typedef enum
{
    CONSOLE_ERR_OK = 0,
    CONSOLE_ERR_TIMEOUT,
    CONSOLE_ERR_WIFI_CONFIG_NOT_FOUND,
} console_err_t;

esp_err_t console_init();
console_err_t console_wifi_join(wifi_config_t *wifi_config, int timeout_ms);
esp_err_t console_run();
esp_err_t console_deinit();
