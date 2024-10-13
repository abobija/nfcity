import { MifareClassicBlockGroup } from "@/models/MifareClassic";
import ByteFocus from "@Memory/components/Byte/ByteFocus";

export default class BlockGroupFocus {
  readonly group: MifareClassicBlockGroup;
  readonly byteFocus?: ByteFocus;

  protected constructor(group: MifareClassicBlockGroup, byteFocus?: ByteFocus) {
    this.group = group;
    this.byteFocus = byteFocus;
  }

  static from(group: MifareClassicBlockGroup, byteFocus?: ByteFocus): BlockGroupFocus {
    return new BlockGroupFocus(group, byteFocus);
  }
}
