import PiccKeyDto from "@/communication/dtos/PiccKeyDto";
import { AuthorizedWebMessage, WebMessageKind } from "@/communication/Message";

export default class ReadSectorWebMessage extends AuthorizedWebMessage {
  readonly $kind: WebMessageKind = 'read_sector';

  constructor(readonly offset: number, readonly key: PiccKeyDto) {
    super(key);
    this.offset = offset;
  }
}
