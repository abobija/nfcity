import { PiccKey } from "@/models/Picc";

interface Message { }

export interface DeviceMessage extends Message {
  kind: string;
}

export interface WebMessage extends Message {
  kind?: string;
}

export interface AuthorizedWebMessage extends WebMessage {
  key: PiccKey;
}
