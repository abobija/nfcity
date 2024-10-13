
import mitt from "mitt";
import ByteEvent from "./events/ByteEvent";

const byteEmits = mitt<{
  mouseEnter: ByteEvent;
  mouseLeave: ByteEvent;
  mouseClick: ByteEvent;
}>();

export default byteEmits;
