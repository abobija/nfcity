import 'reset-css';
import { createApp } from 'vue';
import App from './App.vue';
import Client from './comm/Client';
import './main.scss';

const client = new Client();

client.broker = 'wss://broker.emqx.io:8084/mqtt';
client.rootTopic = '/nfcity-7493/';

createApp(App)
  .provide('client', client)
  .mount('#app');
