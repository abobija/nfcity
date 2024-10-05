import { MifareClassicBlockGroup } from "@/models/MifareClassic";
import MemoryByteFocus from "../MemoryByte/MemoryByteFocus";

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
