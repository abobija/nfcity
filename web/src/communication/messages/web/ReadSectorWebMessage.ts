import { AuthorizedWebMessage } from "@/communication/Message";
import { PiccKey } from "@/models/Picc";

export default class ReadSectorWebMessage extends AuthorizedWebMessage {
  readonly $kind: string = 'read_sector';
  readonly key: PiccKey;
  readonly offset: number;

  protected constructor(offset: number, key: PiccKey) {
    super();
    this.offset = offset;
    this.key = key;
  }

  static from(offset: number, key: PiccKey): ReadSectorWebMessage {
    return new ReadSectorWebMessage(offset, key);
  }
}
