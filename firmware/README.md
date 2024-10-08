```bash
cp sdkconfig.defaults.local.example sdkconfig.defaults.local

# mqtt broker ssl cert
openssl s_client -showcerts -connect broker.emqx.io:8084 2>&1 | sed -n "1,/Root/d; /BEGIN/,/END/p" | openssl x509 -outform PEM >main/mqtt_emqx_io.pem
```

- [CBOR Playground](https://cbor.me)
