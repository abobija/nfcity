import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import {
  AccessBitsComboPool,
  accessBitsComboPoolToBitsPool,
  accessBitsComboPoolToBytes,
  accessBitsPoolToBytes,
  blockSize,
  defaultKey
} from "@/models/MifareClassic";
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
      unhexToArray,
    };

    for (const [key, value] of Object.entries(functionsToExpose)) {
      const self = this as any;
      assert(typeof self[key] === 'undefined');
      self[key] = value;
    }
  }

  get client() {
    assert(this._client);
    return this._client;
  }

  set client(client: Client) {
    this._client = client;
  }

  async writeBlock(
    address: number,
    data: string,
    key: string = hex(defaultKey.value),
    keyType: KeyType = defaultKey.type,
  ) {
    assert(typeof address === 'number');
    assert(typeof data === 'string');
    assert(typeof key === 'string');
    assert(typeof keyType === 'number');

    return await this.client.send(
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

  buildSectorTrailer(
    keyA: string,
    accessBitsComboPool: AccessBitsComboPool,
    userByte: string,
    keyB: string,
  ): number[] {
    assert(typeof keyA === 'string');
    assert(typeof accessBitsComboPool === 'object');
    assert(typeof userByte === 'string');
    assert(typeof keyB === 'string');

    const accessBitsPool = accessBitsComboPoolToBitsPool(accessBitsComboPool);

    const data = [
      ...unhexToArray(keyA),
      ...accessBitsPoolToBytes(accessBitsPool),
      ...unhexToArray(userByte),
      ...unhexToArray(keyB),
    ];

    assert(data.length === blockSize);

    return data;
  }
}

const console = new Console();

if (DEV) {
  (window as any).nfcity = console;
  logi('Console mounted');
}

export default console;
