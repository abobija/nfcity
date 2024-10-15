import PiccKeyDto from "@/communication/dtos/PiccKeyDto";
import { AuthorizedWebMessage, WebMessageKind } from "@/communication/Message";
import { assert, isByte } from "@/utils/helpers";

export default class ReadSectorWebMessage extends AuthorizedWebMessage {
  readonly $kind: WebMessageKind = 'read_sector';

  constructor(readonly offset: number, readonly key: PiccKeyDto) {
    assert(isByte(offset), 'invalid offset');

    super(key);
    this.offset = offset;
  }
}
