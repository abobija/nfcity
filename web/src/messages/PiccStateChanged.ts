import Picc, { PiccState } from "../models/Picc";
import Message from "./Message";

export default interface PiccStateChanged extends Message {
    old_state: PiccState;
    picc: Picc;
}

export const piccStateChangedKind = 'picc_state_changed';

export function isPiccStateChanged(msg: Message): msg is PiccStateChanged {
    return msg.kind === piccStateChangedKind;
}
