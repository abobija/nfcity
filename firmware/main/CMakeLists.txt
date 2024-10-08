if(NOT CMAKE_BUILD_EARLY_EXPANSION AND EXISTS config AND NOT CONFIG_ESP_TLS_SKIP_SERVER_CERT_VERIFY)
    set(MQTT_CERT_PATH ${CMAKE_CURRENT_SOURCE_DIR}/mqtt_broker.pem)
    message(STATUS "Downloading MQTT broker certificate to ${MQTT_CERT_PATH}")

    execute_process(
        COMMAND openssl s_client -showcerts -connect broker.emqx.io:8084
        COMMAND sed -n "1,/Root/d; /BEGIN/,/END/p"
        COMMAND openssl x509 -outform PEM
        COMMAND_ECHO STDOUT
        ERROR_QUIET
        COMMAND_ERROR_IS_FATAL LAST
        OUTPUT_FILE ${MQTT_CERT_PATH}
    )
endif()

if(DEFINED MQTT_CERT_PATH)
    message(STATUS "MQTT_CERT_PATH set to ${MQTT_CERT_PATH}")
endif()

idf_component_register(
    INCLUDE_DIRS
        include
    SRCS
        nfcity.c
        src/msg.c
    EMBED_TXTFILES
        ${MQTT_CERT_PATH}
)
