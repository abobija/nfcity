import 'reset-css';
import { createApp } from 'vue';
import Client from './communication/Client';
import App from './components/App/App.vue';
import './main.scss';

const client = new Client();

client.broker = 'wss://broker.emqx.io:8084/mqtt';
client.rootTopic = '/nfcity-7493/';

createApp(App)
  .provide('client', client)
  .mount('#app');
