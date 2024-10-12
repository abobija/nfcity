
import Client, { ClientValidator } from "@/communication/Client";
import { keys } from "@/keys";
import { cloneObject } from "@/utils/helpers";
import makeLogger from "@/utils/Logger";
import { inject, readonly, ref, Ref, watch } from "vue";

const logger = makeLogger('useClientStorage');

export interface ValidClientStorage {
  readonly brokerUrl: string;
  readonly rootTopic: string;
}

export interface ClientStorage extends Partial<ValidClientStorage> { }

export interface DefaultClientStorage extends Pick<ValidClientStorage, 'brokerUrl'> { }

export const defaultClientStorage: DefaultClientStorage = {
  brokerUrl: Client.DefaultBrokerUrl,
};

export function isValidClientStorage(storage: ClientStorage): storage is ValidClientStorage {
  return validateClientStorage(storage).length === 0;
}

export function validateClientStorage(storage: ClientStorage) {
  const errors: { value: unknown, field: keyof ClientStorage, error: unknown }[] = [];

  try {
    ClientValidator.validateBrokerUrl(storage.brokerUrl);
  } catch (error) { errors.push({ value: storage.brokerUrl, field: 'brokerUrl', error }); }

  try {
    ClientValidator.validateRootTopic(storage.rootTopic);
  } catch (error) { errors.push({ value: storage.rootTopic, field: 'rootTopic', error }); }

  return errors;
}

export interface ClientStorageInjection {
  clientStorage: Readonly<Ref<ClientStorage>>;
  updateClientStorage: (newClientStorage: ClientStorage) => void;
}

export function newClientStorageInjection(): ClientStorageInjection {
  const key = 'client';
  const lsItem = localStorage.getItem(key);

  function sanitize(storage: ClientStorage): ClientStorage {
    const sanitizedStorage = cloneObject(storage);

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

export default function useClientStorage() {
  return inject(keys.clientStorage) as ClientStorageInjection;
};
