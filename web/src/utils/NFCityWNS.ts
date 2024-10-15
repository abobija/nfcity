import Client from "@/communication/Client";
import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import { blockSize, defaultKey, keySize } from "@/models/MifareClassic";
import { keyA, keyB, KeyType } from "@/models/Picc";
import { assert, hex, isByte, unhexToArray } from "./helpers";

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
    assert(isByte(address), 'address must be a byte');
    assert(data.length === 2 * blockSize, 'data must be 16 bytes');
    assert(key.length === 2 * keySize, 'key must be 6 bytes');
    assert(keyType === keyA || keyType === keyB, 'keyType must be keyA (0) or keyB (1)');

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
