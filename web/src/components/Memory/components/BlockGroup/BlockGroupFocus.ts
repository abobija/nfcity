import { MifareClassicBlockGroup } from "@/models/MifareClassic";
import ByteFocus from "@Memory/components/Byte/ByteFocus";

export default class BlockGroupFocus {
  constructor(
    readonly group: MifareClassicBlockGroup,
    readonly byteFocus?: ByteFocus,
  ) {
    this.group = group;
    this.byteFocus = byteFocus;
  }
}
