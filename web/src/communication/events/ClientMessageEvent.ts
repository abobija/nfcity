import Client from "@/communication/Client";
import { ClientEvent } from "@/communication/events/ClientEvent";
import { DeviceMessage } from "@/communication/Message";

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
