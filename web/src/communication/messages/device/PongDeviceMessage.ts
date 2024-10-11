import { DeviceMessage, DeviceMessageContext } from "@/communication/Message";

export default class PongDeviceMessage implements DeviceMessage {
  readonly $kind: string = 'pong';
  readonly $ctx?: DeviceMessageContext | undefined;

  protected constructor() { }

  static create() {
    return new PongDeviceMessage();
  }

  static is(message: DeviceMessage): message is PongDeviceMessage {
    return message.$kind === 'pong';
  }
}
