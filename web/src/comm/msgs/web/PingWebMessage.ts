import { WebMessage } from "@/comm/msgs/Message";

export default class PingWebMessage extends WebMessage {
  protected constructor() {
    super('ping');
  }

  static create(): PingWebMessage {
    return new PingWebMessage();
  }

  static is(message: WebMessage): message is PingWebMessage {
    return message.$kind === 'ping';
  }
}
