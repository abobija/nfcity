import { MifareClassicBlock } from "@/models/MifareClassic";

export default interface MemoryBlockClickEvent {
  block?: MifareClassicBlock;
  byteIndex: number;
}
