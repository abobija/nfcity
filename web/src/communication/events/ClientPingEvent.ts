import Client from "@/communication/Client";
import { ClientEvent } from "@/communication/events/ClientEvent";

export default class ClientPingEvent extends ClientEvent {
  readonly timestamp: number;

  protected constructor(client: Client, timestamp: number) {
    super(client);
    this.timestamp = timestamp;
  }

  static from(client: Client, timestamp: number) {
    return new ClientPingEvent(client, timestamp);
  }
}
