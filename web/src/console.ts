import Client from "@/communication/Client";
import { isPiccSectorDeviceMessage } from "@/communication/messages/device/PiccSectorDeviceMessage";
import ReadSectorWebMessage from "@/communication/messages/web/ReadSectorWebMessage";
import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import {
  AccessBitsComboPool,
  accessBitsComboPoolToBitsPool,
  accessBitsComboPoolToBytes,
  accessBitsPoolToBytes,
  blockSize,
  defaultKey
} from "@/models/MifareClassic/MifareClassic";
import { KeyType } from "@/models/Picc";
import { assert, bin, hex, unhexToArray } from "@/utils/helpers";
import { logd } from "@/utils/Logger";

const {
  DEV,
} = import.meta.env;

class NFCityConsole {
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
    assert(this._client, 'client is not set');
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

  async readSector(
    offset: number,
    key: string = hex(defaultKey.value),
    keyType: KeyType = defaultKey.type,
  ) {
    assert(typeof offset === 'number');
    assert(typeof key === 'string');
    assert(typeof keyType === 'number');

    const response = await this.client.transceive(
      new ReadSectorWebMessage(
        offset,
        {
          value: Uint8Array.from(unhexToArray(key)),
          type: keyType,
        }
      )
    );

    assert(isPiccSectorDeviceMessage(response));

    console.table(Object.fromEntries(response.blocks.map(block => [
      block.address,
      {
        address: hex(block.address),
        data: hex(Array.from(block.data)),
      }
    ])));

    return response;
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

const nfcityConsole = new NFCityConsole();

if (DEV) {
  (window as any).nfcity = nfcityConsole;
  logd('Console mounted');
}

export default nfcityConsole;
