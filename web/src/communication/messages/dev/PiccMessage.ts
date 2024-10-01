import Picc from "../../../models/Picc";
import { DeviceMessage } from "../Message";

export const piccMessageKind = 'picc';

export default interface PiccMessage extends DeviceMessage {
  picc: Picc;
}

export function isPiccMessage(message: DeviceMessage): message is PiccMessage {
  return message.kind === piccMessageKind;
}
