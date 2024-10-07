import Client from "@/comm/Client";
import { ClientEvent } from "@/comm/events/ClientEvent";

export default class ClientOfflineEvent extends ClientEvent {
  static from(client: Client) {
    return new ClientOfflineEvent(client);
  }
}
