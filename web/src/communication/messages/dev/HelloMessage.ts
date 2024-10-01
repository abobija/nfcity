import Picc from "../../../models/Picc";
import { DeviceMessage } from "../Message";

export const helloMessageKind = 'hello';

/**
 * Message sent by the device on connection with the broker.
 */
export default interface HelloMessage extends DeviceMessage {
  picc: Picc;
}

export function isHelloMessage(message: DeviceMessage): message is HelloMessage {
  return message.kind === helloMessageKind;
}
