import { PiccKey } from "@/models/Picc";

interface Message {
  readonly $kind: string;
}

export interface DeviceMessageContext {
  readonly $id: string;
}

export interface DeviceMessage extends Message {
  readonly $ctx?: DeviceMessageContext;
}

export interface WebMessage extends Message {
  readonly $id: string;
}

export abstract class BaseWebMessage implements WebMessage {
  abstract $kind: string;
  readonly $id: string = crypto.randomUUID();
}

export abstract class AuthorizedWebMessage extends BaseWebMessage {
  abstract key: PiccKey;
}
