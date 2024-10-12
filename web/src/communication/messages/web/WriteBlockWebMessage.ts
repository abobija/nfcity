import PiccBlockDto from "@/communication/dtos/PiccBlockDto";
import PiccKeyDto from "@/communication/dtos/PiccKeyDto";
import { AuthorizedWebMessage, WebMessageKind } from "@/communication/Message";

export default class WriteBlockWebMessage extends AuthorizedWebMessage implements PiccBlockDto {
  readonly $kind: WebMessageKind = 'write_block';
  readonly address: number;
  readonly data: Uint8Array;

  protected constructor(block: PiccBlockDto, key: PiccKeyDto) {
    super(key);
    this.address = block.address;
    this.data = block.data;
  }

  static from(block: PiccBlockDto, key: PiccKeyDto): WriteBlockWebMessage {
    return new WriteBlockWebMessage(block, key);
  }
}
