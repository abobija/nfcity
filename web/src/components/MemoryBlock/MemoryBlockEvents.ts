import { MifareClassicBlock, MifareClassicBlockByteGroup, MifareClassicSector } from "@/models/MifareClassic";
import mitt from "mitt";

export interface MemoryBlockByteEvent {
  sector: MifareClassicSector;
  block?: MifareClassicBlock;
  byteGroup: MifareClassicBlockByteGroup;
  byteIndex: number;
}

const emits = mitt<{
  byteEnter: MemoryBlockByteEvent;
  byteLeave: MemoryBlockByteEvent;
  byteClick: MemoryBlockByteEvent;
}>();

export default emits;
