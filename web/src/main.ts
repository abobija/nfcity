import App from '@/App.vue';
import Client from '@/comm/Client';
import '@/form.scss';
import '@/main.scss';
import 'reset-css';
import { createApp } from 'vue';

const client = Client.from(
  'wss://broker.emqx.io:8084/mqtt', // TODO: Make it configurable
  '48dbf5d4de339570' // TODO: Make it configurable
);

createApp(App)
  .provide('client', client)
  .mount('#app');
