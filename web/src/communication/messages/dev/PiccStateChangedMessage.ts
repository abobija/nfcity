import Picc, { PiccState } from "../../../models/Picc";
import { DeviceMessage } from "../Message";

export const piccStateChangedKind = 'picc_state_changed';

export default interface PiccStateChangedMessage extends DeviceMessage {
  old_state: PiccState;
  picc: Picc;
}

export function isPiccStateChanged(message: DeviceMessage): message is PiccStateChangedMessage {
  return message.kind === piccStateChangedKind;
}
