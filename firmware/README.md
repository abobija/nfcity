- 1. Configure project
  - by copying (and modifying) config example
    ```bash
    cp sdkconfig.defaults.local.example sdkconfig.defaults.local
    ```
  - or with menuconfig
    ```bash
    idf.py menuconfig
    ```
- 2. After configuration, build and flash project
  ```bash
  idf.py build flash monitor
  ```
