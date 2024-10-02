import PiccBlockDto from "../../dtos/PiccBlockDto";
import { DeviceMessage } from "../Message";

export default interface PiccBlockDevMessage extends DeviceMessage {
  block: PiccBlockDto;
}

export function isPiccBlockDevMessage(message: DeviceMessage): message is PiccBlockDevMessage {
  return message.kind === 'picc_block';
}
