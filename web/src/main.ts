import App from '@/App.vue';
import Client from '@/comm/Client';
import '@/form.scss';
import { clientKey, clientStorageKey } from '@/iocKeys';
import '@/main.scss';
import { logger, Logger } from '@/utils/Logger';
import 'reset-css';
import { createApp, ref, watch } from 'vue';
import { ClientStorage, IncompleteClientStorage, isValidClientStorage, validateClientStorage } from './storage/ClientStorage';
import { clone } from './utils/helpers';

const clientStorage = (() => {
  const logger = Logger.fromName('clientStorage');
  const key = 'client';
  const defaultStorage = {
    brokerUrl: "wss://broker.emqx.io:8084/mqtt",
  } as IncompleteClientStorage;

  const item = localStorage.getItem(key);

  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultStorage));
  }

  function sanitize(storage: ClientStorage): ClientStorage {
    const sanitizedStorage = clone(storage);

    validateClientStorage(storage).forEach(error => {
      delete sanitizedStorage[error.field];

      logger.debug(
        'discarded invalid field', error.field,
        'with value', error.value,
        'and error', error.error
      );
    });

    return sanitizedStorage;
  }

  const clientStorage = ref(
    sanitize(item ? JSON.parse(item) : defaultStorage)
  );

  watch(clientStorage, (newStorage, oldStorage) => {
    if (!isValidClientStorage(newStorage)) {
      throw Error('invalid storage');
    }

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
