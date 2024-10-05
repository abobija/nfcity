import { MifareClassicBlockGroup } from "@/models/MifareClassic";

export default class MemoryByteFocus {
  readonly group: MifareClassicBlockGroup;
  readonly index: number; // Index withing the block

  protected constructor(group: MifareClassicBlockGroup, index: number) {
    this.group = group;
    this.index = index;
  }

  static from(group: MifareClassicBlockGroup, index: number): MemoryByteFocus {
    return new MemoryByteFocus(group, index);
  }
}
