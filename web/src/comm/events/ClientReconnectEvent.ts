import Client from "@/comm/Client";
import { ClientEvent } from "@/comm/events/ClientEvent";

export default class ClientReconnectEvent extends ClientEvent {
  static from(client: Client) {
    return new ClientReconnectEvent(client);
  }
}
