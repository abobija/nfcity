import { MifareClassicBlock } from "@/models/MifareClassic";
import MemoryBlockGroupFocus from "../MemoryBlockGroup/MemoryBlockGroupFocus";

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
