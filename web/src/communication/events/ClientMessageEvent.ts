import Client from "@/communication/Client";
import { ClientEvent } from "@/communication/events/ClientEvent";
import { DeviceMessage } from "@/communication/Message";

export default class ClientMessageEvent extends ClientEvent {
  constructor(
    readonly client: Client,
    readonly message: DeviceMessage,
  ) {
    super(client);
    this.message = message;
  }
}
