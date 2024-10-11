import { DeviceMessage, DeviceMessageContext } from "@/communication/Message";

export default class ErrorDeviceMessage implements DeviceMessage {
  readonly $kind: string = 'error';
  readonly $ctx?: DeviceMessageContext;

  protected constructor() { }

  static create() {
    return new ErrorDeviceMessage();
  }

  static is(message: DeviceMessage): message is ErrorDeviceMessage {
    return message.$kind === 'error';
  }
}
