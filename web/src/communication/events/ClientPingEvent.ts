import Client from "@/communication/Client";
import { ClientEvent } from "@/communication/events/ClientEvent";

export default class ClientPingEvent extends ClientEvent {
  constructor(
    readonly client: Client,
    readonly timestamp: number,
  ) {
    super(client);
    this.timestamp = timestamp;
  }
}
