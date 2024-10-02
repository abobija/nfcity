import PiccDto from "../../dtos/PiccDto";
import { DeviceMessage } from "../Message";

export const piccStateChangedMessageKind = 'picc_state_changed';

export default interface PiccStateChangedMessage extends DeviceMessage {
  old_state: number;
  picc: PiccDto;
}

export function isPiccStateChangedMessage(message: DeviceMessage): message is PiccStateChangedMessage {
  return message.kind === piccStateChangedMessageKind;
}
