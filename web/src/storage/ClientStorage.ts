export interface ClientStorage {
  readonly brokerUrl?: string;
  readonly rootTopic?: string;
}

export interface IncompleteClientStorage extends ClientStorage { }

export interface CompleteClientStorage extends ClientStorage {
  readonly brokerUrl: string;
  readonly rootTopic: string;
}

export function isCompleteClientStorage(storage: ClientStorage): storage is CompleteClientStorage {
  return (
    typeof storage.brokerUrl === 'string'
    && typeof storage.rootTopic === 'string'
  );
}
