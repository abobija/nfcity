import { MifareClassicBlock, MifareClassicBlockByteGroup, MifareClassicSector } from "@/models/MifareClassic";

export interface MemoryBlockByteClickEvent {
  sector: MifareClassicSector;
  block?: MifareClassicBlock;
  byteGroup: MifareClassicBlockByteGroup;
  byteIndex: number;
}

export interface MemoryBlockByteHoverEvent extends MemoryBlockByteClickEvent {

}
