import App from '@/App.vue';
import Client from '@/comm/Client';
import '@/form.scss';
import { clientKey, clientStorageKey } from '@/iocKeys';
import '@/main.scss';
import { logger, Logger } from '@/utils/Logger';
import 'reset-css';
import { createApp, ref, watch } from 'vue';
import { NonValidatedClientStorage } from './storage/ClientStorage';

const clientStorage = (() => {
  const logger = Logger.fromName('clientStorage');
  const key = 'client';
  const defaultStorage = {
    brokerUrl: "wss://broker.emqx.io:8084/mqtt",
  } as NonValidatedClientStorage;

  const item = localStorage.getItem(key);

  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultStorage));
  }

  const clientStorage = ref(
    (item ? JSON.parse(item) : defaultStorage) as NonValidatedClientStorage
  );

  watch(clientStorage, (newStorage, oldStorage) => {
    localStorage.setItem(key, JSON.stringify(newStorage));
    logger.debug('storage changed', 'from', oldStorage, 'to', newStorage);
  });

  return clientStorage;
})();

const client = (() => {
  const client = ref<Client>();

  watch(client, (newClient, oldClient) => {
    logger.debug('client changed', 'from', oldClient, 'to', newClient);
  });

  return client;
})();

createApp(App)
  .provide(clientStorageKey, clientStorage)
  .provide(clientKey, client)
  .mount('#app');
