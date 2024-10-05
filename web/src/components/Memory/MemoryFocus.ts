import { MifareClassicBlockGroup } from "@/models/MifareClassic";
import MemoryBlockFocus from "../MemoryBlock/MemoryBlockFocus";
import MemoryBlockGroupFocus from "../MemoryBlockGroup/MemoryBlockGroupFocus";
import MemoryByteFocus from "../MemoryByte/MemoryByteFocus";
import MemorySectorFocus from "../MemorySector/MemorySectorFocus";

export default class MemoryFocus {
  readonly sectorFocus: MemorySectorFocus;

  protected constructor(sectorFocus: MemorySectorFocus) {
    this.sectorFocus = sectorFocus;
  }

  static byte(group: MifareClassicBlockGroup, index: number): MemoryFocus {
    const byf = MemoryByteFocus.from(group, index);
    const gf = MemoryBlockGroupFocus.from(group, byf);
    const bf = MemoryBlockFocus.from(group.block, gf);
    const sf = MemorySectorFocus.from(group.block.sector, bf);

    return new MemoryFocus(sf);
  }
}
