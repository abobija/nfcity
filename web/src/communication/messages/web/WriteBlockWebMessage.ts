import PiccBlockDto from "@/communication/dtos/PiccBlockDto";
import PiccKeyDto from "@/communication/dtos/PiccKeyDto";
import { AuthorizedWebMessage, WebMessageKind } from "@/communication/Message";
import { blockSize } from "@/models/MifareClassic";
import { assert, isByte } from "@/utils/helpers";

export default class WriteBlockWebMessage extends AuthorizedWebMessage implements PiccBlockDto {
  readonly $kind: WebMessageKind = 'write_block';

  constructor(
    readonly address: number,
    readonly data: Uint8Array,
    readonly key: PiccKeyDto
  ) {
    assert(isByte(address), 'invalid address');
    assert(data?.length === blockSize, 'invalid data length');

    super(key);
  }
}
