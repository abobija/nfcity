import { MifareClassicBlockGroup } from "@/models/MifareClassic";
import BlockFocus from "@Memory/components/Block/BlockFocus";
import BlockGroupFocus from "@Memory/components/BlockGroup/BlockGroupFocus";
import ByteFocus from "@Memory/components/Byte/ByteFocus";
import SectorFocus from "@Memory/components/Sector/SectorFocus";

export default class MemoryFocus {
  readonly sectorFocus: SectorFocus;

  protected constructor(sectorFocus: SectorFocus) {
    this.sectorFocus = sectorFocus;
  }

  static byte(group: MifareClassicBlockGroup, index: number): MemoryFocus {
    const byf = new ByteFocus(group, index);
    const gf = new BlockGroupFocus(group, byf);
    const bf = new BlockFocus(group.block, gf);
    const sf = new SectorFocus(group.block.sector, bf);

    return new MemoryFocus(sf);
  }
}
