import Client from "@/communication/Client";
import { ClientEvent } from "@/communication/events/ClientEvent";

export default class ClientDisconnectEvent extends ClientEvent {
  static from(client: Client) {
    return new ClientDisconnectEvent(client);
  }
}
