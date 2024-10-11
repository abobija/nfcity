import { DeviceMessage } from "@/communication/Message";

export default class ErrorDeviceMessage extends DeviceMessage {
  protected constructor() {
    super('error');
  }

  static create() {
    return new ErrorDeviceMessage();
  }

  static is(message: DeviceMessage): message is ErrorDeviceMessage {
    return message.$kind === 'error';
  }
}
