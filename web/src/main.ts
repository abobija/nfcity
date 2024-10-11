import App from "@/App.vue";
import '@/form.scss';
import { clientKey, clientStorageKey } from "@/keys";
import '@/main.scss';
import 'reset-css';
import { createApp } from "vue";
import { newClientInjection } from "./composables/useClient";
import { newClientStorageInjection } from "./composables/useClientStorage";

createApp(App)
  .provide(clientStorageKey, newClientStorageInjection())
  .provide(clientKey, newClientInjection())
  .mount('#app');
