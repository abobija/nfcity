import { BaseWebMessage } from "@/communication/Message";

export default class PingWebMessage extends BaseWebMessage {
  readonly $kind: string = 'ping';

  static create(): PingWebMessage {
    return new PingWebMessage();
  }
}
