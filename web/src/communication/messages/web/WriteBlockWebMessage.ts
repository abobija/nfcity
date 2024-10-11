import PiccBlockDto from "@/communication/dtos/PiccBlockDto";
import { AuthorizedWebMessage, WebMessageKind } from "@/communication/Message";
import { PiccKey } from "@/models/Picc";

export default class WriteBlockWebMessage extends AuthorizedWebMessage {
  readonly $kind: WebMessageKind = 'write_block';
  readonly block: PiccBlockDto;

  protected constructor(block: PiccBlockDto, key: PiccKey) {
    super(key);
    this.block = block;
  }

  static from(block: PiccBlockDto, key: PiccKey): WriteBlockWebMessage {
    return new WriteBlockWebMessage(block, key);
  }
}
