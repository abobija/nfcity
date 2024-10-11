import App from "@/App.vue";
import '@/form.scss';
import { newClientInjection } from "@/ioc/ClientInjection";
import { newClientStorageInjection } from "@/ioc/ClientStorageInjection";
import { clientKey, clientStorageKey } from "@/ioc/keys";
import '@/main.scss';
import 'reset-css';
import { createApp } from "vue";

createApp(App)
  .provide(clientStorageKey, newClientStorageInjection())
  .provide(clientKey, newClientInjection())
  .mount('#app');
