cmake_minimum_required(VERSION 3.16)

if(EXISTS ${CMAKE_CURRENT_SOURCE_DIR}/sdkconfig.defaults.local)
    message(STATUS "Merging sdkconfig.defaults.local with sdkconfig.defaults")
    set(SDKCONFIG_DEFAULTS "sdkconfig.defaults;sdkconfig.defaults.local")
endif()

include($ENV{IDF_PATH}/tools/cmake/project.cmake)
project(nfcity)

target_add_binary_data(nfcity.elf "main/mqtt_emqx_io.pem" TEXT)
