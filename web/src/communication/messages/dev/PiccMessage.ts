import Picc from "../../../models/Picc";
import { DeviceMessage } from "../Message";

export const piccKind = 'picc';

export default interface PiccMessage extends DeviceMessage {
  picc: Picc;
}

export function isPicc(message: DeviceMessage): message is PiccMessage {
  return message.kind === piccKind;
}
