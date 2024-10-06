import mitt from "mitt";
import MemoryByteEvent from "./MemoryByteEvent";

const memoryByteEmits = mitt<{
  mouseEnter: MemoryByteEvent;
  mouseLeave: MemoryByteEvent;
  mouseClick: MemoryByteEvent;
}>();

export default memoryByteEmits;
