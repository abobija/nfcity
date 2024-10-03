import { MifareClassicBlock, MifareClassicBlockByteGroup } from "@/models/MifareClassic";
import mitt from "mitt";

export interface MemoryBlockByteEvent {
  block: MifareClassicBlock;
  byteGroup: MifareClassicBlockByteGroup;
  byteIndex: number;
}

const emits = mitt<{
  byteEnter: MemoryBlockByteEvent;
  byteLeave: MemoryBlockByteEvent;
  byteClick: MemoryBlockByteEvent;
}>();

export default emits;
