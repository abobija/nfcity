
import { MifareClassicBlock } from "@/models/MifareClassic";
import BlockGroupFocus from "@Memory/components/BlockGroup/BlockGroupFocus";

export default class BlockFocus {
  constructor(
    readonly block: MifareClassicBlock,
    readonly groupFocus?: BlockGroupFocus,
  ) {
    this.block = block;
    this.groupFocus = groupFocus;
  }
}
