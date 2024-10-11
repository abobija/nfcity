import Client from "../Client";
import { ClientEvent } from "./ClientEvent";

export default class ClientPongMissedEvent extends ClientEvent {
  lastPingTimestamp: number;
  lastPongTimestamp?: number;

  protected constructor(client: Client, lastPingTimestamp: number, lastPongTimestamp?: number) {
    super(client);
    this.lastPingTimestamp = lastPingTimestamp;
    this.lastPongTimestamp = lastPongTimestamp;
  }

  static from(client: Client, lastPingTimestamp: number, lastPongTimestamp?: number): ClientPongMissedEvent {
    return new ClientPongMissedEvent(client, lastPingTimestamp, lastPongTimestamp);
  }
}
