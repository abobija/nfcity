import Client from "@/comm/Client";
import { ClientStorage, IncompleteClientStorage, isValidClientStorage, validateClientStorage } from "@/storage/ClientStorage";
import { clone } from "@/utils/helpers";
import { Logger } from "@/utils/Logger";
import { readonly, Ref, ref, watch } from "vue";

const logger = Logger.fromName('ClientStorageInjection');

export default interface ClientStorageInjection {
  clientStorage: Readonly<Ref<ClientStorage>>;
  updateClientStorage: (newClientStorage: ClientStorage) => void;
}

export function newClientStorageInjection(): ClientStorageInjection {
  const key = 'client';
  const defaultStorage = {
    brokerUrl: Client.DefaultBrokerUrl,
  } as IncompleteClientStorage;

  const lsItem = localStorage.getItem(key);

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

  const lsItemJson = lsItem ? JSON.parse(lsItem) : defaultStorage
  const clientStorageRef = ref(lsItem ? sanitize(lsItemJson) : defaultStorage);

  watch(clientStorageRef, (newStorage, oldStorage) => {
    if (!isValidClientStorage(newStorage)) {
      throw Error('invalid storage');
    }

    localStorage.setItem(key, JSON.stringify(newStorage));
    logger.debug('storage changed', 'from', oldStorage, 'to', newStorage);
  });

  return {
    clientStorage: readonly(clientStorageRef),
    updateClientStorage: (newClientStorage: ClientStorage) => {
      clientStorageRef.value = newClientStorage;
    },
  }
}
