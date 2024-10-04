import { MifareClassicBlock, MifareClassicBlockByteGroup } from "@/models/MifareClassic";

export default class MemoryByteEvent {
  readonly block: MifareClassicBlock;
  readonly byteGroup: MifareClassicBlockByteGroup;
  readonly byteIndex: number;
  readonly focus: (state?: boolean) => void;

  protected constructor(
    block: MifareClassicBlock,
    byteGroup: MifareClassicBlockByteGroup,
    byteIndex: number,
    focus: (state?: boolean) => void
  ) {
    this.block = block;
    this.byteGroup = byteGroup;
    this.byteIndex = byteIndex;
    this.focus = focus;
  }

  static from(
    block: MifareClassicBlock,
    byteGroup: MifareClassicBlockByteGroup,
    byteIndex: number,
    focus: (state?: boolean) => void
  ): MemoryByteEvent {
    return new MemoryByteEvent(block, byteGroup, byteIndex, focus);
  }
}
