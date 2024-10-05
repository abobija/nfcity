import { MifareClassicBlockGroupType } from "@/models/MifareClassic";
import MemoryByteFocus from "../MemoryByte/MemoryByteFocus";

export interface MemoryBlockGroupFocus {
  type: MifareClassicBlockGroupType;
  byteFocus?: MemoryByteFocus;
}
