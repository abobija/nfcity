import Client from "@/comm/Client";
import { ClientEvent } from "@/comm/events/ClientEvent";

export default class ClientPongEvent extends ClientEvent {
  readonly timestamp: number;

  protected constructor(client: Client, timestamp: number) {
    super(client);
    this.timestamp = timestamp;
  }

  static from(client: Client, timestamp: number) {
    return new ClientPongEvent(client, timestamp);
  }
}
