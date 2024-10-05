import { MifareClassicBlock, MifareClassicBlockGroup } from "@/models/MifareClassic";

export default class MemoryByteEvent {
  readonly block: MifareClassicBlock;
  readonly blockGroup: MifareClassicBlockGroup;
  readonly byteIndex: number;
  readonly focus: (state?: boolean) => void;

  protected constructor(
    block: MifareClassicBlock,
    blockGroup: MifareClassicBlockGroup,
    byteIndex: number,
    focus: (state?: boolean) => void
  ) {
    this.block = block;
    this.blockGroup = blockGroup;
    this.byteIndex = byteIndex;
    this.focus = focus;
  }

  static from(
    block: MifareClassicBlock,
    blockGroup: MifareClassicBlockGroup,
    byteIndex: number,
    focus: (state?: boolean) => void
  ): MemoryByteEvent {
    return new MemoryByteEvent(block, blockGroup, byteIndex, focus);
  }
}
