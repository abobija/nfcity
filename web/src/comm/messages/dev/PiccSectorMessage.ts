import PiccBlockDto from "../../dtos/PiccBlockDto";
import { DeviceMessage } from "../Message";

export const piccSectorMessageKind = 'picc_sector';

export default interface PiccSectorMessage extends DeviceMessage {
  offset: number;
  blocks: PiccBlockDto[];
}

export function isPiccSectorMessage(message: DeviceMessage): message is PiccSectorMessage {
  return message.kind === piccSectorMessageKind;
}
