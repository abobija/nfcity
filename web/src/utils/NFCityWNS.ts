import Client from "@/communication/Client";
import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import { defaultKey } from "@/models/MifareClassic";
import { KeyType } from "@/models/Picc";
import { assert, hex, unhexToArray } from "./helpers";

export default class NFCityWNS {
  constructor(
    private readonly _client: Client,
  ) {
    assert(_client !== undefined);
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
