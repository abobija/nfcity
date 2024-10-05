import { MifareClassicBlockGroup } from "@/models/MifareClassic";

export default interface MemoryBlockGroup {
  origin: MifareClassicBlockGroup;
  offset: number;
  length: number;
  class: string;
}
