cmake_minimum_required(VERSION 3.20)

if(EXISTS ${CMAKE_CURRENT_SOURCE_DIR}/sdkconfig.defaults.local)
    set(SDKCONFIG_DEFAULTS "sdkconfig.defaults;sdkconfig.defaults.local")
    message(STATUS "SDKCONFIG_DEFAULTS set to ${SDKCONFIG_DEFAULTS}")
endif()

include($ENV{IDF_PATH}/tools/cmake/project.cmake)
project(nfcity)
