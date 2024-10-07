import Client from "@/comm/Client";
import { ClientEvent } from "@/comm/events/ClientEvent";

export default class ClientCloseEvent extends ClientEvent {
  static from(client: Client) {
    return new ClientCloseEvent(client);
  }
}
