
import { onMounted, onUnmounted } from "vue";
import byteEmits from "../byteEmits";
import ByteEvent from "../events/ByteEvent";

export default function onByteMouseClick(hook: (e: ByteEvent) => void) {
  onMounted(() => byteEmits.on('mouseClick', hook));
  onUnmounted(() => byteEmits.off('mouseClick', hook));
}
