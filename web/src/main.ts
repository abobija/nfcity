import App from "@/App.vue";
import '@/form.scss';
import '@/main.scss';
import 'reset-css';
import { createApp } from "vue";
import { newClientInjection } from "./composables/useClient";
import { newClientStorageInjection } from "./composables/useClientStorage";
import { keys } from "./keys";

createApp(App)
  .provide(keys.clientStorage, newClientStorageInjection())
  .provide(keys.client, newClientInjection())
  .mount('#app');
