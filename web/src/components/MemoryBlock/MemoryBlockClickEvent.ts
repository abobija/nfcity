import { MifareClassicBlock, MifareClassicBlockByteGroup, MifareClassicSector } from "@/models/MifareClassic";

export default interface MemoryBlockClickEvent {
  sector: MifareClassicSector;
  block?: MifareClassicBlock;
  byteGroup: MifareClassicBlockByteGroup;
  byteIndex: number;
}
