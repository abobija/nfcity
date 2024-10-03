import { MifareClassicBlockByteGroup } from "@/models/MifareClassic";

export default interface MemoryBlockByteGroup {
  origin: MifareClassicBlockByteGroup;
  offset: number;
  length: number;
  class: string;
}
