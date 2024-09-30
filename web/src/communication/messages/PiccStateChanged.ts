import Picc, { PiccState } from "../../models/Picc";
import { DeviceMessage } from "./Message";

export default interface PiccStateChanged extends DeviceMessage {
    old_state: PiccState;
    picc: Picc;
}

export const piccStateChangedKind = 'picc_state_changed';

export function isPiccStateChanged(message: DeviceMessage): message is PiccStateChanged {
    return message.kind === piccStateChangedKind;
}
