import PiccDto from "@/comm/dtos/PiccDto";
import { DeviceMessage } from "@/comm/msgs/Message";

export default interface PiccDevMessage extends DeviceMessage {
  picc: PiccDto;
}

export function isPiccDevMessage(message: DeviceMessage): message is PiccDevMessage {
  return message.kind === 'picc';
}
