import { DeviceMessage } from "@/communication/Message";

/**
 * Message sent by the device on connection with the broker.
 */
export default class HelloDevMessage extends DeviceMessage {
  protected constructor() {
    super('hello');
  }

  static create() {
    return new HelloDevMessage();
  }

  static is(message: DeviceMessage): message is HelloDevMessage {
    return message.$kind === 'hello';
  }
}
