import { DeviceMessage } from "../Message";

export const piccBlockKind = 'picc_block';

export default interface PiccBlockMessage extends DeviceMessage {
  address: number;
  data: Uint8Array;
}

export function isPiccBlock(message: DeviceMessage): message is PiccBlockMessage {
  return message.kind === piccBlockKind;
}
