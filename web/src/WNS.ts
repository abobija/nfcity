import Client from "@/communication/Client";
import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import { accessBitsComboPoolToBytes, defaultKey } from "@/models/MifareClassic";
import { KeyType } from "@/models/Picc";
import { assert, bin, hex, unhexToArray } from "./utils/helpers";

/**
 * Window Namespace
 *
 * Functions that are exposed to the window object,
 * and can be called from the browser console.
 */
export default class WNS {
  constructor(
    private readonly _client: Client,
  ) {
    assert(_client !== undefined);

    const functionsToExpose = {
      hex,
      bin,
      accessBitsComboPoolToBytes,
    };

    for (const [key, value] of Object.entries(functionsToExpose)) {
      (this as any)[key] = value;
    }
  }

  async piccWrite(
    address: number,
    data: string,
    key: string = hex(defaultKey.value),
    keyType: KeyType = defaultKey.type,
  ) {
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
