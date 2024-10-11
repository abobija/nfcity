import { DeviceMessage } from "@/communication/Message";

export default class PongDeviceMessage extends DeviceMessage {
  protected constructor() {
    super('pong');
  }

  static create() {
    return new PongDeviceMessage();
  }

  static is(message: DeviceMessage): message is PongDeviceMessage {
    return message.$kind === 'pong';
  }
}
