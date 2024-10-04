import Client from "@/comm/Client";
import { ClientEvent } from "@/comm/events/ClientEvent";

export default class ClientReadyEvent extends ClientEvent {
  static from(client: Client) {
    return new ClientReadyEvent(client);
  }
}
