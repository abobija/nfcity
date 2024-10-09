import { ClientValidator } from "@/comm/Client";

export interface ClientStorage {
  readonly brokerUrl?: string;
  readonly rootTopic?: string;
}

export interface IncompleteClientStorage extends ClientStorage { }

export interface CompleteClientStorage extends ClientStorage {
  readonly brokerUrl: string;
  readonly rootTopic: string;
}

export interface ValidClientStorage extends CompleteClientStorage { }

export function isCompleteClientStorage(storage: ClientStorage): storage is CompleteClientStorage {
  return (
    typeof storage.brokerUrl === 'string'
    && typeof storage.rootTopic === 'string'
  );
}

export function isValidClientStorage(storage: ClientStorage): storage is ValidClientStorage {
  return isCompleteClientStorage(storage)
    && validateClientStorage(storage).length === 0;
}

export function validateClientStorage(storage: ClientStorage) {
  const errors: { field: keyof ClientStorage, error: unknown }[] = [];

  try {
    ClientValidator.validateBrokerUrl(storage.brokerUrl);
  } catch (error) { errors.push({ field: 'brokerUrl', error }); }

  try {
    ClientValidator.validateRootTopic(storage.rootTopic);
  } catch (error) { errors.push({ field: 'rootTopic', error }); }

  return errors;
}
