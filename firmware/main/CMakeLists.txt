SET(TXT_EMBEDS "")
SET(MQTT_CERT_PATH ${CMAKE_CURRENT_BINARY_DIR}/mqtt_broker.pem)

if(NOT CMAKE_BUILD_EARLY_EXPANSION AND EXISTS config)
    message(STATUS "Extracting MQTT broker host from config")
    execute_process(
        COMMAND echo ${CONFIG_NFCITY_MQTT_BROKER}
        COMMAND grep -oP "wss://\\K([^:]+):([0-9]+)"
        COMMAND_ECHO STDOUT
        OUTPUT_VARIABLE mqtt_broker_host
        OUTPUT_STRIP_TRAILING_WHITESPACE
        COMMAND_ERROR_IS_FATAL ANY
    )
    if(DEFINED NFCITY_MQTT_BROKER_HOST AND NFCITY_MQTT_BROKER_HOST STREQUAL mqtt_broker_host AND EXISTS ${MQTT_CERT_PATH})
        message(STATUS "Using cached certificate of ${NFCITY_MQTT_BROKER_HOST} MQTT broker")
    else()
        set(NFCITY_MQTT_BROKER_HOST ${mqtt_broker_host} CACHE STRING "MQTT Broker Host")
        message(STATUS "Downloading MQTT broker certificate to ${MQTT_CERT_PATH}")
        execute_process(
            COMMAND openssl s_client -showcerts -connect ${NFCITY_MQTT_BROKER_HOST}
            COMMAND sed -n "1,/Root/d; /BEGIN/,/END/p"
            COMMAND openssl x509 -outform PEM
            COMMAND_ECHO STDOUT
            COMMAND_ERROR_IS_FATAL LAST
            OUTPUT_FILE ${MQTT_CERT_PATH}
        )
    endif()
    set_property(DIRECTORY "${COMPONENT_DIR}" APPEND PROPERTY ADDITIONAL_CLEAN_FILES ${MQTT_CERT_PATH})
    if(NOT CONFIG_ESP_TLS_SKIP_SERVER_CERT_VERIFY)
        list(APPEND TXT_EMBEDS ${MQTT_CERT_PATH})
    endif()
endif()

idf_component_register(
    INCLUDE_DIRS
        include
    SRCS
        nfcity.c
        src/msg.c
    EMBED_TXTFILES
        ${TXT_EMBEDS}
)
