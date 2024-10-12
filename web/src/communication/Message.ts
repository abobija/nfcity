import PiccKeyDto from "@/communication/dtos/PiccKeyDto";

export type WebMessageKind =
  | 'ping'
  | 'get_picc'
  | 'read_sector'
  | 'write_block';

export type DeviceMessageKind =
  | 'pong'
  | 'picc'
  | 'picc_sector'
  | 'picc_block'
  | 'hello'
  | 'picc_state_changed'
  | 'error';

interface Message { }

type WebMessageId = string;

export interface DeviceMessageContext {
  readonly $id: WebMessageId;
}

export interface DeviceMessage extends Message {
  readonly $kind: DeviceMessageKind;
  readonly $ctx?: DeviceMessageContext;
}

export interface WebMessage extends Message {
  readonly $kind: WebMessageKind;
  readonly $id: WebMessageId;
}

export abstract class BaseWebMessage implements WebMessage {
  abstract $kind: WebMessageKind;
  readonly $id: WebMessageId = crypto.randomUUID();

  protected constructor() { }
}

export abstract class AuthorizedWebMessage extends BaseWebMessage {
  readonly key: PiccKeyDto;

  protected constructor(key: PiccKeyDto) {
    super();
    this.key = key;
  }
}
