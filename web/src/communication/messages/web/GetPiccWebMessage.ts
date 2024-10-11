import { BaseWebMessage } from "@/communication/Message";

export default class GetPiccWebMessage extends BaseWebMessage {
  readonly $kind: string = 'get_picc';

  static create(): GetPiccWebMessage {
    return new GetPiccWebMessage();
  }
}
