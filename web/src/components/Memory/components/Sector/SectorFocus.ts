
import { MifareClassicSector } from "@/models/MifareClassic";
import BlockFocus from "@Memory/components/Block/BlockFocus";

export default class SectorFocus {
  readonly sector: MifareClassicSector;
  readonly blockFocus?: BlockFocus;

  protected constructor(sector: MifareClassicSector, blockFocus?: BlockFocus) {
    this.sector = sector;
    this.blockFocus = blockFocus;
  }

  static from(sector: MifareClassicSector, blockFocus?: BlockFocus): SectorFocus {
    return new SectorFocus(sector, blockFocus);
  }
}
