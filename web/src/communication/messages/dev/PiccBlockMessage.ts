import { PiccBlock } from "../../../models/Picc";
import { DeviceMessage } from "../Message";

export const piccBlockMessageKind = 'picc_block';

export default interface PiccBlockMessage extends DeviceMessage {
  block: PiccBlock;
}

export function isPiccBlockMessage(message: DeviceMessage): message is PiccBlockMessage {
  return message.kind === piccBlockMessageKind;
}
