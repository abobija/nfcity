import { DeviceMessage, DeviceMessageContext } from "@/communication/Message";

/**
 * Message sent by the device on connection with the broker.
 */
export default class HelloDeviceMessage implements DeviceMessage {
  readonly $kind: string = 'hello';
  readonly $ctx?: DeviceMessageContext | undefined;

  protected constructor() { }

  static create() {
    return new HelloDeviceMessage();
  }

  static is(message: DeviceMessage): message is HelloDeviceMessage {
    return message.$kind === 'hello';
  }
}
