interface ClientStorage {
  readonly brokerUrl: string;
  readonly rootTopic?: string;
}

export interface NonValidatedClientStorage extends ClientStorage { }

export interface ValidatedClientStorage extends ClientStorage {
  readonly rootTopic: string;
}
