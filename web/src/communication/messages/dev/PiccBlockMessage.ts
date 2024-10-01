import { DeviceMessage } from "../Message";

export const piccBlockMessageKind = 'picc_block';

export interface PiccBlockMessageData {
  address: number;
  offset: number;
  data: Uint8Array;
}

export default interface PiccBlockMessage extends DeviceMessage {
  block: PiccBlockMessageData;
}

export function isPiccBlockMessage(message: DeviceMessage): message is PiccBlockMessage {
  return message.kind === piccBlockMessageKind;
}
