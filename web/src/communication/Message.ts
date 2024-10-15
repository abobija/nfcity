import Dto from "@/communication/Dto";
import PiccKeyDto from "@/communication/dtos/PiccKeyDto";
import { keySize } from "@/models/MifareClassic";
import { keyA, keyB } from "@/models/Picc";
import { assert } from "@/utils/helpers";

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

type WebMessageId = string;

interface Message extends Dto { }

export interface DeviceMessageContext extends Dto {
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
}

export abstract class AuthorizedWebMessage extends BaseWebMessage {
  constructor(readonly key: PiccKeyDto) {
    assert(key?.value?.length === keySize, 'invalid key length');
    assert(key.type === keyA || key.type === keyB, 'invalid key type');

    super();
    this.key = key;
  }
}
