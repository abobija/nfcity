import App from "@/App.vue";
import { newClientInjection } from "@/composables/useClient";
import { newClientStorageInjection } from "@/composables/useClientStorage";
import '@/form.scss';
import { keys } from "@/keys";
import '@/main.scss';
import { logi } from "@/utils/Logger";
import 'reset-css';
import { createApp } from "vue";

createApp(App)
  .provide(keys.clientStorage, newClientStorageInjection())
  .provide(keys.client, newClientInjection())
  .mount('#app');

logi(`
        __      _ _
 _ __  / _| ___(_) |_ _   _
| '_ \\| |_ / __| | __| | | |
| | | |  _| (__| | |_| |_| |
|_| |_|_|  \\___|_|\\__|\\__, |
                      |___/
`);
