import MemoryByteFocus from "@/components/MemoryByte/MemoryByteFocus";
import { MifareClassicBlockGroup } from "@/models/MifareClassic";

export default class MemoryBlockGroupFocus {
  readonly group: MifareClassicBlockGroup;
  readonly byteFocus?: MemoryByteFocus;

  protected constructor(group: MifareClassicBlockGroup, byteFocus?: MemoryByteFocus) {
    this.group = group;
    this.byteFocus = byteFocus;
  }

  static from(group: MifareClassicBlockGroup, byteFocus?: MemoryByteFocus): MemoryBlockGroupFocus {
    return new MemoryBlockGroupFocus(group, byteFocus);
  }
}
