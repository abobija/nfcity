import PiccDto from "../../dtos/PiccDto";
import { DeviceMessage } from "../Message";

export default interface PiccDevMessage extends DeviceMessage {
  picc: PiccDto;
}

export function isPiccDevMessage(message: DeviceMessage): message is PiccDevMessage {
  return message.kind === 'picc';
}
