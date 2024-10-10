import Client, { ClientValidator } from "@/comm/Client";

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
