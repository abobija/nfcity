import mitt from "mitt";
import MemoryByteEvent from "./MemoryByteEvent";

const emits = mitt<{
  mouseEnter: MemoryByteEvent;
  mouseLeave: MemoryByteEvent;
  mouseClick: MemoryByteEvent;
}>();

export default emits;
