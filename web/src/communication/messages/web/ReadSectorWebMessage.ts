import { AuthorizedWebMessage, WebMessageKind } from "@/communication/Message";
import { PiccKey } from "@/models/Picc";

export default class ReadSectorWebMessage extends AuthorizedWebMessage {
  readonly $kind: WebMessageKind = 'read_sector';
  readonly offset: number;

  protected constructor(offset: number, key: PiccKey) {
    super(key);
    this.offset = offset;
  }

  static from(offset: number, key: PiccKey): ReadSectorWebMessage {
    return new ReadSectorWebMessage(offset, key);
  }
}
