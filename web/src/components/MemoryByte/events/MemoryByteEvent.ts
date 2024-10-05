import { MifareClassicBlockGroup } from "@/models/MifareClassic";

export default class MemoryByteEvent {
  readonly index: number;
  readonly group: MifareClassicBlockGroup;

  protected constructor(index: number, group: MifareClassicBlockGroup) {
    this.index = index;
    this.group = group;
  }

  static from(index: number, group: MifareClassicBlockGroup): MemoryByteEvent {
    return new MemoryByteEvent(index, group);
  }
}
