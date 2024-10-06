import { MifareClassicSector } from "@/models/MifareClassic";
import { PiccKey } from "@/models/Picc";

export default class MemorySectorUnlockEvent {
  readonly sector: MifareClassicSector;
  readonly key: PiccKey;

  protected constructor(sector: MifareClassicSector, key: PiccKey) {
    this.sector = sector;
    this.key = key;
  }

  static from(sector: MifareClassicSector, key: PiccKey): MemorySectorUnlockEvent {
    return new MemorySectorUnlockEvent(sector, key);
  }
}
