import ByteEvent from "@Memory/components/Byte/events/ByteEvent";
import mitt from "mitt";

const byteEmits = mitt<{
  mouseEnter: ByteEvent;
  mouseLeave: ByteEvent;
  mouseClick: ByteEvent;
}>();

export default byteEmits;
