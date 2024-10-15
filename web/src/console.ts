import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import { accessBitsComboPoolToBytes, defaultKey } from "@/models/MifareClassic";
import { KeyType } from "@/models/Picc";
import Client from "./communication/Client";
import { assert, bin, hex, unhexToArray } from "./utils/helpers";
import { logi } from "./utils/Logger";

const {
  DEV,
} = import.meta.env;

class Console {
  private _client?: Client;

  constructor() {
    const functionsToExpose = {
      hex,
      bin,
      accessBitsComboPoolToBytes,
    };

    for (const [key, value] of Object.entries(functionsToExpose)) {
      const self = this as any;
      assert(typeof self[key] === 'undefined');
      self[key] = value;
    }
  }

  set client(client: Client) {
    this._client = client;
  }

  async piccWrite(
    address: number,
    data: string,
    key: string = hex(defaultKey.value),
    keyType: KeyType = defaultKey.type,
  ) {
    assert(this._client);

    return await this._client.send(
      new WriteBlockWebMessage(
        address,
        Uint8Array.from(unhexToArray(data)),
        {
          value: Uint8Array.from(unhexToArray(key)),
          type: keyType,
        }
      )
    )
  }
}

const console = new Console();

if (DEV) {
  (window as any).nfcity = console;
  logi('Console mounted');
}

export default console;
