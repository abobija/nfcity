import Client from "@/comm/Client";
import { ClientEvent } from "@/comm/events/ClientEvent";

export default class ClientPongMissedEvent extends ClientEvent {
  static from(client: Client): ClientPongMissedEvent {
    return new ClientPongMissedEvent(client);
  }
}
