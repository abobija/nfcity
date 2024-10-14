import Client from "@/communication/Client";
import { ClientEvent } from "@/communication/events/ClientEvent";

export default class ClientPongMissedEvent extends ClientEvent {
  constructor(
    readonly client: Client,
    readonly lastPingTimestamp: number,
    readonly lastPongTimestamp?: number,
  ) {
    super(client);
    this.lastPingTimestamp = lastPingTimestamp;
    this.lastPongTimestamp = lastPongTimestamp;
  }
}
