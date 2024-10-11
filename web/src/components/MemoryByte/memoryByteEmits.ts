import MemoryByteEvent from "@/components/MemoryByte/events/MemoryByteEvent";
import mitt from "mitt";

const memoryByteEmits = mitt<{
  mouseEnter: MemoryByteEvent;
  mouseLeave: MemoryByteEvent;
  mouseClick: MemoryByteEvent;
}>();

export default memoryByteEmits;
