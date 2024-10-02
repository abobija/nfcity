import PiccDto from "../../dtos/PiccDto";
import { DeviceMessage } from "../Message";

export const piccMessageKind = 'picc';

export default interface PiccMessage extends DeviceMessage {
  picc: PiccDto;
}

export function isPiccMessage(message: DeviceMessage): message is PiccMessage {
  return message.kind === piccMessageKind;
}
