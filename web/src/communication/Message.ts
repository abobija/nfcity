import { PiccKey } from "@/models/Picc";

interface Message {
  $kind: string;
}

export abstract class DeviceMessage implements Message {
  readonly $kind: string;
  readonly $ctx?: {
    $id: string;
  };

  protected constructor(kind: string) {
    this.$kind = kind;
  }
}

export abstract class WebMessage implements Message {
  readonly $kind: string;
  readonly $id: string;

  protected constructor(kind: string) {
    this.$kind = kind;
    this.$id = crypto.randomUUID();
  }
}

export abstract class AuthorizedWebMessage extends WebMessage {
  readonly key: PiccKey;

  protected constructor(kind: string, key: PiccKey) {
    super(kind);
    this.key = key;
  }
}
