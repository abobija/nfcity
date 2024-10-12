import PiccBlockDto from "@/communication/dtos/PiccBlockDto";
import { AuthorizedWebMessage, WebMessageKind } from "@/communication/Message";
import { PiccKey } from "@/models/Picc";

export default class WriteBlockWebMessage extends AuthorizedWebMessage implements PiccBlockDto {
  readonly $kind: WebMessageKind = 'write_block';
  readonly address: number;
  readonly data: Uint8Array;

  protected constructor(block: PiccBlockDto, key: PiccKey) {
    super(key);
    this.address = block.address;
    this.data = block.data;
  }

  static from(block: PiccBlockDto, key: PiccKey): WriteBlockWebMessage {
    return new WriteBlockWebMessage(block, key);
  }
}
