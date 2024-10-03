import { MifareClassicBlock, MifareClassicBlockByteGroup, MifareClassicSector } from "@/models/MifareClassic";
import mitt from "mitt";

interface MemoryBlockByteBaseEvent {
  sector: MifareClassicSector;
  block?: MifareClassicBlock;
  byteGroup: MifareClassicBlockByteGroup;
  byteIndex: number;
}

export interface MemoryBlockByteClickEvent extends MemoryBlockByteBaseEvent { }

export interface MemoryBlockByteHoverEvent extends MemoryBlockByteBaseEvent { }

const emits = mitt<{
  byteClick: MemoryBlockByteClickEvent;
  byteHover: MemoryBlockByteHoverEvent;
}>();

export default emits;
