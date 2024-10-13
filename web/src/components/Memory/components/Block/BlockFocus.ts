
import { MifareClassicBlock } from "@/models/MifareClassic";
import BlockGroupFocus from "@Memory/components/BlockGroup/BlockGroupFocus";

export default class BlockFocus {
  readonly block: MifareClassicBlock;
  readonly groupFocus?: BlockGroupFocus;

  protected constructor(block: MifareClassicBlock, groupFocus?: BlockGroupFocus) {
    this.block = block;
    this.groupFocus = groupFocus;
  }

  static from(block: MifareClassicBlock, groupFocus?: BlockGroupFocus): BlockFocus {
    return new BlockFocus(block, groupFocus);
  }
}
