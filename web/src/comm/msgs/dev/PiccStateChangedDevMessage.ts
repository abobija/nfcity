import PiccDto from "@/comm/dtos/PiccDto";
import { DeviceMessage } from "@/comm/msgs/Message";

export default interface PiccStateChangedDevMessage extends DeviceMessage {
  old_state: number;
  picc: PiccDto;
}

export function isPiccStateChangedDevMessage(message: DeviceMessage): message is PiccStateChangedDevMessage {
  return message.kind === 'picc_state_changed';
}
