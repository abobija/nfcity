import { AuthorizedWebMessage } from "@/communication/msgs/Message";
import { PiccKey } from "@/models/Picc";

export default class ReadSectorWebMessage extends AuthorizedWebMessage {
  readonly offset: number;

  protected constructor(offset: number, key: PiccKey) {
    super('read_sector', key);
    this.offset = offset;
  }

  static from(offset: number, key: PiccKey): ReadSectorWebMessage {
    return new ReadSectorWebMessage(offset, key);
  }

  static is(message: AuthorizedWebMessage): message is ReadSectorWebMessage {
    return message.$kind === 'read_sector';
  }
}
