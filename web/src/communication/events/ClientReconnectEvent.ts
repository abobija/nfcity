import Client from "@/communication/Client";
import { ClientEvent } from "@/communication/events/ClientEvent";

export default class ClientReconnectEvent extends ClientEvent {
  static from(client: Client) {
    return new ClientReconnectEvent(client);
  }
}
