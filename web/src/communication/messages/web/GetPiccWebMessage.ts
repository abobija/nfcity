import { BaseWebMessage, WebMessageKind } from "@/communication/Message";

export default class GetPiccWebMessage extends BaseWebMessage {
  readonly $kind: WebMessageKind = 'get_picc';
}
