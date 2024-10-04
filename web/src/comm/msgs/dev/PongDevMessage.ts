import { DeviceMessage } from "@/comm/msgs/Message";

export default class PongDevMessage extends DeviceMessage {
  protected constructor() {
    super('pong');
  }

  static create() {
    return new PongDevMessage();
  }

  static is(message: DeviceMessage): message is PongDevMessage {
    return message.$kind === 'pong';
  }
}
