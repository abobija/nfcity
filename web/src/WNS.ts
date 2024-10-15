import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import { accessBitsComboPoolToBytes, defaultKey } from "@/models/MifareClassic";
import { KeyType } from "@/models/Picc";
import Client from "./communication/Client";
import { assert, bin, hex, unhexToArray } from "./utils/helpers";
import { logi } from "./utils/Logger";

const {
  DEV
} = import.meta.env;

/**
 * Window Namespace
 *
 * Functions that are exposed to the window object,
 * and can be called from the browser console.
 */
class WNS {
  private _client?: Client;

  constructor() {
    const functionsToExpose = {
      hex,
      bin,
      accessBitsComboPoolToBytes,
    };

    for (const [key, value] of Object.entries(functionsToExpose)) {
      (this as any)[key] = value;
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

const wns = new WNS();

if (DEV) {
  (window as any).nfcity = wns;
  logi('WNS mounted');
}

export default wns;
