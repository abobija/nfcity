import { BaseWebMessage, WebMessageKind } from "@/communication/Message";

export default class PingWebMessage extends BaseWebMessage {
  readonly $kind: WebMessageKind = 'ping';

  static create(): PingWebMessage {
    return new PingWebMessage();
  }
}
