import MemoryBlockGroupFocus from "@/components/MemoryBlockGroup/MemoryBlockGroupFocus";
import { MifareClassicBlock } from "@/models/MifareClassic";

export default class MemoryBlockFocus {
  readonly block: MifareClassicBlock;
  readonly groupFocus?: MemoryBlockGroupFocus;

  protected constructor(block: MifareClassicBlock, groupFocus?: MemoryBlockGroupFocus) {
    this.block = block;
    this.groupFocus = groupFocus;
  }

  static from(block: MifareClassicBlock, groupFocus?: MemoryBlockGroupFocus): MemoryBlockFocus {
    return new MemoryBlockFocus(block, groupFocus);
  }
}
