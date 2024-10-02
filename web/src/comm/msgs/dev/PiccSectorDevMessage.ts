import PiccBlockDto from "@/comm/dtos/PiccBlockDto";
import { DeviceMessage } from "@/comm/msgs/Message";

export default interface PiccSectorDevMessage extends DeviceMessage {
  offset: number;
  blocks: PiccBlockDto[];
}

export function isPiccSectorDevMessage(message: DeviceMessage): message is PiccSectorDevMessage {
  return message.kind === 'picc_sector';
}
