import Client from "@/comm/Client";
import { ClientEvent } from "@/comm/events/ClientEvent";
import { DeviceMessage } from "@/comm/msgs/Message";

export default class ClientMessageEvent extends ClientEvent {
  readonly message: DeviceMessage;

  protected constructor(client: Client, message: DeviceMessage) {
    super(client);
    this.message = message;
  }

  static from(client: Client, message: DeviceMessage) {
    return new ClientMessageEvent(client, message);
  }
}
