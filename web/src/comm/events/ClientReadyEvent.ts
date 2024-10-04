import Client from "../Client";

export default class ClientReadyEvent {
  readonly client: Client;

  protected constructor(client: Client) {
    this.client = client;
  }

  static from(client: Client) {
    return new ClientReadyEvent(client);
  }
}
