import App from "@/App.vue";
import { newClientInjection } from "@/composables/useClient";
import { newClientStorageInjection } from "@/composables/useClientStorage";
import '@/form.scss';
import { keys } from "@/keys";
import '@/main.scss';
import 'reset-css';
import { createApp } from "vue";

createApp(App)
  .provide(keys.clientStorage, newClientStorageInjection())
  .provide(keys.client, newClientInjection())
  .mount('#app');
