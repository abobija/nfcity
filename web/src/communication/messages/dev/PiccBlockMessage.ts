import { DeviceMessage } from "../Message";

export const piccBlockMessageKind = 'picc_block';

export default interface PiccBlockMessage extends DeviceMessage {
  address: number;
  data: Uint8Array;
}

export function isPiccBlockMessage(message: DeviceMessage): message is PiccBlockMessage {
  return message.kind === piccBlockMessageKind;
}
