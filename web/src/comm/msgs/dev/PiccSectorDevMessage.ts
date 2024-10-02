import PiccBlockDto from "../../dtos/PiccBlockDto";
import { DeviceMessage } from "../Message";

export default interface PiccSectorDevMessage extends DeviceMessage {
  offset: number;
  blocks: PiccBlockDto[];
}

export function isPiccSectorDevMessage(message: DeviceMessage): message is PiccSectorDevMessage {
  return message.kind === 'picc_sector';
}
