import Client from "@/communication/Client";
import { ClientEvent } from "@/communication/events/ClientEvent";

export default class ClientCloseEvent extends ClientEvent {
  static from(client: Client) {
    return new ClientCloseEvent(client);
  }
}
