import Client from "@/comm/Client";
import { ClientEvent } from "@/comm/events/ClientEvent";

export default class ClientDisconnectEvent extends ClientEvent {
  static from(client: Client) {
    return new ClientDisconnectEvent(client);
  }
}
