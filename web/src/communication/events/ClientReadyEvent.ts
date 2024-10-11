import Client from "@/communication/Client";
import { ClientEvent } from "@/communication/events/ClientEvent";

export default class ClientReadyEvent extends ClientEvent {
  static from(client: Client) {
    return new ClientReadyEvent(client);
  }
}
