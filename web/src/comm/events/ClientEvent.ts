import Client from "@/comm/Client";

export abstract class ClientEvent {
  readonly client: Client;

  protected constructor(client: Client) {
    this.client = client;
  }
}
