import { DeviceMessage } from "@/communication/Message";

/**
 * Message sent by the device on connection with the broker.
 */
export default class HelloDeviceMessage extends DeviceMessage {
  protected constructor() {
    super('hello');
  }

  static create() {
    return new HelloDeviceMessage();
  }

  static is(message: DeviceMessage): message is HelloDeviceMessage {
    return message.$kind === 'hello';
  }
}
