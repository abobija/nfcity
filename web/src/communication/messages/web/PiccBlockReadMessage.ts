import { PiccKeyType } from "../../../models/Picc";
import { WebMessage } from "../Message";

export const piccBlockReadKind = 'picc_block_read';

export default interface PiccBlockReadMessage extends WebMessage {
  address: number;
  key: Uint8Array;
  key_type: PiccKeyType;
}
