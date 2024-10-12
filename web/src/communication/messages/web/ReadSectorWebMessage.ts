import PiccKeyDto from "@/communication/dtos/PiccKeyDto";
import { AuthorizedWebMessage, WebMessageKind } from "@/communication/Message";

export default class ReadSectorWebMessage extends AuthorizedWebMessage {
  readonly $kind: WebMessageKind = 'read_sector';
  readonly offset: number;

  protected constructor(offset: number, key: PiccKeyDto) {
    super(key);
    this.offset = offset;
  }

  static from(offset: number, key: PiccKeyDto): ReadSectorWebMessage {
    return new ReadSectorWebMessage(offset, key);
  }
}
