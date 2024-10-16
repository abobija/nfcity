import PiccBlockDto from "@/communication/dtos/PiccBlockDto";
import PiccKeyDto from "@/communication/dtos/PiccKeyDto";
import { AuthorizedWebMessage, WebMessageKind } from "@/communication/Message";
import { blockSize, MifareClassicMemory, throwIfAccessBitsIntegrityViolated } from "@/models/MifareClassic";
import { assert, isByte } from "@/utils/helpers";

export default class WriteBlockWebMessage extends AuthorizedWebMessage implements PiccBlockDto {
  readonly $kind: WebMessageKind = 'write_block';

  constructor(
    readonly address: number,
    readonly data: Uint8Array,
    key: PiccKeyDto,
  ) {
    assert(isByte(address), 'invalid address');
    assert(data?.length === blockSize, 'invalid data length');

    if (MifareClassicMemory.blockAtAddressIsSectorTrailer(address)) {
      throwIfAccessBitsIntegrityViolated(data[6], data[7], data[8]);
    }

    super(key);
  }
}
