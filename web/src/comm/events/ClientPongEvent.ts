import Client from "@/comm/Client";
import { ClientEvent } from "@/comm/events/ClientEvent";

export default class ClientPongEvent extends ClientEvent {
  readonly pingTimestamp: number;
  readonly pongTimestamp: number;

  get latency(): number {
    return this.pongTimestamp - this.pingTimestamp;
  }

  protected constructor(
    client: Client,
    pingTimestamp: number,
    pongTimestamp: number
  ) {
    super(client);
    this.pingTimestamp = pingTimestamp;
    this.pongTimestamp = pongTimestamp;
  }

  static from(
    client: Client,
    pingTimestamp: number,
    pongTimestamp: number
  ): ClientPongEvent {
    return new ClientPongEvent(client, pingTimestamp, pongTimestamp);
  }
}
