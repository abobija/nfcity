import { PiccKeyType } from "../../models/Picc";
import { WebMessage } from "./Message";

export default interface PiccReadBlockMessage extends WebMessage {
    address: number;
    key: Uint8Array;
    key_type: PiccKeyType;
}
