import MemoryBlockFocus from "@/components/MemoryBlock/MemoryBlockFocus";
import { MifareClassicSector } from "@/models/MifareClassic";

export default class MemorySectorFocus {
  readonly sector: MifareClassicSector;
  readonly blockFocus?: MemoryBlockFocus;

  protected constructor(sector: MifareClassicSector, blockFocus?: MemoryBlockFocus) {
    this.sector = sector;
    this.blockFocus = blockFocus;
  }

  static from(sector: MifareClassicSector, blockFocus?: MemoryBlockFocus): MemorySectorFocus {
    return new MemorySectorFocus(sector, blockFocus);
  }
}
