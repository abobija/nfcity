```bash
# wifi config
touch sdkconfig.defaults.local
echo "CONFIG_EXAMPLE_WIFI_SSID=\"YOUR_WIFI_SSID_HERE\"" >> sdkconfig.defaults.local
echo "CONFIG_EXAMPLE_WIFI_PASSWORD=\"YOUR_WIFI_PASSWORD_HERE\"" >> sdkconfig.defaults.local

# mqtt broker ssl cert
openssl s_client -showcerts -connect broker.emqx.io:8084 2>&1 | sed -n "1,/Root/d; /BEGIN/,/END/p" | openssl x509 -outform PEM >main/mqtt_emqx_io.pem
```

- [CBOR Playground](https://cbor.me)
