import Client from "@/communication/Client";
import { ClientEvent } from "@/communication/events/ClientEvent";

export default class ClientOfflineEvent extends ClientEvent {
  static from(client: Client) {
    return new ClientOfflineEvent(client);
  }
}
