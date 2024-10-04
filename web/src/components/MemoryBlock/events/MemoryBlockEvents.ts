import mitt from "mitt";
import MemoryByteEvent from "./MemoryByteEvent";

const emits = mitt<{
  byteMouseEnter: MemoryByteEvent;
  byteMouseLeave: MemoryByteEvent;
  byteMouseClick: MemoryByteEvent;
}>();

export default emits;
