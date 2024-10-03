import { MifareClassicBlock, MifareClassicBlockByteGroup, MifareClassicSector } from "@/models/MifareClassic";

export interface MemoryBlockClickEvent {
  sector: MifareClassicSector;
  block?: MifareClassicBlock;
  byteGroup: MifareClassicBlockByteGroup;
  byteIndex: number;
}

export interface MemoryBlockHoverEvent extends MemoryBlockClickEvent {

}
