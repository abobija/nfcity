import { PiccKey } from "@/models/Picc";

export type WebMessageKind =
  | 'ping'
  | 'get_picc'
  | 'read_sector';

export type DeviceMessageKind =
  | 'pong'
  | 'picc'
  | 'picc_sector'
  | 'hello'
  | 'picc_state_changed'
  | 'error';

interface Message { }

export interface DeviceMessageContext {
  readonly $id: string;
}

export interface DeviceMessage extends Message {
  readonly $kind: DeviceMessageKind;
  readonly $ctx?: DeviceMessageContext;
}

export interface WebMessage extends Message {
  readonly $kind: WebMessageKind;
  readonly $id: string;
}

export abstract class BaseWebMessage implements WebMessage {
  abstract $kind: WebMessageKind;
  readonly $id: string = crypto.randomUUID();

  protected constructor() { }
}

export abstract class AuthorizedWebMessage extends BaseWebMessage {
  abstract key: PiccKey;
}
