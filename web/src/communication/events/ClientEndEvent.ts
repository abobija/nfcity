import Client from "@/communication/Client";
import { ClientEvent } from "@/communication/events/ClientEvent";

export default class ClientEndEvent extends ClientEvent {
  static from(client: Client) {
    return new ClientEndEvent(client);
  }
}
