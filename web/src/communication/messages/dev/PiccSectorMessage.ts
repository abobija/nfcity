import { DeviceMessage } from "../Message";
import { PiccBlockMessageData } from "./PiccBlockMessage";

export const piccSectorMessageKind = 'picc_sector';

export default interface PiccSectorMessage extends DeviceMessage {
  offset: number;
  blocks: PiccBlockMessageData[];
}

export function isPiccSectorMessage(message: DeviceMessage): message is PiccSectorMessage {
  return message.kind === piccSectorMessageKind;
}
