import { ClientStorage, defaultClientStorage, isValidClientStorage, validateClientStorage } from "@/storage/ClientStorage";
import { clone } from "@/utils/helpers";
import makeLogger from "@/utils/Logger";
import { readonly, Ref, ref, watch } from "vue";

const logger = makeLogger('ClientStorageInjection');

export default interface ClientStorageInjection {
  clientStorage: Readonly<Ref<ClientStorage>>;
  updateClientStorage: (newClientStorage: ClientStorage) => void;
}

export function newClientStorageInjection(): ClientStorageInjection {
  const key = 'client';
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

  const lsItemJson = lsItem ? JSON.parse(lsItem) : defaultClientStorage
  const clientStorageRef = ref(lsItem ? sanitize(lsItemJson) : defaultClientStorage);

  watch(clientStorageRef, (newStorage, oldStorage) => {
    if (!isValidClientStorage(newStorage)) {
      throw Error('invalid newStorage');
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
