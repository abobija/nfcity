import SectorFocus from "@/components/Memory/components/Sector/SectorFocus";
import { MifareClassicBlockGroup } from "@/models/MifareClassic";
import BlockFocus from "./components/Block/BlockFocus";
import BlockGroupFocus from "./components/BlockGroup/BlockGroupFocus";
import ByteFocus from "./components/Byte/ByteFocus";

export default class MemoryFocus {
  readonly sectorFocus: SectorFocus;

  protected constructor(sectorFocus: SectorFocus) {
    this.sectorFocus = sectorFocus;
  }

  static byte(group: MifareClassicBlockGroup, index: number): MemoryFocus {
    const byf = ByteFocus.from(group, index);
    const gf = BlockGroupFocus.from(group, byf);
    const bf = BlockFocus.from(group.block, gf);
    const sf = SectorFocus.from(group.block.sector, bf);

    return new MemoryFocus(sf);
  }
}
