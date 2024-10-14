
import { MifareClassicSector } from "@/models/MifareClassic";
import BlockFocus from "@Memory/components/Block/BlockFocus";

export default class SectorFocus {
  constructor(
    readonly sector: MifareClassicSector,
    readonly blockFocus?: BlockFocus,
  ) {
    this.sector = sector;
    this.blockFocus = blockFocus;
  }
}
