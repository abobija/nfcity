import { PiccKeyType } from "../../../models/Picc";
import { WebMessage } from "../Message";

export const readBlockMessageKind = 'read_block';

export default interface ReadBlockMessage extends WebMessage {
  address: number;
  key: Uint8Array;
  key_type: PiccKeyType;
}
