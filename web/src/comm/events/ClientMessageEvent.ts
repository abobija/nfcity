import { DeviceMessage } from "../msgs/Message";

export default class ClientMessageEvent {
  readonly message: DeviceMessage;

  protected constructor(message: DeviceMessage) {
    this.message = message;
  }

  static from(message: DeviceMessage) {
    return new ClientMessageEvent(message);
  }
}
