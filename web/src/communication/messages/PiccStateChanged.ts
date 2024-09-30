import Picc, { PiccState } from "../../models/Picc";
import Message from "./Message";

export default interface PiccStateChanged extends Message {
    old_state: PiccState;
    picc: Picc;
}

export const piccStateChangedKind = 'picc_state_changed';

export function isPiccStateChanged(message: Message): message is PiccStateChanged {
    return message.kind === piccStateChangedKind;
}
