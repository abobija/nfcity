import App from '@/App.vue';
import Client from '@/comm/Client';
import '@/form.scss';
import '@/main.scss';
import 'reset-css';
import { createApp } from 'vue';

const client = Client.from(
  'wss://broker.emqx.io:8084/mqtt', // TODO: Make it configurable
  'nfcity-cce9199a6d' // TODO: Make it configurable
);

createApp(App)
  .provide('client', client)
  .mount('#app');
