import Client from "@/communication/Client";
import { ClientEvent } from "@/communication/events/ClientEvent";

export default class ClientPongEvent extends ClientEvent {
  constructor(
    readonly client: Client,
    readonly pingTimestamp: number,
    readonly pongTimestamp: number,
  ) {
    super(client);
    this.pingTimestamp = pingTimestamp;
    this.pongTimestamp = pongTimestamp;
  }

  get latency(): number {
    return this.pongTimestamp - this.pingTimestamp;
  }
}
