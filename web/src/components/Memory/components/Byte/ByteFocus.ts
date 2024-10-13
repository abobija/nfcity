import { MifareClassicBlockGroup } from "@/models/MifareClassic";

export default class ByteFocus {
  readonly group: MifareClassicBlockGroup;
  readonly index: number; // Index withing the block

  protected constructor(group: MifareClassicBlockGroup, index: number) {
    this.group = group;
    this.index = index;
  }

  static from(group: MifareClassicBlockGroup, index: number): ByteFocus {
    return new ByteFocus(group, index);
  }
}
