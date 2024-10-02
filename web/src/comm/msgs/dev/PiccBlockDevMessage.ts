import PiccBlockDto from "@/comm/dtos/PiccBlockDto";
import { DeviceMessage } from "@/comm/msgs/Message";

export default interface PiccBlockDevMessage extends DeviceMessage {
  block: PiccBlockDto;
}

export function isPiccBlockDevMessage(message: DeviceMessage): message is PiccBlockDevMessage {
  return message.kind === 'picc_block';
}
