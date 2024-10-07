import Client from "@/comm/Client";
import { ClientEvent } from "@/comm/events/ClientEvent";

export default class ClientEndEvent extends ClientEvent {
  static from(client: Client) {
    return new ClientEndEvent(client);
  }
}
