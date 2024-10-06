import { DeviceMessage } from "@/comm/msgs/Message";

export default class ErrorDevMessage extends DeviceMessage {
  protected constructor() {
    super('error');
  }

  static create() {
    return new ErrorDevMessage();
  }

  static is(message: DeviceMessage): message is ErrorDevMessage {
    return message.$kind === 'error';
  }
}
