import { WebMessage } from "@/comm/msgs/Message";

export default class GetPiccWebMessage extends WebMessage {
  protected constructor() {
    super('get_picc');
  }

  static create(): GetPiccWebMessage {
    return new GetPiccWebMessage();
  }

  static is(message: WebMessage): message is GetPiccWebMessage {
    return message.$kind === 'get_picc';
  }
}
